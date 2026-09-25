-- Notificações do "Tenho interesse": o dono fica sabendo de cada interessado novo, e quem se
-- interessou pelo mesmo imóvel fica sabendo dos outros.
ALTER TABLE notificacoes DROP CONSTRAINT ck_notificacoes_tipo;
ALTER TABLE notificacoes ADD CONSTRAINT ck_notificacoes_tipo CHECK (tipo IN (
    'NOVA_MENSAGEM', 'NOVA_CONVERSA', 'CONVIVIO_PROPOSTO', 'CONVIVIO_CONFIRMADO',
    'CONVIVIO_RECUSADO', 'AVALIACAO_RECEBIDA', 'NOVO_INTERESSE', 'INTERESSE_EM_COMUM'
));
