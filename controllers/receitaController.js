const Receita = require('../models/Receita');
const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const receitaController = {
    // Lista todas as receitas do usuário (extrato)
    extrato: async (req, res) => {
        try {
            const { mes, ano, categoria } = req.query;
            let whereClause = { usuario_id: req.session.user.id };

            if (mes && ano) {
                const startDate = new Date(ano, mes - 1, 1);
                const endDate = new Date(ano, mes, 0);
                whereClause.data_receita = {
                    [Op.between]: [startDate, endDate]
                };
            } else if (ano) {
                const startDate = new Date(ano, 0, 1);
                const endDate = new Date(ano, 11, 31);
                whereClause.data_receita = {
                    [Op.between]: [startDate, endDate]
                };
            }

            if (categoria) {
                whereClause.categoria = categoria;
            }

            const receitas = await Receita.findAll({
                where: whereClause,
                include: [
                    { model: Conta, attributes: ['nome', 'tipo', 'saldo_atual'], where: { ativa: true }, required: true }
                ],
                order: [['data_receita', 'DESC']]
            });

            // Fallback robusto: mapear contas do usuário para garantir nome da conta
            const contasDoUsuario = await Conta.findAll({
                where: { usuario_id: req.session.user.id, ativa: true },
                attributes: ['conta_id', 'nome', 'ativa']
            });
            const contasMap = new Map(contasDoUsuario.map(c => [c.conta_id, c]));

            // Decorar com nome da conta para consistência nas views, usando associação ou fallback
            const receitasDecoradas = receitas.map(r => {
                const contaAssoc = r.Conta;
                const contaPeloId = contasMap.get(r.conta_id);
                r.conta_nome = contaAssoc ? contaAssoc.nome : (contaPeloId ? contaPeloId.nome : 'Conta não encontrada');
                return r;
            });

            const totalReceitas = receitas.reduce((total, r) => total + parseFloat(r.valor), 0);

            const categorias = await Receita.findAll({
                where: { usuario_id: req.session.user.id },
                attributes: ['categoria'],
                group: ['categoria'],
                order: [['categoria', 'ASC']]
            });

            res.render('receitas/extrato', {
                receitas: receitasDecoradas,
                totalReceitas,
                categorias: categorias.map(c => c.categoria),
                filtros: { mes, ano, categoria },
                currentPage: 'receitas'
            });
        } catch (error) {
            console.error('Erro ao listar receitas:', error);
            req.session.error = `Erro ao carregar extrato de receitas: ${error.message}`;
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação de receita
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
                req.session.error = 'Você precisa cadastrar pelo menos uma conta antes de registrar receitas.';
                return res.redirect('/contas/criar');
            }

            res.render('receitas/criar', { contas, currentPage: 'receitas' });
        } catch (error) {
            console.error('Erro ao carregar formulário de receita:', error);
            req.session.error = `Erro ao carregar formulário: ${error.message}`;
            res.redirect('/receitas/extrato');
        }
    },

    // Cria nova receita
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const contas = await Conta.findAll({
                    where: { usuario_id: req.session.user.id, ativa: true },
                    order: [['nome', 'ASC']]
                });

                const errorMessages = errors.array().map(error => error.msg).join(', ');
                req.session.error = `Erro de validação: ${errorMessages}`;
                return res.render('receitas/criar', { contas });
            }

            const { conta_id, descricao, categoria, valor, data_receita, observacoes } = req.body;

            if (!conta_id || !descricao || !categoria || !valor || !data_receita) {
                const contas = await Conta.findAll({
                    where: { usuario_id: req.session.user.id, ativa: true },
                    order: [['nome', 'ASC']]
                });
                req.session.error = 'Todos os campos obrigatórios devem ser preenchidos.';
                return res.render('receitas/criar', { contas });
            }

            const conta = await Conta.findOne({
                where: {
                    conta_id: conta_id,
                    usuario_id: req.session.user.id,
                    ativa: true
                }
            });

            if (!conta) {
                const contas = await Conta.findAll({
                    where: { usuario_id: req.session.user.id, ativa: true },
                    order: [['nome', 'ASC']]
                });
                req.session.error = 'Conta não encontrada ou inativa.';
                return res.render('receitas/criar', { contas });
            }

            await Receita.create({
                usuario_id: req.session.user.id,
                conta_id: conta_id,
                descricao,
                categoria,
                valor,
                data_receita,
                observacoes
            });

            await conta.update({
                saldo_atual: parseFloat(conta.saldo_atual) + parseFloat(valor)
            });

            req.session.success = 'Receita registrada com sucesso!';
            res.redirect('/receitas/extrato');
        } catch (error) {
            console.error('Erro ao criar receita:', error);
            try {
                const contas = await Conta.findAll({
                    where: { usuario_id: req.session.user.id, ativa: true },
                    order: [['nome', 'ASC']]
                });
                req.session.error = `Erro ao registrar receita: ${error.message}`;
                return res.render('receitas/criar', { contas });
            } catch (secondError) {
                console.error('Erro ao buscar contas após falha:', secondError);
                req.session.error = `Erro ao registrar receita: ${error.message}`;
                res.redirect('/receitas/criar');
            }
        }
    },

    // Renderiza formulário de edição
    renderEditar: async (req, res) => {
        try {
            const receita = await Receita.findOne({
                where: {
                    receita_id: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [{ model: Conta }]
            });

            if (!receita) {
                req.session.error = 'Receita não encontrada.';
                return res.redirect('/receitas/extrato');
            }

            const contas = await Conta.findAll({
                where: { usuario_id: req.session.user.id, ativa: true },
                order: [['nome', 'ASC']]
            });

            res.render('receitas/editar', { receita, contas, currentPage: 'receitas' });
        } catch (error) {
            console.error('Erro ao carregar receita para edição:', error);
            req.session.error = 'Erro ao carregar dados da receita.';
            res.redirect('/receitas/extrato');
        }
    },

    // Atualiza receita
    atualizar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array().map(e => e.msg).join(', ');
                return res.redirect(`/receitas/editar/${req.params.id}`);
            }

            const receita = await Receita.findOne({
                where: {
                    receita_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!receita) {
                req.session.error = 'Receita não encontrada.';
                return res.redirect('/receitas/extrato');
            }

            const { conta_id, descricao, categoria, valor, data_receita, observacoes } = req.body;
            const oldContaId = receita.conta_id;
            const oldValor = parseFloat(receita.valor);
            const newValor = parseFloat(valor);

            // Atualiza receita
            await receita.update({ conta_id, descricao, categoria, valor: newValor, data_receita, observacoes });

            // Ajuste de saldo das contas conforme alterações
            if (parseInt(conta_id) !== parseInt(oldContaId)) {
                const contaAntiga = await Conta.findOne({
                    where: { conta_id: oldContaId, usuario_id: req.session.user.id }
                });
                const contaNova = await Conta.findOne({
                    where: { conta_id: conta_id, usuario_id: req.session.user.id }
                });

                if (contaAntiga) {
                    await contaAntiga.update({ saldo_atual: parseFloat(contaAntiga.saldo_atual) - oldValor });
                }
                if (contaNova) {
                    await contaNova.update({ saldo_atual: parseFloat(contaNova.saldo_atual) + newValor });
                }
            } else {
                const conta = await Conta.findOne({
                    where: { conta_id: conta_id, usuario_id: req.session.user.id }
                });
                if (conta) {
                    const diff = newValor - oldValor;
                    await conta.update({ saldo_atual: parseFloat(conta.saldo_atual) + diff });
                }
            }

            req.session.success = 'Receita atualizada com sucesso!';
            res.redirect('/receitas/extrato');
        } catch (error) {
            console.error('Erro ao atualizar receita:', error);
            req.session.error = `Erro ao atualizar receita: ${error.message}`;
            res.redirect('/receitas/extrato');
        }
    },

    // Detalhar receita
    detalhar: async (req, res) => {
        try {
            const receita = await Receita.findOne({
                where: {
                    receita_id: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [{ model: Conta, attributes: ['nome', 'tipo'] }]
            });

            if (!receita) {
                req.session.error = 'Receita não encontrada.';
                return res.redirect('/receitas/extrato');
            }

            // Fallback: se a associação da conta não vier, buscar pelo conta_id
            if (!receita.Conta) {
                const conta = await Conta.findOne({
                    where: { conta_id: receita.conta_id, usuario_id: req.session.user.id }
                });
                if (conta) {
                    receita.setDataValue('Conta', { nome: conta.nome, tipo: conta.tipo });
                }
            }

            res.render('receitas/detalhe', { receita, currentPage: 'receitas' });
        } catch (error) {
            console.error('Erro ao carregar detalhes da receita:', error);
            req.session.error = 'Erro ao carregar detalhes da receita.';
            res.redirect('/receitas/extrato');
        }
    },

    // Exclui receita
    excluir: async (req, res) => {
        try {
            const receita = await Receita.findOne({
                where: {
                    receita_id: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [{ model: Conta }]
            });

            if (!receita) {
                req.session.error = 'Receita não encontrada.';
                return res.redirect('/receitas/extrato');
            }

            // Remover do saldo da conta ao excluir receita
            if (receita.Conta) {
                await receita.Conta.update({
                    saldo_atual: parseFloat(receita.Conta.saldo_atual) - parseFloat(receita.valor)
                });
            }

            await receita.destroy();

            req.session.success = 'Receita excluída com sucesso!';
            res.redirect('/receitas/extrato');
        } catch (error) {
            console.error('Erro ao excluir receita:', error);
            req.session.error = `Erro ao excluir receita: ${error.message}`;
            res.redirect('/receitas/extrato');
        }
    }
};

module.exports = receitaController;