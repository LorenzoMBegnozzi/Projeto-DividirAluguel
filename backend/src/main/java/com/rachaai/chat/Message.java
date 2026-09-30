package com.rachaai.chat;

import com.rachaai.conversation.Conversation;
import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "mensagens")
public class Message {

    @Id
    // Sequência, não IDENTITY: ver o mesmo comentário em Notification.java (RLS + RETURNING).
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_mensagens")
    @SequenceGenerator(name = "seq_mensagens", sequenceName = "seq_mensagens", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversa_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remetente_id", nullable = false)
    private User sender;

    @Column(name = "conteudo", nullable = false, length = 2000)
    private String content;

    @Column(name = "enviado_em", nullable = false, updatable = false)
    private Instant sentAt = Instant.now();

    protected Message() {
    }

    public Message(Conversation conversation, User sender, String content) {
        this.conversation = conversation;
        this.sender = sender;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public User getSender() {
        return sender;
    }

    public String getContent() {
        return content;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
