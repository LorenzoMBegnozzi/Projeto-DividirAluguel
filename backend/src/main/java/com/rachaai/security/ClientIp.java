package com.rachaai.security;

import jakarta.servlet.http.HttpServletRequest;

/**
 * IP de quem fez a requisição. Atrás do Nginx do frontend, o IP real vem no cabeçalho X-Real-IP,
 * que o próprio Nginx sobrescreve com o endereço da conexão (o cliente não consegue forjar).
 * Em prod a API só é acessível pelo Nginx; em dev/homolog, quem chama a API direto na porta dela
 * poderia forjar o cabeçalho, o que não importa fora de produção.
 */
public final class ClientIp {

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Porta de origem do cliente (necessária para identificar alguém atrás de IP compartilhado,
     * o CGNAT das operadoras). Atrás do Nginx vem em X-Real-Port; direto, é a porta da conexão.
     */
    public static Integer portOf(HttpServletRequest request) {
        String realPort = request.getHeader("X-Real-Port");
        if (realPort != null && !realPort.isBlank()) {
            try {
                return Integer.valueOf(realPort.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return request.getRemotePort();
    }
}
