const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('Usuario', {
    usuario_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'usuario_id'
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    senha_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    data_cadastro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Usuarios',
    timestamps: false,
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.senha_hash) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('senha_hash')) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, salt);
            }
        }
    }
});

// Método para verificar senha
Usuario.prototype.verificarSenha = async function(senha) {
    return await bcrypt.compare(senha, this.senha_hash);
};

module.exports = Usuario;