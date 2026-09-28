package com.rachaai.auth;

import com.rachaai.common.ApiException;
import com.rachaai.common.EmailService;
import com.rachaai.common.TokenHasher;
import com.rachaai.security.RateLimiter;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Confirmação de e-mail: no cadastro vai um link por e-mail; clicar marca a conta como confirmada.
 * Sem confirmar, a conta entra e mexe no próprio perfil, mas não anuncia, não conversa e não
 * demonstra interesse (ver User.requireConfirmedEmail).
 *
 * app.email-confirmation.auto-confirm-domain: e-mails desse domínio já nascem confirmados. Só para
 * dev/homolog (as contas @teste.com do "seed"); em produção fica vazio.
 */
@Service
public class EmailConfirmationService {

    static final int VALID_HOURS = 24;

    private final EmailConfirmationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;
    private final String autoConfirmDomain;

    public EmailConfirmationService(
            EmailConfirmationTokenRepository tokenRepository,
            UserRepository userRepository,
            EmailService emailService,
            RateLimiter rateLimiter,
            @Value("${app.email-confirmation.auto-confirm-domain:}") String autoConfirmDomain
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.autoConfirmDomain = autoConfirmDomain.trim().toLowerCase();
    }

    /** Chamado no cadastro, com a conta já salva. */
    @Transactional
    public void start(User user) {
        if (!autoConfirmDomain.isEmpty() && user.getEmail().toLowerCase().endsWith("@" + autoConfirmDomain)) {
            user.confirmEmail();
            return;
        }
        sendNewLink(user);
    }

    /** O link do e-mail. Público: quem clica pode nem estar logado. */
    @Transactional
    public void confirm(String rawToken) {
        EmailConfirmationToken token = tokenRepository.findByTokenHash(TokenHasher.hash(rawToken))
                .filter(EmailConfirmationToken::isValid)
                .orElseThrow(() -> ApiException.badRequest(
                        "Link inválido ou expirado. Entre na sua conta e peça um novo em \"Reenviar e-mail\"."));
        token.getUser().confirmEmail();
        token.markUsed();
    }

    /** "Reenviar e-mail": até 3 por hora por conta. Invalida os links anteriores. */
    @Transactional
    public void resend(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        if (user.isEmailConfirmed()) {
            return;
        }
        rateLimiter.hit(rateLimiter.EMAIL_CONFIRMATION_RESEND_PER_USER, String.valueOf(userId));
        tokenRepository.invalidateAllForUser(userId);
        sendNewLink(user);
    }

    private void sendNewLink(User user) {
        String rawToken = TokenHasher.newRawToken();
        tokenRepository.save(new EmailConfirmationToken(
                user, TokenHasher.hash(rawToken), Instant.now().plus(VALID_HOURS, ChronoUnit.HOURS)));
        emailService.sendEmailConfirmation(user.getEmail(), user.getName(), rawToken, VALID_HOURS);
    }
}
