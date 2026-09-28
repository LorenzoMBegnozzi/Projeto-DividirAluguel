package com.rachaai.accesslog;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Registros de acesso do Marco Civil (art. 15): quem (conta), de onde (IP e porta) e quando.
 *
 * Para não atrasar as respostas, a requisição só enfileira o registro; a cada poucos segundos a
 * fila é gravada em lote. O uso comum (ACESSO) é agrupado: no máximo uma linha a cada 5 minutos
 * por conta + IP, senão o polling de notificações geraria milhares de linhas por pessoa por dia.
 * Eventos de conta (login, cadastro, exclusão...) sempre são gravados.
 */
@Service
public class AccessLogService {

    private static final Logger log = LoggerFactory.getLogger(AccessLogService.class);
    private static final long ACCESS_DEDUP_MS = Duration.ofMinutes(5).toMillis();
    private static final String INSERT = "INSERT INTO registros_acesso "
            + "(usuario_id, ip, porta, evento, metodo, rota, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    record Entry(Long userId, String ip, Integer port, AccessEvent event, String method, String path, int status, Instant at) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final int retentionDays;
    private final ConcurrentLinkedQueue<Entry> queue = new ConcurrentLinkedQueue<>();
    /** Última vez que um ACESSO foi gravado para "conta|ip". */
    private final Map<String, Long> lastAccess = new ConcurrentHashMap<>();

    public AccessLogService(JdbcTemplate jdbcTemplate, @Value("${app.access-log.retention-days:183}") int retentionDays) {
        this.jdbcTemplate = jdbcTemplate;
        this.retentionDays = retentionDays;
    }

    public void record(Long userId, String ip, Integer port, AccessEvent event, String method, String path, int status) {
        if (event == AccessEvent.ACESSO) {
            long now = System.currentTimeMillis();
            String key = userId + "|" + ip;
            Long previous = lastAccess.get(key);
            if (previous != null && now - previous < ACCESS_DEDUP_MS) {
                return;
            }
            lastAccess.put(key, now);
        }
        queue.add(new Entry(userId, ip, port, event, method, truncate(path, 200), status, Instant.now()));
    }

    @Scheduled(fixedDelay = 5000)
    void flush() {
        List<Entry> batch = new ArrayList<>();
        Entry entry;
        while (batch.size() < 1000 && (entry = queue.poll()) != null) {
            batch.add(entry);
        }
        if (batch.isEmpty()) {
            return;
        }
        try {
            jdbcTemplate.batchUpdate(INSERT, batch, batch.size(), (ps, e) -> {
                if (e.userId() == null) ps.setNull(1, java.sql.Types.NUMERIC); else ps.setLong(1, e.userId());
                ps.setString(2, e.ip());
                if (e.port() == null) ps.setNull(3, java.sql.Types.NUMERIC); else ps.setInt(3, e.port());
                ps.setString(4, e.event().name());
                ps.setString(5, e.method());
                ps.setString(6, e.path());
                ps.setInt(7, e.status());
                ps.setTimestamp(8, Timestamp.from(e.at()));
            });
        } catch (RuntimeException ex) {
            // Não derruba nada, mas avisa alto: registro de acesso é obrigação legal.
            log.error("Falha ao gravar {} registro(s) de acesso", batch.size(), ex);
            queue.addAll(batch);
        }
        long cutoff = System.currentTimeMillis() - ACCESS_DEDUP_MS;
        lastAccess.values().removeIf(t -> t < cutoff);
    }

    /** Todo dia às 3h: apaga o que passou do prazo legal (padrão 183 dias, ~6 meses). */
    @Scheduled(cron = "0 0 3 * * *")
    void purgeExpired() {
        Timestamp limit = Timestamp.from(Instant.now().minus(Duration.ofDays(retentionDays)));
        int removed = jdbcTemplate.update("DELETE FROM registros_acesso WHERE criado_em < ?", limit);
        if (removed > 0) {
            log.info("{} registro(s) de acesso com mais de {} dias apagados", removed, retentionDays);
        }
    }

    /** Ao desligar o backend, grava o que ainda está na fila. */
    @PreDestroy
    void flushOnShutdown() {
        while (!queue.isEmpty()) {
            int before = queue.size();
            flush();
            if (queue.size() >= before) {
                break;
            }
        }
    }

    private static String truncate(String text, int max) {
        return text == null || text.length() <= max ? text : text.substring(0, max);
    }
}
