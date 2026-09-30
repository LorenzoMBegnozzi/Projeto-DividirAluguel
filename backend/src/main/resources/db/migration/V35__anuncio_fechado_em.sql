-- Quando o anúncio foi marcado como indisponível (negócio fechado). Usado no dashboard do admin
-- ("vagas fechadas no período"). Anúncios fechados antes desta coluna ficam sem data.
ALTER TABLE anuncios ADD fechado_em TIMESTAMP;
