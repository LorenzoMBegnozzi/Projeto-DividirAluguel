-- Políticas por linha (RLS): cada pessoa só enxerga as próprias linhas nas tabelas privadas,
-- mesmo que o código peça tudo por engano. Porta a V29/V31 do schema Oracle (VPD/DBMS_RLS) para
-- o RLS nativo do PostgreSQL — o mecanismo do banco muda, mas o comportamento é o mesmo.
--
-- Como o banco sabe quem é a pessoa: RlsDataSource grava, a cada conexão que sai do pool, uma
-- variável de sessão (SET, não SET LOCAL: precisa sobreviver além da transação atual, e é
-- sempre sobrescrita no próximo empréstimo da conexão, então nunca vaza para outra pessoa):
--   rachaai.identidade = 'U:<id>'   usuário logado          → só as linhas dele
--   rachaai.identidade = 'A:<id>'   administrador logado    → tudo
--   rachaai.identidade = ''         sem login: tarefas agendadas, migrations, login/cadastro → sem filtro
--
-- Diferença importante do Oracle: lá, ausência do tipo de comando (INSERT) na política significa
-- "sem filtro"; no Postgres, RLS ligado sem política para um comando BLOQUEIA esse comando por
-- padrão. Por isso cada tabela abaixo tem uma política de INSERT explícita e sempre permissiva
-- (equivalente ao "INSERT fica de fora de propósito" do Oracle: alguém precisa poder criar uma
-- notificação para outra pessoa, por exemplo).
--
-- FORCE ROW LEVEL SECURITY é essencial: sem isso, o Postgres isenta automaticamente o dono da
-- tabela (o próprio usuário da aplicação, que também é quem cria as tabelas) das políticas — o
-- RLS ligaria mas não faria nada.

CREATE OR REPLACE FUNCTION rls_usuario_atual() RETURNS BIGINT AS $$
DECLARE
    identificador TEXT := current_setting('rachaai.identidade', true);
BEGIN
    IF identificador IS NULL OR identificador = '' OR identificador LIKE 'A:%' THEN
        RETURN NULL; -- sem filtro: administrador ou tarefa interna
    END IF;
    IF identificador !~ '^U:[0-9]{1,18}$' THEN
        RETURN -1; -- identificador não reconhecido: não enxerga nada
    END IF;
    RETURN substring(identificador FROM 3)::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE;

-- notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_notificacoes_ins ON notificacoes FOR INSERT WITH CHECK (true);
CREATE POLICY rls_notificacoes_sel ON notificacoes FOR SELECT
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual());
CREATE POLICY rls_notificacoes_upd ON notificacoes FOR UPDATE
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual())
    WITH CHECK (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual());
CREATE POLICY rls_notificacoes_del ON notificacoes FOR DELETE
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual());

-- pagamentos
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_pagamentos_ins ON pagamentos FOR INSERT WITH CHECK (true);
CREATE POLICY rls_pagamentos_sel ON pagamentos FOR SELECT
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual());
CREATE POLICY rls_pagamentos_upd ON pagamentos FOR UPDATE
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual())
    WITH CHECK (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual());
CREATE POLICY rls_pagamentos_del ON pagamentos FOR DELETE
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual());

-- bloqueios: quem bloqueou e quem foi bloqueado (usado para esconder um do outro)
ALTER TABLE bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueios FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_bloqueios_ins ON bloqueios FOR INSERT WITH CHECK (true);
CREATE POLICY rls_bloqueios_sel ON bloqueios FOR SELECT
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual() OR bloqueado_id = rls_usuario_atual());
CREATE POLICY rls_bloqueios_upd ON bloqueios FOR UPDATE
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual() OR bloqueado_id = rls_usuario_atual())
    WITH CHECK (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual() OR bloqueado_id = rls_usuario_atual());
CREATE POLICY rls_bloqueios_del ON bloqueios FOR DELETE
    USING (rls_usuario_atual() IS NULL OR usuario_id = rls_usuario_atual() OR bloqueado_id = rls_usuario_atual());

