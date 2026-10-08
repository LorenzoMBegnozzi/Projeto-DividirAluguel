package com.rachaai.common;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Layout dos e-mails (EmailTemplate)")
class EmailTemplateTest {

    private String render(String name, String link) {
        return EmailTemplate.render("prévia", "Confirme seu e-mail",
                new String[]{"Olá, <strong>" + EmailTemplate.escape(name) + "</strong>!"},
                "Confirmar e-mail", link, "vale por 24 horas", "ignore se não foi você");
    }

    @Test
    @DisplayName("tem o botão e o link por extenso")
    void hasButtonAndFallbackLink() {
        String html = render("Ana", "http://localhost:8082/confirmar-email/abc123");
        assertThat(html).contains("Confirmar e-mail")
                .contains("href=\"http://localhost:8082/confirmar-email/abc123\"")
                .contains("Toc Toc <span");
    }

    @Test
    @DisplayName("nome com HTML aparece como texto, sem virar código")
    void escapesUserName() {
        String html = render("<script>alert(1)</script><a href=x>", "http://x/y");
        assertThat(html).doesNotContain("<script>").doesNotContain("<a href=x>")
                .contains("&lt;script&gt;");
    }
}
