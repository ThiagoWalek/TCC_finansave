-- Script para corrigir a tabela gastos
USE finansave;

-- Remove a tabela gastos existente (que pode ter constraints incorretas)
DROP TABLE IF EXISTS Gastos;

-- Recria a tabela gastos com a estrutura correta
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