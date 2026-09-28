package com.rachaai.common;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * E-mails do sistema. Cada um vai em duas versões na mesma mensagem: HTML com o layout do site
 * (EmailTemplate) e texto puro, para programas que não mostram HTML (ajuda também a não cair no spam).
 * Assíncrono: o tempo de resposta não revela se o e-mail tem conta; falhas só vão para o log.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final String baseUrl;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String from,
            @Value("${app.base-url}") String baseUrl
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.baseUrl = baseUrl;
    }

    /** Link de confirmação de e-mail enviado no cadastro (e ao pedir "Reenviar e-mail"). */
    @Async
    public void sendEmailConfirmation(String to, String name, String rawToken, int validHours) {
        String link = baseUrl + "/confirmar-email/" + rawToken;
        String text = """
                Olá, %s!

                Falta pouco para usar o RachaAi. Confirme que este e-mail é seu acessando o link abaixo
                (válido por %d horas):

                %s

                Até confirmar, você já pode entrar e completar o perfil, mas ainda não consegue anunciar
                nem conversar com outras pessoas.

                Se você não criou uma conta no RachaAi, ignore este e-mail.
                """.formatted(name, validHours, link);
        String html = EmailTemplate.render(
                "Confirme seu e-mail para começar a usar o RachaAi.",
                "Confirme seu e-mail",
                new String[]{
                        "Olá, <strong>" + EmailTemplate.escape(name) + "</strong>!",
                        "Falta pouco para usar o RachaAi. Confirme que este e-mail é seu para poder anunciar e conversar com outras pessoas.",
                },
                "Confirmar e-mail",
                link,
                "O link vale por <strong>" + validHours + " horas</strong>. Até confirmar, você já pode entrar e completar o perfil.",
                "Se você não criou uma conta no RachaAi, ignore este e-mail."
        );
        send(to, "RachaAi - confirme seu e-mail", text, html, "confirmação");
    }

    @Async
    public void sendPasswordReset(String to, String name, String rawToken, int validMinutes) {
        String link = baseUrl + "/redefinir-senha/" + rawToken;
        String text = """
                Olá, %s!

                Recebemos um pedido para redefinir a senha da sua conta no RachaAi.
                Para criar uma senha nova, acesse o link abaixo (válido por %d minutos):

                %s

                Se não foi você, ignore este e-mail: sua senha continua a mesma.
                """.formatted(name, validMinutes, link);
        String html = EmailTemplate.render(
                "Crie uma senha nova para a sua conta no RachaAi.",
                "Redefinir sua senha",
                new String[]{
                        "Olá, <strong>" + EmailTemplate.escape(name) + "</strong>!",
                        "Recebemos um pedido para redefinir a senha da sua conta no RachaAi. Clique no botão para criar uma senha nova.",
                },
                "Criar senha nova",
                link,
                "O link vale por <strong>" + validMinutes + " minutos</strong> e só pode ser usado uma vez. Ao trocar a senha, você sai de todos os aparelhos.",
                "Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma."
        );
        send(to, "RachaAi - redefinição de senha", text, html, "redefinição de senha");
    }

    private void send(String to, String subject, String text, String html, String kind) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart: o programa de e-mail escolhe entre o HTML e o texto puro
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de {}", kind, e);
        }
    }
}
