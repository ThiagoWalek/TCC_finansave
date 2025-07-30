const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Orcamento = sequelize.define('Orcamento', {
    id_orcamento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_orcamento'
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
    mes_ano: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true
        }
    },
    tipo: {
        type: DataTypes.ENUM('Receita', 'Despesa'),
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    descricao: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    valor_previsto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    valor_real: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    data_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status_orcamento: {
        type: DataTypes.ENUM('Previsto', 'Realizado'),
        defaultValue: 'Previsto'
    }
}, {
    tableName: 'Orcamentos',
    timestamps: false,
    hooks: {
        beforeSave: (orcamento) => {
            // Atualiza o status do orçamento quando valor real é definido
            if (orcamento.valor_real !== null) {
                orcamento.status_orcamento = 'Realizado';
            }
        }
    }
});

// Definindo relacionamento
Orcamento.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Orcamento, { foreignKey: 'usuario_id' });

module.exports = Orcamento;