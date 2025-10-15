const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Meta = sequelize.define('Meta', {
    meta_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'meta_id'
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
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    valor_alvo: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    valor_atual: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    data_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    data_limite: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isAfterDataInicio(value) {
                if (this.data_inicio && value && value <= this.data_inicio) {
                    throw new Error('A data limite deve ser posterior à data de início');
                }
            }
        }
    },
    concluida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'Metas',
    timestamps: false,
    hooks: {
        beforeSave: (meta) => {
            // Verifica se a meta foi concluída
            if (meta.valor_atual >= meta.valor_alvo) {
                meta.concluida = true;
            }
        }
    }
});

// Definindo relacionamento
Meta.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Meta, { foreignKey: 'usuario_id' });

module.exports = Meta;