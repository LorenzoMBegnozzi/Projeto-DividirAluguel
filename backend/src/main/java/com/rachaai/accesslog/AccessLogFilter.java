package com.rachaai.accesslog;

import com.rachaai.security.ClientIp;
import com.rachaai.security.SecurityUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Registra cada chamada à API em registros_acesso (Marco Civil). Roda dentro da cadeia do
 * Spring Security, então já sabe quem está logado. Rotas de conta (login, cadastro, logout,
 * redefinir senha, excluir conta) viram eventos próprios; o resto é ACESSO.
 */
@Component
@ConditionalOnProperty(name = "app.access-log.enabled", havingValue = "true", matchIfMissing = true)
public class AccessLogFilter extends OncePerRequestFilter {

    /** Quem ainda não está no contexto de segurança (login/cadastro) é informado por este atributo. */
    public static final String USER_ID_ATTRIBUTE = "rachaai.accessLog.userId";

    private final AccessLogService accessLogService;

    public AccessLogFilter(AccessLogService accessLogService) {
        this.accessLogService = accessLogService;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/") || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        // O id de quem vai sair/excluir a conta precisa ser lido antes: depois o token já não vale.
        Long userBefore = currentUserId();
        try {
            filterChain.doFilter(request, response);
        } finally {
            String path = request.getRequestURI();
            int status = response.getStatus();
            Long userId = currentUserId();
            if (userId == null) {
                userId = userBefore;
            }
            if (userId == null && request.getAttribute(USER_ID_ATTRIBUTE) instanceof Long id) {
                userId = id;
            }
            accessLogService.record(userId, ClientIp.of(request), ClientIp.portOf(request),
                    classify(request.getMethod(), path, status), request.getMethod(), path, status);
        }
    }

    static AccessEvent classify(String method, String path, int status) {
        boolean ok = status >= 200 && status < 300;
        if (!"POST".equals(method)) {
            return AccessEvent.ACESSO;
        }
        return switch (path) {
            case "/api/auth/login" -> ok ? AccessEvent.LOGIN : AccessEvent.LOGIN_FALHOU;
            case "/api/auth/register" -> ok ? AccessEvent.CADASTRO : AccessEvent.ACESSO;
            case "/api/auth/logout" -> AccessEvent.LOGOUT;
            case "/api/auth/redefinir-senha" -> ok ? AccessEvent.SENHA_REDEFINIDA : AccessEvent.ACESSO;
            case "/api/users/me/excluir-conta" -> ok ? AccessEvent.CONTA_EXCLUIDA : AccessEvent.ACESSO;
            default -> AccessEvent.ACESSO;
        };
    }

    private static Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof SecurityUser user ? user.getId() : null;
    }
}
