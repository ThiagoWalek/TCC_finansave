const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Conta = require('./Conta');

const Transferencia = sequelize.define('Transferencia', {
    transferencia_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'transferencia_id'
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'usuario_id'
        }
    },
    conta_origem_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Conta,
            key: 'conta_id'
        }
    },
    nome_conta_destino: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: [0, 50]
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
    data_transferencia: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true
        }
    },
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'Transferencias',
    timestamps: false
});

// Definindo relacionamentos
Transferencia.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Transferencia.belongsTo(Conta, { as: 'contaOrigem', foreignKey: 'conta_origem_id' });

Usuario.hasMany(Transferencia, { foreignKey: 'usuario_id' });
Conta.hasMany(Transferencia, { as: 'transferenciasOrigem', foreignKey: 'conta_origem_id' });

module.exports = Transferencia;