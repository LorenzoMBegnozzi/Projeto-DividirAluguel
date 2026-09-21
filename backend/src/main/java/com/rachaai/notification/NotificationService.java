package com.rachaai.notification;

import com.rachaai.common.ApiException;
import com.rachaai.user.User;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private static final Limit MAX_LISTED = Limit.of(50);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** Cria a notificação para quem vai recebê-la; quem gera o evento nunca notifica a si mesmo. */
    @Transactional
    public void notify(User recipient, NotificationType type, String title, String message, String link) {
        notificationRepository.save(new Notification(recipient, type, title, message, link));
    }

    @Transactional(readOnly = true)
    public List<Notification> listMine(Long userId) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, MAX_LISTED);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> ApiException.notFound("Notificação não encontrada"));
        notification.markRead();
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }
}
