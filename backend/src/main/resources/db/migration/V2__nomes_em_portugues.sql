-- O índice por função referencia colunas que serão renomeadas: recriado no fim.
DROP INDEX uq_listings_one_procurando_per_user;

-- ---------------------------------------------------------------- tabelas
ALTER TABLE users           RENAME TO usuarios;
ALTER TABLE user_profiles   RENAME TO perfis_usuario;
ALTER TABLE listings        RENAME TO anuncios;
ALTER TABLE conversations   RENAME TO conversas;
ALTER TABLE messages        RENAME TO mensagens;

-- ---------------------------------------------------------------- colunas
ALTER TABLE usuarios RENAME COLUMN name          TO nome;
ALTER TABLE usuarios RENAME COLUMN password_hash TO senha_hash;
ALTER TABLE usuarios RENAME COLUMN birth_date    TO data_nascimento;
ALTER TABLE usuarios RENAME COLUMN role          TO papel;
ALTER TABLE usuarios RENAME COLUMN occupation    TO ocupacao;
ALTER TABLE usuarios RENAME COLUMN created_at    TO criado_em;

ALTER TABLE perfis_usuario RENAME COLUMN user_id        TO usuario_id;
ALTER TABLE perfis_usuario RENAME COLUMN smoker         TO fumante;
ALTER TABLE perfis_usuario RENAME COLUMN drinks_alcohol TO bebe;
ALTER TABLE perfis_usuario RENAME COLUMN vegetarian     TO vegetariano;
ALTER TABLE perfis_usuario RENAME COLUMN has_pets       TO tem_pets;
ALTER TABLE perfis_usuario RENAME COLUMN likes_animals  TO gosta_animais;
ALTER TABLE perfis_usuario RENAME COLUMN allergies      TO alergias;
ALTER TABLE perfis_usuario RENAME COLUMN music_taste    TO gosto_musical;
ALTER TABLE perfis_usuario RENAME COLUMN routine        TO rotina;
ALTER TABLE perfis_usuario RENAME COLUMN updated_at     TO atualizado_em;

ALTER TABLE anuncios RENAME COLUMN user_id                TO usuario_id;
ALTER TABLE anuncios RENAME COLUMN type                   TO tipo;
ALTER TABLE anuncios RENAME COLUMN title                  TO titulo;
ALTER TABLE anuncios RENAME COLUMN description            TO descricao;
ALTER TABLE anuncios RENAME COLUMN preferred_neighborhood TO bairro_preferido;
ALTER TABLE anuncios RENAME COLUMN near_college           TO faculdade_proxima;
ALTER TABLE anuncios RENAME COLUMN price                  TO preco;
ALTER TABLE anuncios RENAME COLUMN address                TO endereco;
ALTER TABLE anuncios RENAME COLUMN accepts_pets           TO aceita_pets;
ALTER TABLE anuncios RENAME COLUMN accepts_smoker         TO aceita_fumante;
ALTER TABLE anuncios RENAME COLUMN active                 TO ativo;
ALTER TABLE anuncios RENAME COLUMN created_at             TO criado_em;

ALTER TABLE conversas RENAME COLUMN listing_id TO anuncio_id;
ALTER TABLE conversas RENAME COLUMN renter_id  TO inquilino_id;
ALTER TABLE conversas RENAME COLUMN created_at TO criado_em;

ALTER TABLE mensagens RENAME COLUMN conversation_id TO conversa_id;
ALTER TABLE mensagens RENAME COLUMN sender_id       TO remetente_id;
ALTER TABLE mensagens RENAME COLUMN content         TO conteudo;
ALTER TABLE mensagens RENAME COLUMN sent_at         TO enviado_em;

-- ------------------------------------------------------------ constraints
ALTER TABLE usuarios RENAME CONSTRAINT uq_users_email TO uq_usuarios_email;
ALTER TABLE usuarios RENAME CONSTRAINT ck_users_role  TO ck_usuarios_papel;

ALTER TABLE perfis_usuario RENAME CONSTRAINT uq_user_profiles_user    TO uq_perfis_usuario_usuario;
ALTER TABLE perfis_usuario RENAME CONSTRAINT fk_user_profiles_user    TO fk_perfis_usuario_usuario;
ALTER TABLE perfis_usuario RENAME CONSTRAINT ck_user_profiles_bools   TO ck_perfis_usuario_bools;
ALTER TABLE perfis_usuario RENAME CONSTRAINT ck_user_profiles_routine TO ck_perfis_usuario_rotina;

ALTER TABLE anuncios RENAME CONSTRAINT fk_listings_user    TO fk_anuncios_usuario;
ALTER TABLE anuncios RENAME CONSTRAINT ck_listings_type    TO ck_anuncios_tipo;
ALTER TABLE anuncios RENAME CONSTRAINT ck_listings_active  TO ck_anuncios_ativo;
ALTER TABLE anuncios RENAME CONSTRAINT ck_listings_accepts TO ck_anuncios_aceita;

ALTER TABLE conversas RENAME CONSTRAINT fk_conversations_listing         TO fk_conversas_anuncio;
ALTER TABLE conversas RENAME CONSTRAINT fk_conversations_renter          TO fk_conversas_inquilino;
ALTER TABLE conversas RENAME CONSTRAINT uq_conversations_listing_renter  TO uq_conversas_anuncio_inquilino;

ALTER TABLE mensagens RENAME CONSTRAINT fk_messages_conversation TO fk_mensagens_conversa;
ALTER TABLE mensagens RENAME CONSTRAINT fk_messages_sender       TO fk_mensagens_remetente;

-- ---------------------------------------------------------------- índices
-- (os índices que sustentam as constraints UNIQUE mantêm o nome antigo até serem renomeados aqui)
ALTER INDEX uq_users_email                  RENAME TO uq_usuarios_email;
ALTER INDEX uq_user_profiles_user           RENAME TO uq_perfis_usuario_usuario;
ALTER INDEX uq_conversations_listing_renter RENAME TO uq_conversas_anuncio_inquilino;
ALTER INDEX idx_listings_user               RENAME TO idx_anuncios_usuario;
ALTER INDEX idx_listings_type_active        RENAME TO idx_anuncios_tipo_ativo;
ALTER INDEX idx_conversations_renter        RENAME TO idx_conversas_inquilino;
ALTER INDEX idx_messages_conversation       RENAME TO idx_mensagens_conversa;

-- No máximo uma busca (PROCURANDO) ativa por usuário (Oracle não tem índice parcial).
CREATE UNIQUE INDEX uq_anuncios_uma_busca_por_usuario
    ON anuncios (CASE WHEN ativo = 1 AND tipo = 'PROCURANDO' THEN usuario_id END);
