package com.rachaai.admin;

import com.rachaai.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

/**
 * Quem é administrador: as contas cujos e-mails estão em ADMIN_EMAILS (separados por vírgula),
 * no .env de cada ambiente. Ao subir, o backend marca essas contas como admin. Não existe tela
 * para virar admin: só quem tem acesso ao servidor decide.
 *
 * Tirar um e-mail da lista NÃO remove o admin (evita perder o acesso por um erro de digitação);
 * para remover, rode no banco: UPDATE usuarios SET admin = 0 WHERE email = '...';
 */
@Component
public class AdminBootstrap {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final String adminEmails;

    public AdminBootstrap(UserRepository userRepository, @Value("${app.admin.emails:}") String adminEmails) {
        this.userRepository = userRepository;
        this.adminEmails = adminEmails;
    }

    /** Usado no cadastro: quem se cadastra com um e-mail da lista já nasce admin. */
    public boolean isConfiguredAdmin(String email) {
        return email != null && Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .anyMatch(configured -> configured.equalsIgnoreCase(email.trim()));
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void promoteConfiguredAdmins() {
        Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .forEach(email -> userRepository.findByEmailIgnoreCase(email).ifPresentOrElse(
                        user -> {
                            if (!user.isAdmin()) {
                                user.setAdmin(true);
                                log.info("Conta {} marcada como administrador (ADMIN_EMAILS)", email);
                            }
                        },
                        () -> log.warn("ADMIN_EMAILS tem {}, mas não existe conta com esse e-mail (ela vira admin ao se cadastrar)", email)
                ));
    }
}
