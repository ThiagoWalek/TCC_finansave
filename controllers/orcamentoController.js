const Orcamento = require('../models/Orcamento');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const orcamentoController = {
    // Lista todos os orçamentos do usuário
    listar: async (req, res) => {
        try {
            const { mes_ano, tipo, status } = req.query;
            let mes, ano;
            
            if (mes_ano) {
                [ano, mes] = mes_ano.split('-');
            }
            let where = { usuario_id: req.session.user.id };

            // Filtra por tipo se fornecido
            if (tipo) {
                where.tipo = tipo;
            }

            // Filtra por status se fornecido
            if (status) {
                if (status === 'Dentro') {
                    where = {
                        ...where,
                        valor_real: {
                            [Op.not]: null,
                            [Op.lte]: sequelize.literal('valor_previsto'),
                            [Op.gte]: sequelize.literal('valor_previsto * 0.8')
                        }
                    };
                } else if (status === 'Acima') {
                    where = {
                        ...where,
                        valor_real: {
                            [Op.not]: null,
                            [Op.gt]: sequelize.literal('valor_previsto')
                        }
                    };
                } else if (status === 'Abaixo') {
                    where = {
                        ...where,
                        valor_real: {
                            [Op.not]: null,
                            [Op.lt]: sequelize.literal('valor_previsto * 0.8')
                        }
                    };
                }
            }

            // Filtra por mês/ano se fornecidos
            if (mes && ano) {
                // Extrai o mês e o ano da coluna mes_ano
                where = {
                    ...where,
                    [Op.and]: [
                        sequelize.where(sequelize.fn('MONTH', sequelize.col('mes_ano')), mes),
                        sequelize.where(sequelize.fn('YEAR', sequelize.col('mes_ano')), ano)
                    ]
                };
            } else {
                // Se não houver filtro de data, mostra o mês atual por padrão
                const hoje = new Date();
                const mesAtual = hoje.getMonth() + 1;
                const anoAtual = hoje.getFullYear();
                where = {
                    ...where,
                    [Op.and]: [
                        sequelize.where(sequelize.fn('MONTH', sequelize.col('mes_ano')), mesAtual),
                        sequelize.where(sequelize.fn('YEAR', sequelize.col('mes_ano')), anoAtual)
                    ]
                };
            }

            const orcamentos = await Orcamento.findAll({
                where,
                order: [['mes_ano', 'DESC'], ['tipo', 'ASC']]
            });

            // Calcula totais
            const totais = {
                receitas: {
                    previsto: 0,
                    realizado: 0
                },
                despesas: {
                    previsto: 0,
                    realizado: 0
                }
            };

            orcamentos.forEach(orcamento => {
                if (orcamento.tipo === 'Receita') {
                    totais.receitas.previsto += parseFloat(orcamento.valor_previsto);
                    totais.receitas.realizado += parseFloat(orcamento.valor_real || 0);
                } else {
                    totais.despesas.previsto += parseFloat(orcamento.valor_previsto);
                    totais.despesas.realizado += parseFloat(orcamento.valor_real || 0);
                }
            });

            res.render('orcamentos/listar', { 
                orcamentos, 
                totais, 
                mesAtual: mes || '', 
                anoAtual: ano || '',
                filtros: {
                    mes_ano: mes_ano || '',
                    tipo: tipo || '',
                    status: status || ''
                }
            });
        } catch (error) {
            console.error('Erro ao listar orçamentos:', error);
            req.session.error = 'Erro ao carregar orçamentos.';
            res.redirect('/');
        }
    },

    // Renderiza formulário de criação
    renderCriar: (req, res) => {
        res.render('orcamentos/criar');
    },

    // Cria novo orçamento
    criar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/orcamentos/criar');
            }

            const { nome, mes_ano, tipo, categoria, descricao, valor_previsto, valor_real } = req.body;
            
            // Converte mes_ano (YYYY-MM) para um objeto Date válido
            const [ano, mes] = mes_ano.split('-');
            const dataOrcamento = new Date(ano, mes - 1, 1);

            // Calcula o status do orçamento com base nos valores
            const valorPrevisto = parseFloat(valor_previsto);
            const valorReal = valor_real ? parseFloat(valor_real) : 0;
            const progresso = valorReal / valorPrevisto * 100;
            const status = !valor_real ? 'Previsto' :
                          progresso > 100 ? 'Acima' :
                          progresso < 80 ? 'Abaixo' : 'Dentro';

            await Orcamento.create({
                usuario_id: req.session.user.id,
                nome,
                mes_ano: dataOrcamento,
                tipo,
                categoria,
                descricao,
                valor_previsto: valorPrevisto,
                valor_real: valorReal || null,
                status_orcamento: status
            });

            req.session.success = 'Orçamento criado com sucesso!';
            res.redirect('/orcamentos');
        } catch (error) {
            console.error('Erro ao criar orçamento:', error);
            req.session.error = 'Erro ao criar orçamento.';
            res.redirect('/orcamentos/criar');
        }
    },

    // Renderiza formulário de edição
    renderEditar: async (req, res) => {
        try {
            const orcamento = await Orcamento.findOne({
                where: {
                    id_orcamento: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!orcamento) {
                req.session.error = 'Orçamento não encontrado.';
                return res.redirect('/orcamentos');
            }

            res.render('orcamentos/editar', { orcamento });
        } catch (error) {
            console.error('Erro ao carregar orçamento:', error);
            req.session.error = 'Erro ao carregar dados do orçamento.';
            res.redirect('/orcamentos');
        }
    },

    // Atualiza orçamento
    atualizar: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect(`/orcamentos/editar/${req.params.id}`);
            }

            const { nome, mes_ano, tipo, categoria, descricao, valor_previsto, valor_real } = req.body;
            
            // Converte mes_ano (YYYY-MM) para um objeto Date válido
            const [ano, mes] = mes_ano.split('-');
            const dataOrcamento = new Date(ano, mes - 1, 1);

            const orcamento = await Orcamento.findOne({
                where: {
                    id_orcamento: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!orcamento) {
                req.session.error = 'Orçamento não encontrado.';
                return res.redirect('/orcamentos');
            }

            // Calcula o status do orçamento com base nos valores
            const valorPrevisto = parseFloat(valor_previsto);
            const valorReal = valor_real ? parseFloat(valor_real) : 0;
            const progresso = valorReal / valorPrevisto * 100;
            const status = !valor_real ? 'Previsto' :
                          progresso > 100 ? 'Acima' :
                          progresso < 80 ? 'Abaixo' : 'Dentro';

            await orcamento.update({
                nome,
                mes_ano: dataOrcamento,
                tipo,
                categoria,
                descricao,
                valor_previsto: valorPrevisto,
                valor_real: valorReal || null,
                status_orcamento: status
            });

            req.session.success = 'Orçamento atualizado com sucesso!';
            res.redirect('/orcamentos');
        } catch (error) {
            console.error('Erro ao atualizar orçamento:', error);
            req.session.error = 'Erro ao atualizar orçamento.';
            res.redirect('/orcamentos');
        }
    },

    // Exclui orçamento
    excluir: async (req, res) => {
        try {
            const orcamento = await Orcamento.findOne({
                where: {
                    id_orcamento: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!orcamento) {
                req.session.error = 'Orçamento não encontrado.';
                return res.redirect('/orcamentos');
            }

            await orcamento.destroy();
            req.session.success = 'Orçamento excluído com sucesso!';
            res.redirect('/orcamentos');
        } catch (error) {
            console.error('Erro ao excluir orçamento:', error);
            req.session.error = 'Erro ao excluir orçamento.';
            res.redirect('/orcamentos');
        }
    }
};

module.exports = orcamentoController;