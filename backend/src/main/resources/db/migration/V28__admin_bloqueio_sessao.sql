-- Administração e sessão.
--   admin          : 1 = pode abrir a área administrativa (/admin).
--   bloqueado_em   : preenchido = conta bloqueada por um admin (não entra, anúncios somem da busca).
--   versao_token   : entra no token de login; somar 1 derruba todos os logins abertos da conta
--                    (sair, redefinir senha, bloqueio).
ALTER TABLE usuarios ADD (
    admin               NUMBER(1)            DEFAULT 0 NOT NULL,
    bloqueado_em        TIMESTAMP,
    motivo_bloqueio     VARCHAR2(500 CHAR),
    bloqueado_por_id    NUMBER,
    versao_token        NUMBER(10)           DEFAULT 0 NOT NULL
);
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_admin CHECK (admin IN (0, 1));
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_bloqueado_por
    FOREIGN KEY (bloqueado_por_id) REFERENCES usuarios (id) ON DELETE SET NULL;

-- Denúncia agora tem andamento: ABERTA → RESOLVIDA (admin agiu) ou DESCARTADA (sem fundamento).
ALTER TABLE denuncias ADD (
    status              VARCHAR2(20 CHAR)    DEFAULT 'ABERTA' NOT NULL,
    resolvida_em        TIMESTAMP,
    resolvida_por_id    NUMBER,
    nota_admin          VARCHAR2(1000 CHAR)
);
ALTER TABLE denuncias ADD CONSTRAINT ck_denuncias_status CHECK (status IN ('ABERTA', 'RESOLVIDA', 'DESCARTADA'));
ALTER TABLE denuncias ADD CONSTRAINT fk_denuncias_resolvida_por
    FOREIGN KEY (resolvida_por_id) REFERENCES usuarios (id) ON DELETE SET NULL;
CREATE INDEX idx_denuncias_status ON denuncias (status, criado_em);
