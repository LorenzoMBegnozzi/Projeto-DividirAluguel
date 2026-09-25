package com.rachaai.notification;

public enum NotificationType {
    NOVA_MENSAGEM,
    NOVA_CONVERSA,
    CONVIVIO_PROPOSTO,
    CONVIVIO_CONFIRMADO,
    CONVIVIO_RECUSADO,
    AVALIACAO_RECEBIDA,
    /** Para o dono: alguém clicou em "Tenho interesse" no anúncio. */
    NOVO_INTERESSE,
    /** Para interessados: há outras pessoas interessadas no mesmo imóvel. */
    INTERESSE_EM_COMUM
}
