-- A tela "Minha busca" (anúncios do tipo PROCURANDO) saiu do produto: a compatibilidade
-- agora vem só do perfil da pessoa, e localização/orçamento viraram filtro na busca,
-- não um anúncio publicado. Sem outra tabela referenciando esses anúncios (conversas e
-- interesses sempre exigiram TEM_VAGA/ESTABELECIMENTO), dá pra remover direto.
DELETE FROM anuncios WHERE tipo = 'PROCURANDO';

DROP INDEX uq_anuncios_uma_busca_por_usuario;

ALTER TABLE anuncios DROP CONSTRAINT ck_anuncios_tipo;
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_tipo CHECK (tipo IN ('TEM_VAGA', 'ESTABELECIMENTO'));
