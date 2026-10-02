package com.rachaai.chat;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * "Fulano está digitando...": guardado só em memória (não precisa sobreviver a um restart, nem
 * ser consultado por outro backend atrás do load balancer — cada instância vê sua própria fatia
 * de conversas ativas, o que é aceitável para esse indicador). Sem WebSocket na aplicação, o
 * front avisa por polling (ver ChatPage).
 */
@Service
public class TypingService {

    private static final Duration WINDOW = Duration.ofSeconds(4);

    private final Map<Long, Map<Long, Instant>> typingByConversation = new ConcurrentHashMap<>();

    public void markTyping(Long conversationId, Long userId) {
        typingByConversation.computeIfAbsent(conversationId, id -> new ConcurrentHashMap<>()).put(userId, Instant.now());
    }

    public boolean isOtherTyping(Long conversationId, Long userId) {
        Map<Long, Instant> entries = typingByConversation.get(conversationId);
        if (entries == null) {
            return false;
        }
        Instant cutoff = Instant.now().minus(WINDOW);
        return entries.entrySet().stream().anyMatch(e -> !e.getKey().equals(userId) && e.getValue().isAfter(cutoff));
    }

    /** Limpa entradas velhas de tempos em tempos, para não crescer sem limite. */
    @Scheduled(fixedDelay = 60_000)
    void purgeExpired() {
        Instant cutoff = Instant.now().minus(WINDOW);
        typingByConversation.values().forEach(entries -> entries.values().removeIf(at -> at.isBefore(cutoff)));
        typingByConversation.values().removeIf(Map::isEmpty);
    }
}
