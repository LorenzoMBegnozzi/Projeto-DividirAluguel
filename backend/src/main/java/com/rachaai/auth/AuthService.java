package com.rachaai.auth;

import com.rachaai.common.ApiException;
import com.rachaai.common.CpfValidator;
import com.rachaai.common.EmailService;
import com.rachaai.security.JwtService;
import com.rachaai.user.Role;
import com.rachaai.user.User;
import com.rachaai.user.UserPhotoRepository;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    private static final int MINIMUM_AGE = 18;
    private static final int RESET_TOKEN_VALID_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserPhotoRepository userPhotoRepository;
    private final EmailService emailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            UserPhotoRepository userPhotoRepository,
            EmailService emailService
    ) {
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userPhotoRepository = userPhotoRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Já existe uma conta com este e-mail");
        }
        if (Period.between(request.birthDate(), LocalDate.now()).getYears() < MINIMUM_AGE) {
            throw ApiException.badRequest("Você precisa ter " + MINIMUM_AGE + " anos ou mais para se cadastrar");
        }

        String cpf = CpfValidator.onlyDigits(request.cpf());
        if (!CpfValidator.isValid(cpf)) {
            throw ApiException.badRequest("CPF inválido");
        }
        if (userRepository.existsByCpf(cpf)) {
            throw ApiException.conflict("Já existe uma conta com este CPF");
        }

        boolean renter = request.role() == Role.RENTER;
        boolean advertiser = request.role() == Role.ADVERTISER;
        User user = new User(
                request.name(),
                request.email().toLowerCase(),
                passwordEncoder.encode(request.password()),
                request.birthDate(),
                cpf,
                renter,
                advertiser,
                advertiser ? request.advertiserKind() : null
        );
        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserResponse.from(user, false));
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));
        } catch (BadCredentialsException ex) {
            throw ApiException.unauthorized("E-mail ou senha inválidos");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> ApiException.unauthorized("E-mail ou senha inválidos"));

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserResponse.from(user, userPhotoRepository.existsByUserId(user.getId())));
    }

    /** A mensagem nunca revela se o e-mail existe; o link vai só por e-mail. */
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        var response = new ForgotPasswordResponse("Se esse e-mail tiver uma conta, enviamos um link para redefinir a senha.");
        var userOpt = userRepository.findByEmailIgnoreCase(request.email());
        if (userOpt.isEmpty()) {
            return response;
        }

        String rawToken = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = new PasswordResetToken(
                userOpt.get(),
                hashToken(rawToken),
                Instant.now().plus(RESET_TOKEN_VALID_MINUTES, ChronoUnit.MINUTES)
        );
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordReset(userOpt.get().getEmail(), userOpt.get().getName(), rawToken, RESET_TOKEN_VALID_MINUTES);
        return response;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashToken(request.token()))
                .filter(PasswordResetToken::isValid)
                .orElseThrow(() -> ApiException.badRequest("Link inválido ou expirado. Peça uma nova redefinição."));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        resetToken.markUsed();
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
