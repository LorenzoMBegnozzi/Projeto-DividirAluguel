package com.rachaai.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.rachaai.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Políticas por linha (RLS/VPD) no Oracle de verdade: o H2 dos outros testes não tem esse recurso.
 * Sobe um Oracle descartável (Testcontainers, mesma imagem do docker-compose), aplica TODAS as
 * migrations com Flyway e confere o filtro no banco e pela API.
 *
 * É lento (~1 min para o Oracle subir) e precisa do Docker, por isso fica fora do "./mvnw test"
 * normal. Para rodar: ./mvnw test -Poracle
 */
@Tag("oracle")
@Testcontainers
@DisplayName("RLS no Oracle (políticas por linha)")
class RlsOracleTest extends ApiTestSupport {

    @Container
    static final OracleContainer ORACLE = new OracleContainer(
            DockerImageName.parse("gvenzl/oracle-xe:21-slim-faststart").asCompatibleSubstituteFor("gvenzl/oracle-xe"));

    @DynamicPropertySource
    static void oracleProperties(DynamicPropertyRegistry registry) throws Exception {
        // Mesma permissão que database/startdb/01-permissoes-rls.sh dá em dev/homolog/prod.
        var grant = ORACLE.execInContainer("bash", "-c",
                "printf 'ALTER SESSION SET CONTAINER = XEPDB1;\\nGRANT EXECUTE ON SYS.DBMS_RLS TO " + ORACLE.getUsername()
                        + ";\\nEXIT\\n' | sqlplus -s / as sysdba");
        if (grant.getExitCode() != 0 || grant.getStdout().contains("ORA-")) {
            throw new IllegalStateException("GRANT DBMS_RLS falhou: " + grant.getStdout() + grant.getStderr());
        }
        registry.add("spring.datasource.url", ORACLE::getJdbcUrl);
        registry.add("spring.datasource.username", ORACLE::getUsername);
        registry.add("spring.datasource.password", ORACLE::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "oracle.jdbc.OracleDriver");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("app.rls.enabled", () -> "true");
    }

    @Autowired
    private JdbcTemplate jdbc;

    /** Conta linhas de uma tabela como se fosse a sessão de um usuário (U:<id>), direto no banco. */
    private long countAs(String identifier, String sql) {
        return jdbc.execute((ConnectionCallback<Long>) conn -> {
            try (var set = conn.prepareCall("{call DBMS_SESSION.SET_IDENTIFIER(?)}")) {
                set.setString(1, identifier);
                set.execute();
            }
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            } finally {
                try (var clear = conn.prepareCall("{call DBMS_SESSION.CLEAR_IDENTIFIER}")) {
                    clear.execute();
                }
            }
        });
    }

    @Test
    @DisplayName("no banco, cada usuário só enxerga as próprias notificações, conversas e mensagens")
    void databaseFiltersRowsPerUser() throws Exception {
        Account owner = advertiser();
        long listingId = createListing(owner, listingBody("ESTABELECIMENTO"));
        Account ana = renter("FEMININO");
        Account bruno = renter("MASCULINO");
        for (Account a : new Account[]{ana, bruno}) {
            long conv = body(mvc.perform(jsonPost("/api/conversations", a, Map.of("listingId", listingId)))
                    .andExpect(status().isOk())).get("id").asLong();
            mvc.perform(jsonPost("/api/conversations/" + conv + "/messages", a, Map.of("content", "oi")))
                    .andExpect(status().isOk());
        }

        long allNotifications = countAs(null, "SELECT COUNT(*) FROM notificacoes");
        assertThat(allNotifications).isGreaterThanOrEqualTo(2);

        String ana_ = "U:" + ana.id();
        assertThat(countAs(ana_, "SELECT COUNT(*) FROM notificacoes WHERE usuario_id <> " + ana.id())).isZero();
        assertThat(countAs(ana_, "SELECT COUNT(*) FROM conversas")).isEqualTo(1);
        assertThat(countAs(ana_, "SELECT COUNT(*) FROM mensagens")).isEqualTo(1);
        // O dono do anúncio participa das duas conversas.
        assertThat(countAs("U:" + owner.id(), "SELECT COUNT(*) FROM conversas")).isEqualTo(2);
        // Admin e tarefas internas (sem identificador) veem tudo.
        assertThat(countAs("A:1", "SELECT COUNT(*) FROM notificacoes")).isEqualTo(allNotifications);
        // Identificador inválido não vê nada.
        assertThat(countAs("U:abc", "SELECT COUNT(*) FROM notificacoes")).isZero();
    }

    @Test
    @DisplayName("quem é denunciado não vê a denúncia; registros de acesso ficam invisíveis para usuários")
    void reportsAndAccessLogsAreHidden() throws Exception {
        Account reporter = renter("FEMININO");
        Account reported = advertiser();
        mvc.perform(jsonPost("/api/denuncias", reporter, Map.of(
                        "denunciadoId", reported.id(), "motivo", "OUTRO", "descricao", "teste")))
                .andExpect(status().isOk());
        jdbc.update("INSERT INTO registros_acesso (usuario_id, ip, evento) VALUES (?, '10.0.0.1', 'LOGIN')", reporter.id());

        assertThat(countAs("U:" + reporter.id(), "SELECT COUNT(*) FROM denuncias")).isEqualTo(1);
        assertThat(countAs("U:" + reported.id(), "SELECT COUNT(*) FROM denuncias")).isZero();
        assertThat(countAs("U:" + reporter.id(), "SELECT COUNT(*) FROM registros_acesso")).isZero();
        assertThat(countAs(null, "SELECT COUNT(*) FROM registros_acesso")).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("com o RLS ligado, o site continua funcionando: chat, notificações e painel de admin")
    void appStillWorksWithRls() throws Exception {
        Account owner = advertiser();
        long listingId = createListing(owner, listingBody("ESTABELECIMENTO"));
        Account ana = renter("FEMININO");
        Account outsider = renter("MASCULINO");

        long conv = body(mvc.perform(jsonPost("/api/conversations", ana, Map.of("listingId", listingId)))
                .andExpect(status().isOk())).get("id").asLong();
        mvc.perform(jsonPost("/api/conversations/" + conv + "/messages", ana, Map.of("content", "olá")))
                .andExpect(status().isOk());

        mvc.perform(auth(get("/api/conversations/" + conv + "/messages"), owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(auth(get("/api/conversations/" + conv + "/messages"), outsider))
                .andExpect(status().isNotFound());

        JsonNode notifications = body(mvc.perform(auth(get("/api/notificacoes"), owner)).andExpect(status().isOk()));
        assertThat(notifications.size()).isGreaterThanOrEqualTo(1);
        mvc.perform(auth(post("/api/notificacoes/lidas"), owner)).andExpect(status().isOk());

        mvc.perform(auth(get("/api/admin/resumo"), admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber());
    }
}
