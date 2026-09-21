package com.rachaai.auth;

import com.rachaai.common.ApiException;
import com.rachaai.common.CpfValidator;
import com.rachaai.security.JwtService;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    private static final int MINIMUM_AGE = 18;

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

        User user = new User(
                request.name(),
                request.email().toLowerCase(),
                passwordEncoder.encode(request.password()),
                request.birthDate(),
                cpf,
                request.role()
        );
        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserResponse.from(user));
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
        return new AuthResponse(token, UserResponse.from(user));
    }
}
