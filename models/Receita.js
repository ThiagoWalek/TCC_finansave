const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Conta = require('./Conta');

const Receita = sequelize.define('Receita', {
    receita_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'receita_id'
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
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 255]
        }
    },
    categoria: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 50]
        }
    },
    valor: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0.01
        }
    },
    data_receita: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    data_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    observacoes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Receitas',
    timestamps: false
});

// Associações
Receita.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Receita.belongsTo(Conta, { foreignKey: 'conta_id' });
Usuario.hasMany(Receita, { foreignKey: 'usuario_id' });
Conta.hasMany(Receita, { foreignKey: 'conta_id' });

module.exports = Receita;