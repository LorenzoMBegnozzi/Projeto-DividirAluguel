package com.rachaai.config;

import com.rachaai.security.SecurityUser;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Envolve o pool de conexões: toda vez que uma conexão sai do pool, grava nela (numa variável de
 * sessão do Postgres) quem está logado. É isso que as políticas por linha (RLS, migration V2) leem
 * para filtrar as tabelas privadas:
 *   U:<id>  usuário comum   A:<id>  administrador   vazio  sem login (tarefas internas, login...)
 *
 * Sempre sobrescreve, inclusive com vazio: a conexão volta para o pool e pode ser reaproveitada
 * por outra pessoa, então nunca pode carregar o identificador de quem usou antes. Usa SET (nível
 * de sessão), não SET LOCAL (nível de transação): precisa sobreviver além da transação atual, já
 * que quem garante que não vaza para a próxima pessoa é justamente essa reescrita a cada empréstimo.
 */
public class RlsDataSource extends DelegatingDataSource {

    /** Nome da variável de sessão que as políticas RLS leem (rls_usuario_atual(), migration V2). */
    private static final String SESSION_VARIABLE = "rachaai.identidade";

    public RlsDataSource(DataSource target) {
        super(target);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return identify(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return identify(super.getConnection(username, password));
    }

    private static Connection identify(Connection connection) throws SQLException {
        // SET não aceita bind parameter para o valor; currentIdentifier() só produz "", "A:<id>"
        // ou "U:<id>" com id numérico (vem de SecurityUser/JWT), então não há risco de injeção.
        try (Statement statement = connection.createStatement()) {
            statement.execute("SET " + SESSION_VARIABLE + " = '" + currentIdentifier() + "'");
        }
        return connection;
    }

    static String currentIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityUser user) {
            return (user.isAdmin() ? "A:" : "U:") + user.getId();
        }
        return "";
    }
}
