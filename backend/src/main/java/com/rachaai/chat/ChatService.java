package com.rachaai.chat;

import com.rachaai.chat.dto.MessageResponse;
import com.rachaai.conversation.Conversation;
import com.rachaai.conversation.ConversationService;
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

    public ChatService(MessageRepository messageRepository, ConversationService conversationService, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.conversationService = conversationService;
        this.userRepository = userRepository;
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
        User sender = userRepository.getReferenceById(userId);
        Message message = messageRepository.save(new Message(conversation, sender, content));
        return MessageResponse.from(message);
    }
}
