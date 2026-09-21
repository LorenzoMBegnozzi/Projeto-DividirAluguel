-- CPF para checar maioridade/identidade no cadastro (dígitos verificadores validados na
-- aplicação, sem consulta a nenhuma base externa). Nullable porque contas antigas não têm.
ALTER TABLE usuarios ADD (cpf VARCHAR2(11 CHAR));

-- Oracle não conta múltiplos NULLs como duplicados, então contas antigas sem CPF convivem
-- de boa com essa constraint.
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_cpf UNIQUE (cpf);
