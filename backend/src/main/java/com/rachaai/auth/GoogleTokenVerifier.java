package com.rachaai.auth;

import com.rachaai.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Confere o token que o botão "continuar com Google" (Google Identity Services) entrega ao site.
 * O token é um JWT assinado pelo Google: aqui conferimos a assinatura com as chaves públicas do
 * Google (baixadas e guardadas em cache pelo Nimbus), o emissor, a validade e se ele foi emitido
 * para o NOSSO app (audience = GOOGLE_CLIENT_ID). Sem isso, qualquer site poderia mandar um token
 * do Google emitido para ele e entrar na conta de alguém aqui.
 *
 * Sem GOOGLE_CLIENT_ID configurado, o login com Google fica desligado (o site esconde o botão).
 */
@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> GOOGLE_ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final String clientId;
    private volatile JwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean isEnabled() {
        return !clientId.isEmpty();
    }

    /** O Client ID não é segredo: o site precisa dele para desenhar o botão. */
    public String clientId() {
        return isEnabled() ? clientId : null;
    }

    public GoogleIdentity verify(String idToken) {
        if (!isEnabled()) {
            throw ApiException.badRequest("O login com Google não está disponível no momento.");
        }
        Jwt jwt;
        try {
            jwt = decoder().decode(idToken);
        } catch (JwtException ex) {
            throw ApiException.unauthorized("Não foi possível confirmar o login com o Google. Tente de novo.");
        }
        return new GoogleIdentity(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
                jwt.getClaimAsString("name"));
    }

    private JwtDecoder decoder() {
        if (decoder == null) {
            synchronized (this) {
                if (decoder == null) {
                    NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS).build();
                    OAuth2TokenValidator<Jwt> issuer = jwt -> GOOGLE_ISSUERS.contains(jwt.getClaimAsString("iss"))
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "emissor não é o Google", null));
                    OAuth2TokenValidator<Jwt> audience = jwt -> jwt.getAudience() != null && jwt.getAudience().contains(clientId)
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "token emitido para outro app", null));
                    d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(), issuer, audience));
                    decoder = d;
                }
            }
        }
        return decoder;
    }
}
