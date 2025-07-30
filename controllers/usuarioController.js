const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

const usuarioController = {
    // Renderiza página de registro
    renderRegistro: (req, res) => {
        res.render('usuarios/registro');
    },

    // Renderiza página de login
    renderLogin: (req, res) => {
        res.render('usuarios/login');
    },

    // Processa o registro de novo usuário
    registrar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/usuarios/registro');
            }

            const { nome, email, senha } = req.body;

            // Verifica se o email já está em uso
            const usuarioExistente = await Usuario.findOne({ where: { email } });
            if (usuarioExistente) {
                req.session.error = 'Este email já está cadastrado.';
                return res.redirect('/usuarios/registro');
            }

            // Cria novo usuário
            await Usuario.create({
                nome,
                email,
                senha_hash: senha
            });

            req.session.success = 'Cadastro realizado com sucesso! Faça login para continuar.';
            res.redirect('/usuarios/login');
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            req.session.error = 'Erro ao realizar cadastro. Tente novamente.';
            res.redirect('/usuarios/registro');
        }
    },

    // Processa o login
    login: async (req, res) => {
        try {
            const { email, senha } = req.body;

            const usuario = await Usuario.findOne({ where: { email } });
            if (!usuario || !(await usuario.verificarSenha(senha))) {
                req.session.error = 'Email ou senha inválidos.';
                return res.redirect('/usuarios/login');
            }

            // Armazena usuário na sessão
            req.session.user = {
                id: usuario.usuario_id,
                nome: usuario.nome,
                email: usuario.email
            };

            res.redirect('/');
        } catch (error) {
            console.error('Erro ao realizar login:', error);
            req.session.error = 'Erro ao realizar login. Tente novamente.';
            res.redirect('/usuarios/login');
        }
    },

    // Processa o logout
    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/usuarios/login');
    },

    // Renderiza perfil do usuário
    perfil: async (req, res) => {
        try {
            const usuario = await Usuario.findByPk(req.session.user.id, {
                attributes: ['usuario_id', 'nome', 'email', 'data_cadastro']
            });
            res.render('usuarios/perfil', { usuario });
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            req.session.error = 'Erro ao carregar perfil.';
            res.redirect('/');
        }
    },

    // Atualiza dados do perfil
    atualizarPerfil: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/usuarios/perfil');
            }

            const { nome, email, senha_atual, nova_senha } = req.body;
            const usuario = await Usuario.findByPk(req.session.user.id);

            if (senha_atual && nova_senha) {
                if (!(await usuario.verificarSenha(senha_atual))) {
                    req.session.error = 'Senha atual incorreta.';
                    return res.redirect('/usuarios/perfil');
                }
                usuario.senha_hash = nova_senha;
            }

            usuario.nome = nome;
            usuario.email = email;
            await usuario.save();

            // Atualiza dados da sessão
            req.session.user.nome = nome;
            req.session.user.email = email;

            req.session.success = 'Perfil atualizado com sucesso!';
            res.redirect('/usuarios/perfil');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            req.session.error = 'Erro ao atualizar perfil.';
            res.redirect('/usuarios/perfil');
        }
    }
};

module.exports = usuarioController;