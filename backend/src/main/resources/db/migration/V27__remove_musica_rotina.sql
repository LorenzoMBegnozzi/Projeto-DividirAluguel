-- Música e rotina saíram do perfil: não entram mais no cálculo de compatibilidade
-- nem aparecem no cadastro. O DROP COLUMN também remove sozinho o
-- CHECK ck_perfis_usuario_rotina, que só existia por causa da coluna rotina.
ALTER TABLE perfis_usuario DROP COLUMN gosto_musical;
ALTER TABLE perfis_usuario DROP COLUMN rotina;
