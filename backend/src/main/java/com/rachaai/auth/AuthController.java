package com.rachaai.auth;

import com.rachaai.accesslog.AccessLogFilter;
import com.rachaai.security.ClientIp;
import com.rachaai.security.SecurityUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailConfirmationService emailConfirmationService;
    private final GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, EmailConfirmationService emailConfirmationService,
                          GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.emailConfirmationService = emailConfirmationService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        AuthResponse response = authService.register(request, ClientIp.of(http));
        http.setAttribute(AccessLogFilter.USER_ID_ATTRIBUTE, response.user().id());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        AuthResponse response = authService.login(request, ClientIp.of(http));
        http.setAttribute(AccessLogFilter.USER_ID_ATTRIBUTE, response.user().id());
        return ResponseEntity.ok(response);
    }

    /** O site pergunta se o login com Google está ligado (e com qual Client ID desenhar o botão). */
    @GetMapping("/google/config")
    public GoogleConfigResponse googleConfig() {
        return googleAuthService.config();
    }

    @PostMapping("/google")
    public ResponseEntity<GoogleLoginResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request, HttpServletRequest http) {
        GoogleLoginResponse response = googleAuthService.login(request, ClientIp.of(http));
        if (response.user() != null) {
            http.setAttribute(AccessLogFilter.USER_ID_ATTRIBUTE, response.user().id());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/cadastro")
    public ResponseEntity<AuthResponse> googleSignup(@Valid @RequestBody GoogleSignupRequest request, HttpServletRequest http) {
        AuthResponse response = googleAuthService.completeSignup(request, ClientIp.of(http));
        http.setAttribute(AccessLogFilter.USER_ID_ATTRIBUTE, response.user().id());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest http) {
        return ResponseEntity.ok(authService.forgotPassword(request, ClientIp.of(http)));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest http) {
        authService.resetPassword(request, ClientIp.of(http));
        return ResponseEntity.noContent().build();
    }

    /** O link do e-mail de confirmação (/confirmar-email/<token>) chama esta rota. */
    @PostMapping("/confirmar-email")
    public ResponseEntity<Void> confirmEmail(@Valid @RequestBody ConfirmEmailRequest request) {
        emailConfirmationService.confirm(request.token());
        return ResponseEntity.noContent().build();
    }

    /** Sem login válido não há o que invalidar: responde 204 do mesmo jeito. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal SecurityUser principal) {
        if (principal != null) {
            authService.logout(principal.getId());
        }
        return ResponseEntity.noContent().build();
    }
}
