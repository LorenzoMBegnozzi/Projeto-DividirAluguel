package com.rachaai.notification;

import com.rachaai.notification.dto.NotificationResponse;
import com.rachaai.notification.dto.UnreadCountResponse;
import com.rachaai.security.SecurityUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal SecurityUser principal) {
        return notificationService.listMine(principal.getId()).stream().map(NotificationResponse::from).toList();
    }

    @GetMapping("/nao-lidas")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal SecurityUser principal) {
        return new UnreadCountResponse(notificationService.countUnread(principal.getId()));
    }

    @PostMapping("/{id}/lida")
    public void markRead(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        notificationService.markRead(principal.getId(), id);
    }

    @PostMapping("/lidas")
    public void markAllRead(@AuthenticationPrincipal SecurityUser principal) {
        notificationService.markAllRead(principal.getId());
    }
}
