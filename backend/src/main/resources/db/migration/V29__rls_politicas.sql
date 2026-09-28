-- Políticas por linha (RLS). No Oracle o recurso se chama VPD (Virtual Private Database): o
-- próprio banco acrescenta um filtro a toda consulta nas tabelas abaixo, de modo que cada
-- pessoa só enxerga as suas linhas, mesmo que o código peça tudo por engano.
--
-- Como o banco sabe quem é a pessoa: o backend grava, em cada conexão que pega do pool, o
-- "client identifier" da sessão (ver RlsDataSource.java):
--   U:<id>   usuário logado          → só as linhas dele
--   A:<id>   administrador logado    → tudo
--   (vazio)  sem login: tarefas agendadas, migrations, login/cadastro → sem filtro
--
-- Pré-requisito: o usuário da aplicação precisa de EXECUTE em DBMS_RLS, concedido pelo SYS no
-- script database/startdb/01-permissoes-rls.sh (roda toda vez que o container do banco sobe).

CREATE OR REPLACE FUNCTION rls_predicado(p_schema IN VARCHAR2, p_objeto IN VARCHAR2)
RETURN VARCHAR2
IS
    v_identificador VARCHAR2(64) := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');
    u               VARCHAR2(20);
BEGIN
    IF v_identificador IS NULL OR v_identificador LIKE 'A:%' THEN
        RETURN NULL;
    END IF;
    u := SUBSTR(v_identificador, 3);
    -- Só aceita U:<número>; qualquer outra coisa não vê nada. Como o id é validado como número,
    -- concatená-lo no filtro não abre espaço para injeção de SQL.
    IF v_identificador NOT LIKE 'U:%' OR NOT REGEXP_LIKE(u, '^[0-9]{1,18}$') THEN
        RETURN '1 = 0';
    END IF;

    CASE p_objeto
        WHEN 'NOTIFICACOES' THEN
            RETURN 'usuario_id = ' || u;
        WHEN 'PAGAMENTOS' THEN
            RETURN 'usuario_id = ' || u;
        WHEN 'BLOQUEIOS' THEN
            -- quem bloqueou e quem foi bloqueado (usado para esconder um do outro)
            RETURN 'usuario_id = ' || u || ' OR bloqueado_id = ' || u;
        WHEN 'DENUNCIAS' THEN
            -- a pessoa denunciada nunca vê a denúncia; quem denunciou vê a sua
            RETURN 'denunciante_id = ' || u;
        WHEN 'CONVERSAS' THEN
            RETURN 'inquilino_id = ' || u || ' OR usuario2_id = ' || u
                || ' OR anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = ' || u || ')';
        WHEN 'MENSAGENS' THEN
            RETURN 'conversa_id IN (SELECT c.id FROM conversas c WHERE c.inquilino_id = ' || u
                || ' OR c.usuario2_id = ' || u
                || ' OR c.anuncio_id IN (SELECT a.id FROM anuncios a WHERE a.usuario_id = ' || u || '))';
        ELSE
            RETURN '1 = 0';
    END CASE;
END;
/

-- INSERT fica de fora de propósito: uma pessoa precisa conseguir criar linhas para outra
-- (ex.: a notificação que o dono do anúncio recebe quando alguém puxa conversa).
BEGIN
    FOR t IN (
        SELECT 'NOTIFICACOES' AS tabela FROM dual UNION ALL
        SELECT 'PAGAMENTOS' FROM dual UNION ALL
        SELECT 'BLOQUEIOS' FROM dual UNION ALL
        SELECT 'DENUNCIAS' FROM dual UNION ALL
        SELECT 'CONVERSAS' FROM dual UNION ALL
        SELECT 'MENSAGENS' FROM dual
    ) LOOP
        DBMS_RLS.ADD_POLICY(
            object_schema   => USER,
            object_name     => t.tabela,
            policy_name     => 'RLS_' || t.tabela,
            function_schema => USER,
            policy_function => 'RLS_PREDICADO',
            statement_types => 'SELECT, UPDATE, DELETE',
            update_check    => TRUE,
            policy_type     => DBMS_RLS.DYNAMIC
        );
    END LOOP;
END;
/
