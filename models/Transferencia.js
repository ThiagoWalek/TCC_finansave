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
    conta_destino_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Conta,
            key: 'conta_id'
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
        type: DataTypes.DATE,
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
    timestamps: false,
    hooks: {
        afterCreate: async (transferencia) => {
            // Atualiza os saldos das contas após a transferência
            const contaOrigem = await Conta.findByPk(transferencia.conta_origem_id);
            await contaOrigem.decrement('saldo_atual', { by: transferencia.valor });

            if (transferencia.conta_destino_id) {
                const contaDestino = await Conta.findByPk(transferencia.conta_destino_id);
                await contaDestino.increment('saldo_atual', { by: transferencia.valor });
            }
        },
        beforeDestroy: async (transferencia) => {
            // Reverte os saldos das contas ao deletar uma transferência
            const contaOrigem = await Conta.findByPk(transferencia.conta_origem_id);
            await contaOrigem.increment('saldo_atual', { by: transferencia.valor });

            if (transferencia.conta_destino_id) {
                const contaDestino = await Conta.findByPk(transferencia.conta_destino_id);
                await contaDestino.decrement('saldo_atual', { by: transferencia.valor });
            }
        }
    }
});

// Definindo relacionamentos
Transferencia.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Transferencia.belongsTo(Conta, { as: 'contaOrigem', foreignKey: 'conta_origem_id' });
Transferencia.belongsTo(Conta, { as: 'contaDestino', foreignKey: 'conta_destino_id' });

Usuario.hasMany(Transferencia, { foreignKey: 'usuario_id' });
Conta.hasMany(Transferencia, { as: 'transferenciasOrigem', foreignKey: 'conta_origem_id' });
Conta.hasMany(Transferencia, { as: 'transferenciasDestino', foreignKey: 'conta_destino_id' });

module.exports = Transferencia;