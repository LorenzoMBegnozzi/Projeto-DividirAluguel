-- Login com Google: guarda o "sub" da conta do Google ligada ao usuário. É o identificador fixo
-- da conta no Google (não muda se a pessoa trocar o e-mail lá). Vazio = conta só com e-mail e senha.
ALTER TABLE usuarios ADD google_sub VARCHAR(255);
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_google_sub UNIQUE (google_sub);
