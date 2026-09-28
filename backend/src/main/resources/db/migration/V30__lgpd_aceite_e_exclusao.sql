-- LGPD.
--   termos_aceitos_em / versao_termos : quando e qual versão dos Termos de Uso e da Política de
--                                       Privacidade a pessoa aceitou (prova do consentimento).
--                                       Versão nova publicada → quem aceitou a antiga aceita de novo.
--   excluido_em                       : a pessoa excluiu a conta. Os dados pessoais foram apagados
--                                       (anonimização); a linha fica só para manter pagamentos e
--                                       denúncias, que têm de ser guardados por obrigação legal.
ALTER TABLE usuarios ADD (
    termos_aceitos_em   TIMESTAMP,
    versao_termos       VARCHAR2(20 CHAR),
    excluido_em         TIMESTAMP
);
