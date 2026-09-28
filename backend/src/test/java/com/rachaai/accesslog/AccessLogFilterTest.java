package com.rachaai.accesslog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Registros de acesso: classificação dos eventos (Marco Civil)")
class AccessLogFilterTest {

    @Test
    @DisplayName("login certo e errado, cadastro, logout, senha redefinida e conta excluída viram eventos próprios")
    void accountEvents() {
        assertThat(AccessLogFilter.classify("POST", "/api/auth/login", 200)).isEqualTo(AccessEvent.LOGIN);
        assertThat(AccessLogFilter.classify("POST", "/api/auth/login", 401)).isEqualTo(AccessEvent.LOGIN_FALHOU);
        assertThat(AccessLogFilter.classify("POST", "/api/auth/login", 429)).isEqualTo(AccessEvent.LOGIN_FALHOU);
        assertThat(AccessLogFilter.classify("POST", "/api/auth/register", 200)).isEqualTo(AccessEvent.CADASTRO);
        assertThat(AccessLogFilter.classify("POST", "/api/auth/logout", 204)).isEqualTo(AccessEvent.LOGOUT);
        assertThat(AccessLogFilter.classify("POST", "/api/auth/redefinir-senha", 204)).isEqualTo(AccessEvent.SENHA_REDEFINIDA);
        assertThat(AccessLogFilter.classify("POST", "/api/users/me/excluir-conta", 204)).isEqualTo(AccessEvent.CONTA_EXCLUIDA);
    }

    @Test
    @DisplayName("tentativas que falharam e o uso comum viram ACESSO")
    void everythingElseIsAccess() {
        assertThat(AccessLogFilter.classify("POST", "/api/auth/register", 400)).isEqualTo(AccessEvent.ACESSO);
        assertThat(AccessLogFilter.classify("POST", "/api/users/me/excluir-conta", 403)).isEqualTo(AccessEvent.ACESSO);
        assertThat(AccessLogFilter.classify("GET", "/api/auth/login", 200)).isEqualTo(AccessEvent.ACESSO);
        assertThat(AccessLogFilter.classify("GET", "/api/notificacoes", 200)).isEqualTo(AccessEvent.ACESSO);
    }
}
