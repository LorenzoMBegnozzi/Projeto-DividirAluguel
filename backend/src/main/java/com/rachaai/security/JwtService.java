package com.rachaai.security;

import com.rachaai.auth.GoogleIdentity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import com.rachaai.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    /** Tipo do token de "completar cadastro com Google" (ver generateGoogleSignupToken). */
    private static final String GOOGLE_SIGNUP_TYPE = "google-signup";
    private static final long GOOGLE_SIGNUP_MINUTES = 30;

    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
        this.expirationMinutes = expirationMinutes;
    }

    /** O "ver" é a versão de sessão da conta: se ela mudar (sair, trocar senha, bloqueio), o token cai. */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMinutes * 60_000);
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("ver", user.getTokenVersion())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /**
     * Comprovante de curta duração (30 min) para a tela "falta pouco" do login com Google: guarda
     * quem o Google confirmou, até a pessoa completar o cadastro. NÃO é login: o assunto não é um
     * e-mail e o "typ" faz isValid recusar, então ele não abre nenhuma rota protegida.
     */
    public String generateGoogleSignupToken(GoogleIdentity identity) {
        Date now = new Date();
        return Jwts.builder()
                .subject("google:" + identity.subject())
                .claim("typ", GOOGLE_SIGNUP_TYPE)
                .claim("email", identity.email())
                .claim("name", identity.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + GOOGLE_SIGNUP_MINUTES * 60_000))
                .signWith(key)
                .compact();
    }

    /** Lê o comprovante de generateGoogleSignupToken; expirado, adulterado ou de outro tipo → JwtException. */
    public GoogleIdentity parseGoogleSignupToken(String token) {
        Claims claims = extractAllClaims(token);
        if (!GOOGLE_SIGNUP_TYPE.equals(claims.get("typ", String.class)) || !claims.getSubject().startsWith("google:")) {
            throw new JwtException("não é um comprovante de cadastro com Google");
        }
        return new GoogleIdentity(claims.getSubject().substring("google:".length()),
                claims.get("email", String.class), true, claims.get("name", String.class));
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        return extractAllClaims(token).get("uid", Long.class);
    }

    /** Tokens emitidos antes da versão de sessão existir não têm "ver": contam como 0. */
    public int extractTokenVersion(String token) {
        Integer version = extractAllClaims(token).get("ver", Integer.class);
        return version == null ? 0 : version;
    }

    public boolean isValid(String token, SecurityUser user) {
        String email = extractEmail(token);
        return email.equals(user.getUsername())
                && extractAllClaims(token).get("typ") == null   // só token de login (não o de cadastro)
                && !isExpired(token)
                && extractTokenVersion(token) == user.getUser().getTokenVersion()
                && !user.getUser().isBlocked();
    }

    private boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
