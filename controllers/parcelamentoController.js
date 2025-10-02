const Parcelamento = require('../models/Parcelamento');
const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');

const parcelamentoController = {
    // Lista todos os parcelamentos do usuário
    listar: async (req, res) => {
        try {
            const parcelamentos = await Parcelamento.findAll({
                where: { usuario_id: req.session.user.id },
                include: [{ 
                    model: Conta, 
                    attributes: ['nome', 'tipo', 'saldo_atual'],
                    required: true
                }],
                order: [['data_inicio', 'DESC']]
            });

            // Calcula informações adicionais para cada parcelamento
            const parcelamentosInfo = parcelamentos.map(parcelamento => ({
                ...parcelamento.toJSON(),
                progresso: ((parcelamento.parcela_atual / parcelamento.total_parcelas) * 100).toFixed(2),
                valor_pago: (parcelamento.parcela_atual * parcelamento.valor_parcela).toFixed(2),
                valor_restante: ((parcelamento.total_parcelas - parcelamento.parcela_atual) * parcelamento.valor_parcela).toFixed(2)
            }));

            res.render('parcelamentos/listar', { parcelamentos: parcelamentosInfo });
        } catch (error) {
            console.error('Erro ao listar parcelamentos:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao carregar parcelamentos: ${error.message}`;
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
                req.session.error = 'Você precisa ter pelo menos uma conta ativa para criar parcelamentos.';
                return res.redirect('/contas/criar');
            }

            res.render('parcelamentos/criar', { contas });
        } catch (error) {
            console.error('Erro ao carregar formulário de parcelamento:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao carregar formulário de parcelamento: ${error.message}`;
            res.redirect('/parcelamentos');
        }
    },

    // Cria novo parcelamento
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/parcelamentos/criar');
            }

            const { conta_id, descricao, total_parcelas, valor_total, data_inicio } = req.body;
            const valor_parcela = parseFloat(valor_total) / parseInt(total_parcelas);

            await Parcelamento.create({
                usuario_id: req.session.user.id,
                conta_id: conta_id,
                descricao,
                total_parcelas: parseInt(total_parcelas),
                valor_total: parseFloat(valor_total),
                valor_parcela,
                data_inicio,
                parcela_atual: 1
            });

            req.session.success = 'Parcelamento criado com sucesso!';
            res.redirect('/parcelamentos');
        } catch (error) {
            console.error('Erro ao criar parcelamento:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao criar parcelamento: ${error.message}`;
            res.redirect('/parcelamentos/criar');
        }
    },

    // Renderiza formulário de edição
    renderEditar: async (req, res) => {
        try {
            const parcelamento = await Parcelamento.findOne({
                where: {
                    id_parcelamento: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [Conta]
            });

            if (!parcelamento) {
                req.session.error = 'Parcelamento não encontrado.';
                return res.redirect('/parcelamentos');
            }

            // Buscar contas ativas do usuário
            const contas = await Conta.findAll({
                where: {
                    usuario_id: req.session.user.id,
                    ativa: true
                }
            });

            res.render('parcelamentos/editar', { parcelamento, contas });
        } catch (error) {
            console.error('Erro ao carregar parcelamento:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao carregar dados do parcelamento: ${error.message}`;
            res.redirect('/parcelamentos');
        }
    },

    // Atualiza parcelamento
    atualizar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect(`/parcelamentos/editar/${req.params.id}`);
            }

            const { descricao, total_parcelas, valor_total, parcela_atual, data_inicio, conta_id } = req.body;
            const parcelamento = await Parcelamento.findOne({
                where: {
                    id_parcelamento: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!parcelamento) {
                req.session.error = 'Parcelamento não encontrado.';
                return res.redirect('/parcelamentos');
            }

            const valor_parcela = parseFloat(valor_total) / parseInt(total_parcelas);

            await parcelamento.update({
                descricao,
                total_parcelas: parseInt(total_parcelas),
                parcela_atual: parseInt(parcela_atual),
                valor_total: parseFloat(valor_total),
                valor_parcela,
                data_inicio,
                conta_id: parseInt(conta_id),
                ativo: parseInt(parcela_atual) <= parseInt(total_parcelas)
            });

            req.session.success = 'Parcelamento atualizado com sucesso!';
            res.redirect('/parcelamentos');
        } catch (error) {
            console.error('Erro ao atualizar parcelamento:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao atualizar parcelamento: ${error.message}`;
            res.redirect('/parcelamentos');
        }
    },

    // Exclui parcelamento
    excluir: async (req, res) => {
        try {
            const parcelamento = await Parcelamento.findOne({
                where: {
                    id_parcelamento: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!parcelamento) {
                req.session.error = 'Parcelamento não encontrado.';
                return res.redirect('/parcelamentos');
            }

            await parcelamento.destroy();
            req.session.success = 'Parcelamento excluído com sucesso!';
            res.redirect('/parcelamentos');
        } catch (error) {
            console.error('Erro ao excluir parcelamento:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao excluir parcelamento: ${error.message}`;
            res.redirect('/parcelamentos');
        }
    },

    // Atualiza parcela atual
    atualizarParcela: async (req, res) => {
        try {
            const parcelamento = await Parcelamento.findOne({
                where: {
                    id_parcelamento: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [{
                    model: Conta,
                    attributes: ['conta_id', 'nome', 'saldo_atual']
                }]
            });

            if (!parcelamento) {
                req.session.error = 'Parcelamento não encontrado.';
                return res.redirect('/parcelamentos');
            }

            const novaParcela = parcelamento.parcela_atual + 1;
            if (novaParcela > parcelamento.total_parcelas) {
                req.session.error = 'Todas as parcelas já foram pagas.';
                return res.redirect('/parcelamentos');
            }

            // Verificar se a conta tem saldo suficiente
            const conta = parcelamento.Conta;
            if (conta.saldo_atual < parcelamento.valor_parcela) {
                req.session.error = 'Saldo insuficiente na conta para pagar esta parcela.';
                return res.redirect('/parcelamentos');
            }

            // Descontar o valor da parcela da conta
            await conta.update({
                saldo_atual: parseFloat(conta.saldo_atual) - parseFloat(parcelamento.valor_parcela)
            });

            await parcelamento.update({
                parcela_atual: novaParcela,
                ativo: novaParcela < parcelamento.total_parcelas
            });

            req.session.success = `Parcela ${novaParcela}/${parcelamento.total_parcelas} paga com sucesso! Valor de R$ ${parseFloat(parcelamento.valor_parcela).toFixed(2)} descontado da conta ${conta.nome}.`;
            res.redirect('/parcelamentos');
        } catch (error) {
            console.error('Erro ao atualizar parcela:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao atualizar parcela: ${error.message}`;
            res.redirect('/parcelamentos');
        }
    }
};

module.exports = parcelamentoController;