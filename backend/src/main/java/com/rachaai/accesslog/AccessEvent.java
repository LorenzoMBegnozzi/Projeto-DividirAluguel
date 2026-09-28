package com.rachaai.accesslog;

/** Tipo de linha em registros_acesso. */
public enum AccessEvent {
    LOGIN,
    LOGIN_FALHOU,
    CADASTRO,
    LOGOUT,
    SENHA_REDEFINIDA,
    CONTA_EXCLUIDA,
    /** Uso comum da API (agrupado a cada 5 min por conta + IP). */
    ACESSO
}
