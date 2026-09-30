-- Roda uma vez, quando o container Testcontainers sobe (como o superusuário de bootstrap).
-- Cria um usuário/banco comuns, sem privilégio de superusuário, para o app conectar durante o
-- teste: é o que faz RLS realmente filtrar (superusuário sempre ignora, mesmo com FORCE ROW
-- LEVEL SECURITY) — mesmo motivo de database/initdb/01-app-role.sh no docker-compose.
CREATE ROLE rachaai_test LOGIN PASSWORD 'rachaai_test';
CREATE DATABASE rachaai_test OWNER rachaai_test;
