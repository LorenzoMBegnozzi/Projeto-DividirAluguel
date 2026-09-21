-- Ciente de segurança: como o RachaAi conecta pessoas que não se conhecem, o usuário
-- precisa confirmar que está ciente dos cuidados antes de usar a plataforma. NULL = ainda
-- não aceitou (contas antigas também ficam pendentes até aceitarem no próximo acesso).
ALTER TABLE usuarios ADD (termos_seguranca_aceito_em TIMESTAMP);
