ALTER TABLE usuarios ADD (
    alugar   NUMBER(1) DEFAULT 0 NOT NULL,
    anunciar NUMBER(1) DEFAULT 0 NOT NULL
);

UPDATE usuarios SET alugar = 1 WHERE papel = 'ALUGAR';
UPDATE usuarios SET anunciar = 1 WHERE papel = 'ANUNCIAR';

ALTER TABLE usuarios DROP CONSTRAINT ck_usuarios_papel;
ALTER TABLE usuarios DROP COLUMN papel;

ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_papel_minimo CHECK (alugar = 1 OR anunciar = 1);
