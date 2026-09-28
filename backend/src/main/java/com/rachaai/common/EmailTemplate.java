package com.rachaai.common;

import org.springframework.web.util.HtmlUtils;

/**
 * Layout dos e-mails do RachaAi (mesmas cores do site): cabeçalho com a marca, cartão branco,
 * botão de ação e o link por extenso como alternativa.
 *
 * E-mail em HTML não aceita o CSS moderno do site: tudo é montado com tabelas e estilos escritos
 * em cada elemento, que é o que Gmail, Outlook e Hotmail entendem. Cada e-mail também tem uma
 * versão em texto puro (ver EmailService), para programas que não mostram HTML.
 *
 * Tudo que vem do usuário (o nome) passa por escape(): um nome como "<script>" aparece como
 * texto, sem virar HTML.
 */
public final class EmailTemplate {

    private static final String BRAND = "#c23f27";
    private static final String BRAND_TINT = "#fbe6de";
    private static final String PAPER = "#f6f2ec";
    private static final String LINE = "#e3dcd2";
    private static final String INK = "#1d1a17";
    private static final String INK_2 = "#4f4842";
    private static final String INK_3 = "#6f665e";
    private static final String FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

    private EmailTemplate() {
    }

    /**
     * @param preheader   texto curto que os programas de e-mail mostram ao lado do assunto
     * @param title       título grande do cartão
     * @param paragraphs  parágrafos já em HTML seguro (use escape() no que vier do usuário)
     * @param buttonText  texto do botão
     * @param buttonUrl   para onde o botão leva
     * @param note        aviso pequeno depois do botão (ex.: validade do link)
     * @param footer      rodapé (ex.: "se não foi você, ignore")
     */
    public static String render(String preheader, String title, String[] paragraphs,
                                String buttonText, String buttonUrl, String note, String footer) {
        StringBuilder body = new StringBuilder();
        for (String p : paragraphs) {
            body.append("<p style=\"margin:0 0 16px;font-size:16px;line-height:24px;color:").append(INK_2).append(";\">")
                    .append(p).append("</p>");
        }
        String url = HtmlUtils.htmlEscape(buttonUrl);

        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="color-scheme" content="light">
                <title>%1$s</title>
                </head>
                <body style="margin:0;padding:0;background-color:%2$s;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;">%3$s</div>
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" bgcolor="%2$s" style="background-color:%2$s;">
                  <tr><td align="center" style="padding:32px 16px;">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;font-family:%4$s;">
                      <tr><td align="center" style="padding:0 0 20px;">
                        <span style="font-size:28px;font-weight:900;letter-spacing:-0.5px;color:%5$s;">Racha<span style="color:%6$s;">Ai</span></span>
                      </td></tr>
                      <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid %7$s;border-radius:12px;padding:32px 28px;">
                        <h1 style="margin:0 0 16px;font-size:22px;line-height:28px;font-weight:800;color:%5$s;">%1$s</h1>
                        %8$s
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
                          <tr><td align="center" bgcolor="%6$s" style="border-radius:8px;">
                            <a href="%9$s" target="_blank" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">%10$s</a>
                          </td></tr>
                        </table>
                        <p style="margin:0 0 20px;padding:10px 14px;background-color:%11$s;border-radius:8px;font-size:14px;line-height:20px;color:%12$s;">%13$s</p>
                        <p style="margin:0;font-size:13px;line-height:20px;color:%14$s;">Se o botão não funcionar, copie e cole este endereço no navegador:<br>
                          <a href="%9$s" target="_blank" style="color:%6$s;word-break:break-all;">%9$s</a></p>
                      </td></tr>
                      <tr><td align="center" style="padding:20px 8px 0;font-size:12px;line-height:18px;color:%14$s;">
                        %15$s<br>RachaAi · dividir moradia em Maringá
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
                </body>
                </html>
                """.formatted(
                escape(title), PAPER, escape(preheader), FONT, INK, BRAND, LINE,
                body, url, escape(buttonText), BRAND_TINT, INK, note, INK_3, footer);
    }

    /** Escapa texto para ir dentro do HTML (nomes, títulos). */
    public static String escape(String text) {
        return text == null ? "" : HtmlUtils.htmlEscape(text);
    }
}
