const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Conta = sequelize.define('Conta', {
    conta_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'conta_id'
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'usuario_id'
        }
    },
    nome: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 50]
        }
    },
    tipo: {
        type: DataTypes.ENUM('Corrente', 'Poupança', 'Investimento', 'Carteira', 'Cartão de Crédito', 'Outro'),
        allowNull: false
    },
    saldo_atual: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        validate: {
            isDecimal: true
        }
    },
    instituicao: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ativa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    data_criacao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Contas',
    timestamps: false
});

// Definindo relacionamento
Conta.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Conta, { foreignKey: 'usuario_id' });

module.exports = Conta;