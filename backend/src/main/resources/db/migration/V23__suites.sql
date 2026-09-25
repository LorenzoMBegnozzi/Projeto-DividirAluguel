-- Quantas suítes o imóvel tem (dormitórios com banheiro). Opcional: nulo = não informado.
ALTER TABLE anuncios ADD suites NUMBER(2);
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_suites CHECK (suites IS NULL OR suites >= 0);
