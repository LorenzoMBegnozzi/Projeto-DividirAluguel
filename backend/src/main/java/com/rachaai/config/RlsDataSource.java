package com.rachaai.config;

import com.rachaai.security.SecurityUser;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Envolve o pool de conexões: toda vez que uma conexão sai do pool, grava nela o "client
 * identifier" da sessão Oracle com quem está logado. É isso que as políticas por linha (RLS/VPD,
 * migration V29) leem para filtrar as tabelas privadas:
 *   U:<id>  usuário comum   A:<id>  administrador   vazio  sem login (tarefas internas, login...)
 *
 * Sempre sobrescreve, inclusive com vazio: a conexão volta para o pool e pode ser reaproveitada
 * por outra pessoa, então nunca pode carregar o identificador de quem usou antes.
 */
public class RlsDataSource extends DelegatingDataSource {

    /** Propriedade do driver Oracle que define o CLIENT_IDENTIFIER da sessão. */
    private static final String CLIENT_ID_PROPERTY = "OCSID.CLIENTID";

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
        connection.setClientInfo(CLIENT_ID_PROPERTY, currentIdentifier());
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
