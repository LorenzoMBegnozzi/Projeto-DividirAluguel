-- Como são as vagas de garagem: gaveta (um carro atrás do outro) ou lateral (lado a lado),
-- e se são cobertas. Só preenchidos quando vagas_garagem > 0; nulo = não informado.
ALTER TABLE anuncios ADD garagem_disposicao VARCHAR2(20 CHAR);
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_garagem_disposicao
    CHECK (garagem_disposicao IS NULL OR garagem_disposicao IN ('GAVETA', 'LATERAL'));

ALTER TABLE anuncios ADD garagem_coberta VARCHAR2(3);
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_garagem_coberta
    CHECK (garagem_coberta IS NULL OR garagem_coberta IN ('SIM', 'NAO'));
