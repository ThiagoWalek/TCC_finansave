const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');

const contaController = {
    // Lista todas as contas do usuário
    listar: async (req, res) => {
        try {
            const contas = await Conta.findAll({
                where: { usuario_id: req.session.user.id },
                order: [['nome', 'ASC']]
            });

            // Calcula saldo total
            const saldoTotal = contas.reduce((total, conta) => {
                return total + parseFloat(conta.saldo_atual);
            }, 0);

            res.render('contas/listar', { contas, saldoTotal });
        } catch (error) {
            console.error('Erro ao listar contas:', error);
            req.session.error = 'Erro ao carregar contas.';
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação
    renderCriar: (req, res) => {
        res.render('contas/criar');
    },

    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/contas/criar');
            }

            const { nome, tipo, saldo_atual, instituicao } = req.body;
            await Conta.create({
                usuario_id: req.session.user.id,
                nome,
                tipo,
                saldo_atual: saldo_atual || 0,
                instituicao
            });

            req.session.success = 'Conta criada com sucesso!';
            res.redirect('/contas');
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            req.session.error = 'Erro ao criar conta.';
            res.redirect('/contas/criar');
        }
    },

    // Renderiza formulário de edição
    renderEditar: async (req, res) => {
        try {
            const conta = await Conta.findOne({
                where: {
                    conta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!conta) {
                req.session.error = 'Conta não encontrada.';
                return res.redirect('/contas');
            }

            res.render('contas/editar', { conta });
        } catch (error) {
            console.error('Erro ao carregar conta:', error);
            req.session.error = 'Erro ao carregar dados da conta.';
            res.redirect('/contas');
        }
    },

    // Atualiza conta
    atualizar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect(`/contas/editar/${req.params.id}`);
            }

            const { nome, tipo, saldo_atual, instituicao, ativa } = req.body;
            const conta = await Conta.findOne({
                where: {
                    conta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!conta) {
                req.session.error = 'Conta não encontrada.';
                return res.redirect('/contas');
            }

            await conta.update({
                nome,
                tipo,
                saldo_atual,
                instituicao,
                ativa: ativa === 'true'
            });

            req.session.success = 'Conta atualizada com sucesso!';
            res.redirect('/contas');
        } catch (error) {
            console.error('Erro ao atualizar conta:', error);
            req.session.error = 'Erro ao atualizar conta.';
            res.redirect('/contas');
        }
    },

    // Exclui conta
    excluir: async (req, res) => {
        try {
            const conta = await Conta.findOne({
                where: {
                    conta_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!conta) {
                req.session.error = 'Conta não encontrada.';
                return res.redirect('/contas');
            }

            await conta.destroy();
            req.session.success = 'Conta excluída com sucesso!';
            res.redirect('/contas');
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            req.session.error = 'Erro ao excluir conta.';
            res.redirect('/contas');
        }
    }
};

module.exports = contaController;