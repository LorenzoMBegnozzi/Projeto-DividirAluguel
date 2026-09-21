package com.rachaai.chat;

import com.rachaai.chat.dto.MessageResponse;
import com.rachaai.common.ApiException;
import com.rachaai.conversation.Conversation;
import com.rachaai.conversation.ConversationService;
import com.rachaai.moderation.ModerationService;
import com.rachaai.notification.NotificationService;
import com.rachaai.notification.NotificationType;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ModerationService moderationService;

    public ChatService(
            MessageRepository messageRepository,
            ConversationService conversationService,
            UserRepository userRepository,
            NotificationService notificationService,
            ModerationService moderationService
    ) {
        this.messageRepository = messageRepository;
        this.conversationService = conversationService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.moderationService = moderationService;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long conversationId, Long userId) {
        conversationService.getForUser(conversationId, userId);
        return messageRepository.findAllByConversationIdOrderBySentAtAsc(conversationId).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse sendMessage(Long conversationId, Long userId, String content) {
        Conversation conversation = conversationService.getForUser(conversationId, userId);
        User other = conversation.other(userId);
        if (moderationService.isBlockedEitherWay(userId, other.getId())) {
            throw ApiException.forbidden("Não é possível enviar mensagens nessa conversa");
        }

        User sender = userRepository.getReferenceById(userId);
        Message message = messageRepository.save(new Message(conversation, sender, content));

        notificationService.notify(
                other,
                NotificationType.NOVA_MENSAGEM,
                "Nova mensagem de " + sender.getName(),
                content.length() > 140 ? content.substring(0, 140) + "..." : content,
                "/conversas/" + conversationId
        );

        return MessageResponse.from(message);
    }
}
