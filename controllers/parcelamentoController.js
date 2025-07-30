const Parcelamento = require('../models/Parcelamento');
const { validationResult } = require('express-validator');

const parcelamentoController = {
    // Lista todos os parcelamentos do usuário
    listar: async (req, res) => {
        try {
            const parcelamentos = await Parcelamento.findAll({
                where: { usuario_id: req.session.user.id },
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
            req.session.error = 'Erro ao carregar parcelamentos.';
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação
    renderCriar: (req, res) => {
        res.render('parcelamentos/criar');
    },

    // Cria novo parcelamento
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/parcelamentos/criar');
            }

            const { descricao, total_parcelas, valor_total, data_inicio } = req.body;
            const valor_parcela = parseFloat(valor_total) / parseInt(total_parcelas);

            await Parcelamento.create({
                usuario_id: req.session.user.id,
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
            req.session.error = 'Erro ao criar parcelamento.';
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
                }
            });

            if (!parcelamento) {
                req.session.error = 'Parcelamento não encontrado.';
                return res.redirect('/parcelamentos');
            }

            res.render('parcelamentos/editar', { parcelamento });
        } catch (error) {
            console.error('Erro ao carregar parcelamento:', error);
            req.session.error = 'Erro ao carregar dados do parcelamento.';
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

            const { descricao, total_parcelas, valor_total, parcela_atual, data_inicio } = req.body;
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
                ativo: parseInt(parcela_atual) <= parseInt(total_parcelas)
            });

            req.session.success = 'Parcelamento atualizado com sucesso!';
            res.redirect('/parcelamentos');
        } catch (error) {
            console.error('Erro ao atualizar parcelamento:', error);
            req.session.error = 'Erro ao atualizar parcelamento.';
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
            req.session.error = 'Erro ao excluir parcelamento.';
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
                }
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

            await parcelamento.update({
                parcela_atual: novaParcela,
                ativo: novaParcela < parcelamento.total_parcelas
            });

            req.session.success = 'Parcela atualizada com sucesso!';
            res.redirect('/parcelamentos');
        } catch (error) {
            console.error('Erro ao atualizar parcela:', error);
            req.session.error = 'Erro ao atualizar parcela.';
            res.redirect('/parcelamentos');
        }
    }
};

module.exports = parcelamentoController;