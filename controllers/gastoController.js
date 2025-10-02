const Gasto = require('../models/Gasto');
const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const gastoController = {
    // Lista todos os gastos do usuário (extrato)
    extrato: async (req, res) => {
        try {
            const { mes, ano, categoria } = req.query;
            let whereClause = { usuario_id: req.session.user.id };

            // Filtros opcionais
            if (mes && ano) {
                const startDate = new Date(ano, mes - 1, 1);
                const endDate = new Date(ano, mes, 0);
                whereClause.data_gasto = {
                    [Op.between]: [startDate, endDate]
                };
            }

            if (categoria) {
                whereClause.categoria = categoria;
            }

            const gastos = await Gasto.findAll({
                where: whereClause,
                include: [
                    { model: Conta, attributes: ['nome', 'tipo', 'saldo_atual'] }
                ],
                order: [['data_gasto', 'DESC']]
            });

            // Calcula total de gastos
            const totalGastos = gastos.reduce((total, gasto) => {
                return total + parseFloat(gasto.valor);
            }, 0);

            // Busca categorias únicas para filtro
            const categorias = await Gasto.findAll({
                where: { usuario_id: req.session.user.id },
                attributes: ['categoria'],
                group: ['categoria'],
                order: [['categoria', 'ASC']]
            });

            res.render('gastos/extrato', { 
                gastos, 
                totalGastos, 
                categorias: categorias.map(c => c.categoria),
                filtros: { mes, ano, categoria }
            });
        } catch (error) {
            console.error('Erro ao listar gastos:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao carregar extrato de gastos: ${error.message}`;
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação de gasto
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
                req.session.error = 'Você precisa cadastrar pelo menos uma conta antes de registrar gastos.';
                return res.redirect('/contas/criar');
            }

            res.render('gastos/criar', { contas });
        } catch (error) {
            console.error('Erro ao carregar formulário de gasto:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao carregar formulário: ${error.message}`;
            res.redirect('/gastos/extrato');
        }
    },

    // Cria novo gasto
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Busca contas novamente para reexibir o formulário
                const contas = await Conta.findAll({
                    where: { 
                        usuario_id: req.session.user.id,
                        ativa: true
                    },
                    order: [['nome', 'ASC']]
                });

                const errorMessages = errors.array().map(error => error.msg).join(', ');
                req.session.error = `Erro de validação: ${errorMessages}`;
                return res.render('gastos/criar', { contas });
            }

            const { conta_id, descricao, categoria, valor, data_gasto, observacoes } = req.body;

            // Validações adicionais
            if (!conta_id || !descricao || !categoria || !valor || !data_gasto) {
                const contas = await Conta.findAll({
                    where: { 
                        usuario_id: req.session.user.id,
                        ativa: true
                    },
                    order: [['nome', 'ASC']]
                });
                req.session.error = 'Todos os campos obrigatórios devem ser preenchidos.';
                return res.render('gastos/criar', { contas });
            }

            // Busca a conta
            const conta = await Conta.findOne({
                where: {
                    conta_id: conta_id,
                    usuario_id: req.session.user.id,
                    ativa: true
                }
            });

            if (!conta) {
                const contas = await Conta.findAll({
                    where: { 
                        usuario_id: req.session.user.id,
                        ativa: true
                    },
                    order: [['nome', 'ASC']]
                });
                req.session.error = 'Conta não encontrada ou inativa.';
                return res.render('gastos/criar', { contas });
            }

            // Verifica se há saldo suficiente na conta
            if (parseFloat(conta.saldo_atual) < parseFloat(valor)) {
                const contas = await Conta.findAll({
                    where: { 
                        usuario_id: req.session.user.id,
                        ativa: true
                    },
                    order: [['nome', 'ASC']]
                });
                req.session.error = `Saldo insuficiente na conta. Saldo disponível: R$ ${parseFloat(conta.saldo_atual).toFixed(2).replace('.', ',')}`;
                return res.render('gastos/criar', { contas });
            }

            // Cria o gasto
            await Gasto.create({
                usuario_id: req.session.user.id,
                conta_id: conta_id,
                descricao,
                categoria,
                valor,
                data_gasto,
                observacoes
            });

            // Atualiza saldo da conta (deduz o valor gasto)
            await conta.update({
                saldo_atual: parseFloat(conta.saldo_atual) - parseFloat(valor)
            });

            req.session.success = 'Gasto registrado com sucesso!';
            res.redirect('/gastos/extrato');
        } catch (error) {
            console.error('Erro ao criar gasto:', error);
            console.error('Stack trace:', error.stack);
            
            // Busca contas para reexibir o formulário em caso de erro
            try {
                const contas = await Conta.findAll({
                    where: { 
                        usuario_id: req.session.user.id,
                        ativa: true
                    },
                    order: [['nome', 'ASC']]
                });
                req.session.error = `Erro ao registrar gasto: ${error.message}`;
                return res.render('gastos/criar', { contas });
            } catch (secondError) {
                console.error('Erro ao buscar contas após falha:', secondError);
                req.session.error = `Erro ao registrar gasto: ${error.message}`;
                res.redirect('/gastos/criar');
            }
        }
    },

    // Exclui gasto
    excluir: async (req, res) => {
        try {
            const gasto = await Gasto.findOne({
                where: {
                    gasto_id: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [{ model: Conta }]
            });

            if (!gasto) {
                req.session.error = 'Gasto não encontrado.';
                return res.redirect('/gastos/extrato');
            }

            // Restaura o saldo da conta
            await gasto.Conta.update({
                saldo_atual: parseFloat(gasto.Conta.saldo_atual) + parseFloat(gasto.valor)
            });

            await gasto.destroy();

            req.session.success = 'Gasto excluído com sucesso!';
            res.redirect('/gastos/extrato');
        } catch (error) {
            console.error('Erro ao excluir gasto:', error);
            console.error('Stack trace:', error.stack);
            req.session.error = `Erro ao excluir gasto: ${error.message}`;
            res.redirect('/gastos/extrato');
        }
    }
};

module.exports = gastoController;