-- =====================================================================
-- RachaAi - setup do schema no Oracle XE INSTALADO NA MÁQUINA
-- (não é necessário se você usa o Oracle do docker-compose: o container
-- já cria o usuário sozinho a partir de DB_USER / DB_PASSWORD do .env)
--
-- Rode uma única vez, conectado como SYSDBA:
--     sqlplus / as sysdba
--     @database/setup-oracle-local.sql
--
-- Depois suba o backend apontando para o Oracle local:
--     DB_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
--     DB_USER=rachaai
--     DB_PASSWORD=<a mesma senha abaixo>
-- As tabelas são criadas pelo Flyway na primeira subida do backend.
-- =====================================================================

ALTER SESSION SET CONTAINER = XEPDB1;

CREATE USER rachaai IDENTIFIED BY "TroqueEstaSenha1"
    DEFAULT TABLESPACE USERS
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;

GRANT CREATE SESSION   TO rachaai;
GRANT CREATE TABLE     TO rachaai;
GRANT CREATE SEQUENCE  TO rachaai;
GRANT CREATE VIEW      TO rachaai;
GRANT CREATE PROCEDURE TO rachaai;
GRANT CREATE TRIGGER   TO rachaai;
