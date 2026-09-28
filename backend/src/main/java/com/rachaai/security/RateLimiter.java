package com.rachaai.security;

import com.rachaai.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite de tentativas em janela deslizante, em memória: "no máximo N eventos por chave nos
 * últimos X minutos". Usado no login, cadastro e esqueci/redefinir senha contra força bruta e
 * disparo de e-mails em massa.
 *
 * Fica na memória do backend: basta para uma instância só (é o caso hoje). Com mais de uma
 * instância atrás de um balanceador, trocar por um contador compartilhado (ex.: Redis).
 */
@Component
public class RateLimiter {

    /** Regra: até {@code max} eventos a cada {@code window}. */
    public record Limit(String name, int max, Duration window) {
    }

    // Os máximos vêm de app.rate-limit.* (application.yml). Os padrões são os de produção;
    // dev e homolog afrouxam o cadastro por IP para o "seed" conseguir criar as contas de exemplo.
    // Login: erros por e-mail (protege a conta) e tentativas por IP (protege contra varrer contas).
    public final Limit LOGIN_FAILURES_PER_EMAIL;
    public final Limit LOGIN_ATTEMPTS_PER_IP;
    public final Limit REGISTER_PER_IP;
    public final Limit FORGOT_PER_IP;
    public final Limit FORGOT_PER_EMAIL;
    public final Limit RESET_PER_IP;
    public final Limit EMAIL_CONFIRMATION_RESEND_PER_USER;

    private final Map<String, Deque<Long>> events = new ConcurrentHashMap<>();

    public RateLimiter(
            @Value("${app.rate-limit.login-erros-por-email:5}") int loginFailuresPerEmail,
            @Value("${app.rate-limit.login-por-ip:20}") int loginAttemptsPerIp,
            @Value("${app.rate-limit.cadastro-por-ip:5}") int registerPerIp,
            @Value("${app.rate-limit.esqueci-senha-por-ip:5}") int forgotPerIp,
            @Value("${app.rate-limit.esqueci-senha-por-email:3}") int forgotPerEmail,
            @Value("${app.rate-limit.redefinir-senha-por-ip:10}") int resetPerIp,
            @Value("${app.rate-limit.reenviar-confirmacao-por-conta:3}") int confirmationResendPerUser
    ) {
        LOGIN_FAILURES_PER_EMAIL = new Limit("login-email", loginFailuresPerEmail, Duration.ofMinutes(15));
        LOGIN_ATTEMPTS_PER_IP = new Limit("login-ip", loginAttemptsPerIp, Duration.ofMinutes(5));
        REGISTER_PER_IP = new Limit("cadastro-ip", registerPerIp, Duration.ofHours(1));
        FORGOT_PER_IP = new Limit("esqueci-ip", forgotPerIp, Duration.ofHours(1));
        FORGOT_PER_EMAIL = new Limit("esqueci-email", forgotPerEmail, Duration.ofHours(1));
        RESET_PER_IP = new Limit("redefinir-ip", resetPerIp, Duration.ofHours(1));
        EMAIL_CONFIRMATION_RESEND_PER_USER = new Limit("reenviar-confirmacao", confirmationResendPerUser, Duration.ofHours(1));
    }

    /** Recusa (429) se a chave já estourou o limite. Não conta um evento novo. */
    public void check(Limit limit, String key) {
        long retryAfter = retryAfterSeconds(limit, key);
        if (retryAfter > 0) {
            throw ApiException.tooManyRequests("Muitas tentativas. Tente de novo em " + humanize(retryAfter) + ".");
        }
    }

    /** Conta um evento para a chave. */
    public void record(Limit limit, String key) {
        Deque<Long> deque = events.computeIfAbsent(limit.name() + ":" + normalize(key), k -> new ArrayDeque<>());
        synchronized (deque) {
            deque.addLast(System.currentTimeMillis());
        }
    }

    /** Confere e já conta: para ações em que toda tentativa pesa (cadastro, esqueci a senha...). */
    public void hit(Limit limit, String key) {
        check(limit, key);
        record(limit, key);
    }

    /** Zera a chave (ex.: login certo apaga os erros daquele e-mail). */
    public void reset(Limit limit, String key) {
        events.remove(limit.name() + ":" + normalize(key));
    }

    private long retryAfterSeconds(Limit limit, String key) {
        Deque<Long> deque = events.get(limit.name() + ":" + normalize(key));
        if (deque == null) {
            return 0;
        }
        long now = System.currentTimeMillis();
        long windowMs = limit.window().toMillis();
        synchronized (deque) {
            while (!deque.isEmpty() && now - deque.peekFirst() >= windowMs) {
                deque.pollFirst();
            }
            if (deque.size() < limit.max()) {
                return 0;
            }
            // Libera quando o evento mais antigo da janela vencer.
            return Math.max(1, (deque.peekFirst() + windowMs - now) / 1000);
        }
    }

    /** Remove chaves sem eventos recentes, para a memória não crescer para sempre. */
    @Scheduled(fixedDelay = 10 * 60 * 1000)
    void cleanup() {
        long now = System.currentTimeMillis();
        long longestWindow = Duration.ofHours(1).toMillis();
        events.entrySet().removeIf(entry -> {
            Deque<Long> deque = entry.getValue();
            synchronized (deque) {
                return deque.isEmpty() || now - deque.peekLast() >= longestWindow;
            }
        });
    }

    private static String normalize(String key) {
        return key == null ? "" : key.trim().toLowerCase();
    }

    private static String humanize(long seconds) {
        if (seconds < 60) {
            return seconds + " segundo(s)";
        }
        return ((seconds + 59) / 60) + " minuto(s)";
    }
}