-- denuncias: a pessoa denunciada nunca vê a denúncia; quem denunciou vê a sua
ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_denuncias_ins ON denuncias FOR INSERT WITH CHECK (true);
CREATE POLICY rls_denuncias_sel ON denuncias FOR SELECT
    USING (rls_usuario_atual() IS NULL OR denunciante_id = rls_usuario_atual());
CREATE POLICY rls_denuncias_upd ON denuncias FOR UPDATE
    USING (rls_usuario_atual() IS NULL OR denunciante_id = rls_usuario_atual())
    WITH CHECK (rls_usuario_atual() IS NULL OR denunciante_id = rls_usuario_atual());
CREATE POLICY rls_denuncias_del ON denuncias FOR DELETE
    USING (rls_usuario_atual() IS NULL OR denunciante_id = rls_usuario_atual());

-- conversas
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_conversas_ins ON conversas FOR INSERT WITH CHECK (true);
CREATE POLICY rls_conversas_sel ON conversas FOR SELECT
    USING (
        rls_usuario_atual() IS NULL
        OR inquilino_id = rls_usuario_atual()
        OR usuario2_id = rls_usuario_atual()
        OR anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
    );
CREATE POLICY rls_conversas_upd ON conversas FOR UPDATE
    USING (
        rls_usuario_atual() IS NULL
        OR inquilino_id = rls_usuario_atual()
        OR usuario2_id = rls_usuario_atual()
        OR anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
    )
    WITH CHECK (
        rls_usuario_atual() IS NULL
        OR inquilino_id = rls_usuario_atual()
        OR usuario2_id = rls_usuario_atual()
        OR anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
    );
CREATE POLICY rls_conversas_del ON conversas FOR DELETE
    USING (
        rls_usuario_atual() IS NULL
        OR inquilino_id = rls_usuario_atual()
        OR usuario2_id = rls_usuario_atual()
        OR anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
    );

-- mensagens: visível para quem participa da conversa dona da mensagem
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_mensagens_ins ON mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY rls_mensagens_sel ON mensagens FOR SELECT
    USING (
        rls_usuario_atual() IS NULL
        OR conversa_id IN (
            SELECT c.id FROM conversas c
            WHERE c.inquilino_id = rls_usuario_atual()
               OR c.usuario2_id = rls_usuario_atual()
               OR c.anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
        )
    );
CREATE POLICY rls_mensagens_upd ON mensagens FOR UPDATE
    USING (
        rls_usuario_atual() IS NULL
        OR conversa_id IN (
            SELECT c.id FROM conversas c
            WHERE c.inquilino_id = rls_usuario_atual()
               OR c.usuario2_id = rls_usuario_atual()
               OR c.anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
        )
    )
    WITH CHECK (
        rls_usuario_atual() IS NULL
        OR conversa_id IN (
            SELECT c.id FROM conversas c
            WHERE c.inquilino_id = rls_usuario_atual()
               OR c.usuario2_id = rls_usuario_atual()
               OR c.anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
        )
    );
CREATE POLICY rls_mensagens_del ON mensagens FOR DELETE
    USING (
        rls_usuario_atual() IS NULL
        OR conversa_id IN (
            SELECT c.id FROM conversas c
            WHERE c.inquilino_id = rls_usuario_atual()
               OR c.usuario2_id = rls_usuario_atual()
               OR c.anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = rls_usuario_atual())
        )
    );

-- registros_acesso: ninguém do site lê, altera ou apaga (só tarefas internas e admins, pelo
-- banco). INSERT fica sem filtro, igual às outras tabelas: nenhum endpoint expõe escrita nessa
-- tabela, só o AccessLogService via JDBC direto — a proteção aqui é a aplicação, não o RLS.
ALTER TABLE registros_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_acesso FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_registros_acesso_ins ON registros_acesso FOR INSERT WITH CHECK (true);
CREATE POLICY rls_registros_acesso_sel ON registros_acesso FOR SELECT
    USING (rls_usuario_atual() IS NULL);
CREATE POLICY rls_registros_acesso_upd ON registros_acesso FOR UPDATE
    USING (rls_usuario_atual() IS NULL) WITH CHECK (rls_usuario_atual() IS NULL);
CREATE POLICY rls_registros_acesso_del ON registros_acesso FOR DELETE
    USING (rls_usuario_atual() IS NULL);
