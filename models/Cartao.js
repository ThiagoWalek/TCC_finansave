const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Conta = require('./Conta');

const Cartao = sequelize.define('Cartao', {
    cartao_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'cartao_id'
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'usuario_id'
        }
    },
    conta_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Conta,
            key: 'conta_id'
        }
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    tipo: {
        type: DataTypes.ENUM('Débito', 'Crédito'),
        allowNull: false
    },
    numero_final: {
        type: DataTypes.STRING(4),
        allowNull: true,
        validate: {
            len: [4, 4]
        }
    },
    limite_credito: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    limite_disponivel: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    data_vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    data_criacao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Cartoes',
    timestamps: false
});

// Definindo associações
Cartao.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Cartao.belongsTo(Conta, { foreignKey: 'conta_id' });
Usuario.hasMany(Cartao, { foreignKey: 'usuario_id' });
Conta.hasMany(Cartao, { foreignKey: 'conta_id' });

module.exports = Cartao;