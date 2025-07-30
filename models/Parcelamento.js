const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Parcelamento = sequelize.define('Parcelamento', {
    id_parcelamento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_parcelamento'
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'usuario_id'
        }
    },
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    total_parcelas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    parcela_atual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            maxParcelaAtual(value) {
                if (value > this.total_parcelas) {
                    throw new Error('A parcela atual não pode ser maior que o total de parcelas');
                }
            }
        }
    },
    valor_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0.01
        }
    },
    valor_parcela: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0.01
        }
    },
    data_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true
        }
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Parcelamentos',
    timestamps: false,
    hooks: {
        beforeCreate: (parcelamento) => {
            // Calcula o valor da parcela se não foi definido
            if (!parcelamento.valor_parcela) {
                parcelamento.valor_parcela = parcelamento.valor_total / parcelamento.total_parcelas;
            }
        },
        beforeUpdate: (parcelamento) => {
            // Atualiza o status ativo quando todas as parcelas forem pagas
            if (parcelamento.parcela_atual > parcelamento.total_parcelas) {
                parcelamento.ativo = false;
            }
        }
    }
});

// Definindo relacionamento
Parcelamento.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Parcelamento, { foreignKey: 'usuario_id' });

module.exports = Parcelamento;