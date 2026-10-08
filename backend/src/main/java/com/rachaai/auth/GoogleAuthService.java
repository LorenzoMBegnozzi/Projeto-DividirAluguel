package com.rachaai.auth;

import com.rachaai.common.ApiException;
import com.rachaai.security.JwtService;
import com.rachaai.security.RateLimiter;
import com.rachaai.user.User;
import com.rachaai.user.UserPhotoRepository;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import io.jsonwebtoken.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * "Continuar com Google".
 *
 * Entrar: o Google confirma quem é a pessoa (GoogleTokenVerifier). Se já existe conta ligada a
 * essa conta do Google, ou com o mesmo e-mail, entra nela. Se não existe, NÃO cria nada ainda:
 * devolve um comprovante de 30 min e o site abre a tela obrigatória "falta pouco", que pede o que
 * o Google não informa (perfil, nascimento, CPF e o aceite dos termos). A conta só nasce quando a
 * pessoa completa essa tela, com as mesmas regras do cadastro por e-mail (18+, CPF válido e único).
 * Assim não fica conta pela metade no banco, nem dado de quem não pode ter conta (menor de idade).
 */
@Service
public class GoogleAuthService {

    private final GoogleTokenVerifier verifier;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserPhotoRepository userPhotoRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiter rateLimiter;

    public GoogleAuthService(GoogleTokenVerifier verifier, AuthService authService, UserRepository userRepository,
                             UserPhotoRepository userPhotoRepository, JwtService jwtService,
                             PasswordEncoder passwordEncoder, RateLimiter rateLimiter) {
        this.verifier = verifier;
        this.authService = authService;
        this.userRepository = userRepository;
        this.userPhotoRepository = userPhotoRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
    }

    public GoogleConfigResponse config() {
        return new GoogleConfigResponse(verifier.clientId());
    }

    @Transactional
    public GoogleLoginResponse login(GoogleLoginRequest request, String clientIp) {
        rateLimiter.hit(rateLimiter.LOGIN_ATTEMPTS_PER_IP, clientIp);
        GoogleIdentity google = verifier.verify(request.credential());
        if (google.email() == null || !google.emailVerified()) {
            throw ApiException.badRequest("Esta conta do Google não tem um e-mail confirmado. Entre com e-mail e senha.");
        }

        Optional<User> existing = userRepository.findByGoogleSub(google.subject())
                .or(() -> userRepository.findByEmailIgnoreCase(google.email()));
        if (existing.isEmpty()) {
            return GoogleLoginResponse.signupRequired(
                    jwtService.generateGoogleSignupToken(google), displayName(google), google.email().toLowerCase());
        }

        User user = existing.get();
        if (user.isBlocked()) {
            throw ApiException.forbidden("Esta conta foi bloqueada pela moderação. Se acha que é um engano, fale com o suporte.");
        }
        if (user.getGoogleSub() == null) {
            // Conta com o mesmo e-mail, criada com senha: o Google provou que o e-mail é desta pessoa.
            // Se o e-mail dela ainda não tinha sido confirmado, a senha pode ter sido criada por
            // outra pessoa usando este e-mail: troca a senha por uma que ninguém sabe e derruba os
            // logins abertos (a dona pode criar uma senha nova em "esqueci minha senha").
            if (!user.isEmailConfirmed()) {
                user.setPasswordHash(unusablePassword());
                user.revokeSessions();
            }
            user.linkGoogle(google.subject());
        }
        user.confirmEmail();

        String token = jwtService.generateToken(user);
        return GoogleLoginResponse.loggedIn(token, UserResponse.from(user, userPhotoRepository.existsByUserId(user.getId())));
    }

    /** Tela "falta pouco": cria a conta com os dados do Google + o que a pessoa preencheu. */
    @Transactional
    public AuthResponse completeSignup(GoogleSignupRequest request, String clientIp) {
        rateLimiter.hit(rateLimiter.REGISTER_PER_IP, clientIp);
        GoogleIdentity google;
        try {
            google = jwtService.parseGoogleSignupToken(request.signupToken());
        } catch (JwtException | IllegalArgumentException ex) {
            throw ApiException.badRequest("O tempo para completar o cadastro acabou. Toque em \"continuar com Google\" de novo.");
        }
        if (userRepository.findByGoogleSub(google.subject()).isPresent()) {
            throw ApiException.conflict("Esta conta do Google já tem cadastro. Toque em \"continuar com Google\" para entrar.");
        }

        String cpf = authService.validateNewAccount(google.email(), request.birthDate(), request.cpf());
        User user = authService.newAccount(displayName(google), google.email(), unusablePassword(),
                request.birthDate(), cpf, request.role(), request.advertiserKind());
        user.linkGoogle(google.subject());
        user.confirmEmail();   // o Google já confirmou o e-mail

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, UserResponse.from(user, false));
    }

    /** Sem senha própria: a pessoa entra pelo Google (e pode criar uma senha em "esqueci minha senha"). */
    private String unusablePassword() {
        return passwordEncoder.encode(UUID.randomUUID().toString());   // BCrypt aceita até 72 bytes
    }

    private static String displayName(GoogleIdentity google) {
        if (google.name() != null && !google.name().isBlank()) {
            return google.name().trim().length() > 120 ? google.name().trim().substring(0, 120) : google.name().trim();
        }
        return google.email().substring(0, google.email().indexOf('@'));
    }
}
