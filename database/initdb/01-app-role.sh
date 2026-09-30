#!/bin/bash
# Roda uma única vez, na primeira subida do container (pasta /docker-entrypoint-initdb.d da
# imagem oficial do Postgres). Cria o usuário/banco da aplicação, separado do superusuário de
# bootstrap (POSTGRES_USER): é o que faz as políticas por linha (RLS, migration V2) valerem de
# verdade — um superusuário do Postgres sempre ignora RLS, mesmo com FORCE ROW LEVEL SECURITY.
set -e

psql -v ON_ERROR_STOP=1 --username postgres <<-SQL
    CREATE ROLE "${APP_USER}" LOGIN PASSWORD '${APP_USER_PASSWORD}';
    CREATE DATABASE "${APP_DB}" OWNER "${APP_USER}";
SQL

echo "Postgres: role e banco de '${APP_USER}' criados"
