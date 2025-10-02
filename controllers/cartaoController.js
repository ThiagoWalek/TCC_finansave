const Cartao = require('../models/Cartao');
const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');

const cartaoController = {
    // Lista todos os cartões do usuário
    listar: async (req, res) => {
        try {
            const cartoes = await Cartao.findAll({
                where: { usuario_id: req.session.user.id },
                include: [{ model: Conta, attributes: ['nome', 'tipo'] }],
                order: [['nome', 'ASC']]
            });

            res.render('cartoes/listar', { cartoes });
        } catch (error) {
            console.error('Erro ao listar cartões:', error);
            req.session.error = 'Erro ao carregar cartões.';
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação
    renderCriar: async (req, res) => {
        try {
            const contas = await Conta.findAll({
                where: { 
                    usuario_id: req.session.user.id,
                    ativa: true
                },
                order: [['nome', 'ASC']]
            });

            if (contas.length === 0) {
                req.session.error = 'Você precisa ter pelo menos uma conta ativa para criar um cartão.';
                return res.redirect('/contas/criar');
            }

            res.render('cartoes/criar', { contas });
        } catch (error) {
            console.error('Erro ao carregar formulário de cartão:', error);
            req.session.error = 'Erro ao carregar formulário.';
            res.redirect('/cartoes');
        }
    },

    // Cria novo cartão
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/cartoes/criar');
            }

            const { conta_id, nome, tipo, numero_final, limite_credito, data_vencimento } = req.body;

            // Verifica se a conta pertence ao usuário
            const conta = await Conta.findOne({
                where: {
                    conta_id: conta_id,
                    usuario_id: req.session.user.id,
                    ativa: true
                }
            });

            if (!conta) {
                req.session.error = 'Conta não encontrada ou inativa.';
                return res.redirect('/cartoes/criar');
            }

            const dadosCartao = {
                usuario_id: req.session.user.id,
                conta_id,
                nome,
                tipo,
                numero_final,
                data_vencimento: data_vencimento || null
            };

            // Se for cartão de crédito, define limite
            if (tipo === 'Crédito') {
                if (!limite_credito || parseFloat(limite_credito) <= 0) {
                    req.session.error = 'Limite de crédito é obrigatório para cartões de crédito.';
                    return res.redirect('/cartoes/criar');
                }
                dadosCartao.limite_credito = limite_credito;
                dadosCartao.limite_disponivel = limite_credito;
            }

            await Cartao.create(dadosCartao);

            req.session.success = 'Cartão criado com sucesso!';
            res.redirect('/cartoes');
        } catch (error) {
            console.error('Erro ao criar cartão:', error);
            req.session.error = 'Erro ao criar cartão.';
            res.redirect('/cartoes/criar');
        }
    },

    // Renderiza formulário de edição
    renderEditar: async (req, res) => {
        try {
            const cartao = await Cartao.findOne({
                where: {
                    cartao_id: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [{ model: Conta }]
            });

            if (!cartao) {
                req.session.error = 'Cartão não encontrado.';
                return res.redirect('/cartoes');
            }

            const contas = await Conta.findAll({
                where: { 
                    usuario_id: req.session.user.id,
                    ativa: true
                },
                order: [['nome', 'ASC']]
            });

            res.render('cartoes/editar', { cartao, contas });
        } catch (error) {
            console.error('Erro ao carregar cartão:', error);
            req.session.error = 'Erro ao carregar dados do cartão.';
            res.redirect('/cartoes');
        }
    },

    // Atualiza cartão
    atualizar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect(`/cartoes/editar/${req.params.id}`);
            }

            const { conta_id, nome, tipo, numero_final, limite_credito, data_vencimento, ativo } = req.body;
            
            const cartao = await Cartao.findOne({
                where: {
                    cartao_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!cartao) {
                req.session.error = 'Cartão não encontrado.';
                return res.redirect('/cartoes');
            }

            // Verifica se a conta pertence ao usuário
            const conta = await Conta.findOne({
                where: {
                    conta_id: conta_id,
                    usuario_id: req.session.user.id,
                    ativa: true
                }
            });

            if (!conta) {
                req.session.error = 'Conta não encontrada ou inativa.';
                return res.redirect(`/cartoes/editar/${req.params.id}`);
            }

            const dadosAtualizacao = {
                conta_id,
                nome,
                tipo,
                numero_final,
                data_vencimento: data_vencimento || null,
                ativo: ativo === 'on'
            };

            // Se for cartão de crédito, atualiza limite
            if (tipo === 'Crédito') {
                if (!limite_credito || parseFloat(limite_credito) <= 0) {
                    req.session.error = 'Limite de crédito é obrigatório para cartões de crédito.';
                    return res.redirect(`/cartoes/editar/${req.params.id}`);
                }
                
                const limiteAtual = parseFloat(cartao.limite_credito);
                const novoLimite = parseFloat(limite_credito);
                const limiteUsado = limiteAtual - parseFloat(cartao.limite_disponivel);
                
                dadosAtualizacao.limite_credito = novoLimite;
                dadosAtualizacao.limite_disponivel = novoLimite - limiteUsado;
                
                // Verifica se o novo limite não é menor que o valor já usado
                if (dadosAtualizacao.limite_disponivel < 0) {
                    req.session.error = 'O novo limite não pode ser menor que o valor já utilizado.';
                    return res.redirect(`/cartoes/editar/${req.params.id}`);
                }
            }

            await cartao.update(dadosAtualizacao);

            req.session.success = 'Cartão atualizado com sucesso!';
            res.redirect('/cartoes');
        } catch (error) {
            console.error('Erro ao atualizar cartão:', error);
            req.session.error = 'Erro ao atualizar cartão.';
            res.redirect(`/cartoes/editar/${req.params.id}`);
        }
    },

    // Exclui cartão
    excluir: async (req, res) => {
        try {
            const cartao = await Cartao.findOne({
                where: {
                    cartao_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!cartao) {
                req.session.error = 'Cartão não encontrado.';
                return res.redirect('/cartoes');
            }

            await cartao.destroy();

            req.session.success = 'Cartão excluído com sucesso!';
            res.redirect('/cartoes');
        } catch (error) {
            console.error('Erro ao excluir cartão:', error);
            req.session.error = 'Erro ao excluir cartão.';
            res.redirect('/cartoes');
        }
    }
};

module.exports = cartaoController;