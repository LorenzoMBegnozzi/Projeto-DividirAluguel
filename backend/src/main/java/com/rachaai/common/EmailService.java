package com.rachaai.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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

    /** Assíncrono para o tempo de resposta não revelar se o e-mail tem conta; falhas só vão pro log. */
    @Async
    public void sendPasswordReset(String to, String name, String rawToken, int validMinutes) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("RachaAi - redefinição de senha");
        message.setText("""
                Olá, %s!

                Recebemos um pedido para redefinir a senha da sua conta no RachaAi.
                Para criar uma senha nova, acesse o link abaixo (válido por %d minutos):

                %s/redefinir-senha/%s

                Se não foi você, ignore este e-mail: sua senha continua a mesma.
                """.formatted(name, validMinutes, baseUrl, rawToken));
        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de redefinição de senha", e);
        }
    }
}
