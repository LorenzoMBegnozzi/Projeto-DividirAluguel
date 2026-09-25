-- Se a pessoa precisa de vaga de garagem, e para quê. SIM/NAO; os dois NAO = "não preciso";
-- nulo = não informado.
ALTER TABLE perfis_usuario ADD precisa_vaga_carro VARCHAR2(3);
ALTER TABLE perfis_usuario ADD precisa_vaga_moto VARCHAR2(3);
ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_precisa_vaga CHECK (
    (precisa_vaga_carro IS NULL OR precisa_vaga_carro IN ('SIM', 'NAO'))
    AND (precisa_vaga_moto IS NULL OR precisa_vaga_moto IN ('SIM', 'NAO')));
