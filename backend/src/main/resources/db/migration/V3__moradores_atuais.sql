-- Quantas pessoas já moram no lugar (sem contar quem for ocupar a vaga anunciada). Só faz
-- sentido para TEM_VAGA; opcional (nulo = não informado).
ALTER TABLE anuncios ADD moradores_atuais INTEGER;
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_moradores_atuais CHECK (moradores_atuais IS NULL OR moradores_atuais BETWEEN 0 AND 20);
