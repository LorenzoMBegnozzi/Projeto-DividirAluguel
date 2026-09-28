#!/bin/bash
# Roda toda vez que o container do Oracle sobe (pasta /container-entrypoint-startdb.d da imagem
# gvenzl/oracle-xe). Concede ao usuário da aplicação o direito de criar as políticas por linha
# (RLS/VPD) da migration V29__rls_politicas.sql. É idempotente: repetir o GRANT não faz mal.
set -e

sqlplus -s / as sysdba <<SQL
WHENEVER SQLERROR EXIT FAILURE
ALTER SESSION SET CONTAINER = XEPDB1;
GRANT EXECUTE ON SYS.DBMS_RLS TO ${APP_USER};
EXIT
SQL

echo "RLS: EXECUTE em DBMS_RLS concedido a ${APP_USER}"
