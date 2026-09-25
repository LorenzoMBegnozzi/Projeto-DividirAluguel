-- Detalhes do imóvel (apartamento e condomínio), para os dois tipos de anúncio.
-- Tudo opcional: nulo = não informado.
ALTER TABLE anuncios ADD dormitorios NUMBER(2);
ALTER TABLE anuncios ADD banheiros_sociais NUMBER(2);
ALTER TABLE anuncios ADD vagas_garagem NUMBER(2);
ALTER TABLE anuncios ADD garagem_carro VARCHAR2(3);
ALTER TABLE anuncios ADD garagem_moto VARCHAR2(3);
ALTER TABLE anuncios ADD piscina VARCHAR2(3);
ALTER TABLE anuncios ADD salao_festas VARCHAR2(3);
ALTER TABLE anuncios ADD academia VARCHAR2(3);
ALTER TABLE anuncios ADD playground VARCHAR2(3);
ALTER TABLE anuncios ADD portaria_24h VARCHAR2(3);

ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_detalhes_qtd CHECK (
    (dormitorios IS NULL OR dormitorios >= 0)
    AND (banheiros_sociais IS NULL OR banheiros_sociais >= 0)
    AND (vagas_garagem IS NULL OR vagas_garagem >= 0));
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_detalhes_simnao CHECK (
    (garagem_carro IS NULL OR garagem_carro IN ('SIM', 'NAO'))
    AND (garagem_moto IS NULL OR garagem_moto IN ('SIM', 'NAO'))
    AND (piscina IS NULL OR piscina IN ('SIM', 'NAO'))
    AND (salao_festas IS NULL OR salao_festas IN ('SIM', 'NAO'))
    AND (academia IS NULL OR academia IN ('SIM', 'NAO'))
    AND (playground IS NULL OR playground IN ('SIM', 'NAO'))
    AND (portaria_24h IS NULL OR portaria_24h IN ('SIM', 'NAO')));
