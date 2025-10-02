-- Script para criação do banco de dados finansave
-- Estrutura atualizada conforme especificação do usuário

DROP DATABASE IF EXISTS finansave;
CREATE DATABASE finansave;
USE finansave;

CREATE TABLE Usuarios (
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE Contas (
    conta_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    tipo ENUM('Corrente', 'Poupança', 'Investimento', 'Carteira', 'Cartão de Crédito', 'Outro') NOT NULL,
    saldo_atual DECIMAL(15,2) DEFAULT 0.00,
    instituicao VARCHAR(100),
    ativa BOOLEAN DEFAULT TRUE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
);

CREATE TABLE Metas (
    meta_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    valor_alvo DECIMAL(15,2) NOT NULL,
    valor_atual DECIMAL(15,2) DEFAULT 0.00,
    data_inicio DATE,
    data_limite DATE,
    concluida BOOLEAN DEFAULT FALSE,
    descricao VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
);

CREATE TABLE Orcamentos (
    id_orcamento INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    mes_ano DATE NOT NULL,
    tipo ENUM('Receita', 'Despesa') NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    valor_previsto DECIMAL(10,2) NOT NULL,
    valor_real DECIMAL(10,2) DEFAULT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_orcamento ENUM('Previsto', 'Realizado') DEFAULT 'Previsto',
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
);

CREATE TABLE Transferencias (
    transferencia_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    conta_origem_id INT NOT NULL,
    conta_destino_id INT,
    valor DECIMAL(15,2) NOT NULL,
    data_transferencia DATE NOT NULL,
    descricao VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
);

CREATE TABLE Parcelamentos (
    id_parcelamento INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    conta_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    total_parcelas INT NOT NULL,
    parcela_atual INT NOT NULL DEFAULT 1,
    valor_total DECIMAL(10,2) NOT NULL,
    valor_parcela DECIMAL(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (conta_id) REFERENCES Contas(conta_id)
);

CREATE TABLE Gastos (
    gasto_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    conta_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_gasto DATE NOT NULL,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (conta_id) REFERENCES Contas(conta_id) ON DELETE CASCADE
);