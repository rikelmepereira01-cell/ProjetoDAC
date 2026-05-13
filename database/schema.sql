-- Usuários
CREATE TABLE IF NOT EXISTS tb_usuarios (
    usuario_id    INT          NOT NULL AUTO_INCREMENT,
    nome          VARCHAR(200) NOT NULL,
    login         VARCHAR(50)  NOT NULL UNIQUE,
    senha         VARCHAR(255) NOT NULL,
    atualizado_em TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    atualizado_por INT,
    PRIMARY KEY (usuario_id)
);

-- Pessoas
CREATE TABLE IF NOT EXISTS tb_pessoas (
    pessoa_id     INT         NOT NULL AUTO_INCREMENT,
    nome          VARCHAR(200) NOT NULL,
    cpf           VARCHAR(14)  NOT NULL UNIQUE,
    nascimento    DATE         NOT NULL,
    telefone      VARCHAR(20)  NOT NULL,
    atualizado_por INT         NOT NULL,
    atualizado_em DATE         NOT NULL,
    PRIMARY KEY (pessoa_id)
);

-- Tipo de Produto
CREATE TABLE IF NOT EXISTS tb_produto_tipo (
    material_tipo_id INT         NOT NULL AUTO_INCREMENT,
    descricao        VARCHAR(200) NOT NULL UNIQUE,
    PRIMARY KEY (material_tipo_id)
);

-- Produtos
CREATE TABLE IF NOT EXISTS tb_produtos (
    produto_id      INT         NOT NULL AUTO_INCREMENT,
    descricao       VARCHAR(200) NOT NULL UNIQUE,
    produto_tipo_id INT         NOT NULL,
    atualizado_em   TIME        NOT NULL,
    atualizado_por  INT         NOT NULL,
    PRIMARY KEY (produto_id),
    FOREIGN KEY (produto_tipo_id) REFERENCES tb_produto_tipo(material_tipo_id)
);

-- Feedback
CREATE TABLE IF NOT EXISTS tb_feedback (
    feedback_id    INT         NOT NULL AUTO_INCREMENT,
    datahora       TIME        NOT NULL,
    cliente_id     INT,
    produto_id     INT,
    observacao     VARCHAR(255) NOT NULL,
    atualizado_por INT         NOT NULL,
    PRIMARY KEY (feedback_id),
    FOREIGN KEY (cliente_id) REFERENCES tb_pessoas(pessoa_id),
    FOREIGN KEY (produto_id) REFERENCES tb_produtos(produto_id)
);