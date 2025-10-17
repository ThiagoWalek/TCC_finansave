const Transferencia = require('../models/Transferencia');
const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

const transferenciaController = {
    // Transferências não podem ser editadas após criadas, apenas criadas ou excluídas
    // Lista todas as transferências do usuário
    listar: async (req, res) => {
        try {
            const transferencias = await Transferencia.findAll({
                where: { usuario_id: req.session.user.id },
                include: [
                    { 
                        model: Conta, 
                        as: 'contaOrigem', 
                        attributes: ['nome'],
                        required: true
                    }
                ],
                order: [['data_transferencia', 'DESC']]
            });

            const contas = await Conta.findAll({
                where: { 
                    usuario_id: req.session.user.id,
                    ativa: true
                },
                attributes: ['conta_id', 'nome', 'saldo_atual']
            });

            // Decorar registros com tipo (Envio/Recebimento) e nomes De/Para
            const transferenciasDecoradas = transferencias.map(t => {
                const desc = (t.descricao || '').toLowerCase();
                const tipoAttr = t.tipo || null; // suporte futuro caso coluna 'tipo' exista
                const isReceb = tipoAttr ? (tipoAttr === 'Recebimento') : desc.includes('recebimento');
                const de = isReceb ? (t.nome_conta_destino || 'Origem Externa') : (t.contaOrigem ? t.contaOrigem.nome : 'Conta não encontrada');
                const para = isReceb ? (t.contaOrigem ? t.contaOrigem.nome : 'Conta não encontrada') : (t.nome_conta_destino || 'Conta Externa');
                return Object.assign(t.toJSON(), { tipo: isReceb ? 'Recebimento' : 'Envio', deNome: de, paraNome: para });
            });

            res.render('transferencias/listar', { transferencias: transferenciasDecoradas, contas });
        } catch (error) {
            console.error('Erro ao listar transferências:', error);
            req.session.error = 'Erro ao carregar transferências.';
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
                attributes: ['conta_id', 'nome', 'saldo_atual']
            });
            const initialDirecao = (req.query && req.query.tipo === 'recebimento') ? 'recebimento' : 'envio';
            res.render('transferencias/criar', { contas, currentPage: 'transferencias', initialDirecao });
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            req.session.error = 'Erro ao carregar dados para transferência.';
            res.redirect('/transferencias');
        }
    },

    // Cria nova transferência
    criar: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.session.error = errors.array()[0].msg;
                return res.redirect('/transferencias/criar');
            }

            const { conta_origem_id, nome_conta_destino, valor, data_transferencia, descricao, direcao } = req.body;

            // Verifica se a conta pertence ao usuário
            const contaOrigem = await Conta.findOne({
                where: {
                    conta_id: conta_origem_id,
                    usuario_id: req.session.user.id,
                    ativa: true
                }
            });

            if (!contaOrigem) {
                req.session.error = 'Conta de origem inválida.';
                return res.redirect('/transferencias/criar');
            }

            // Para envio, validar saldo; para recebimento, não bloquear por saldo
            if (direcao !== 'recebimento') {
                if (parseFloat(contaOrigem.saldo_atual) < parseFloat(valor)) {
                    req.session.error = 'Saldo insuficiente na conta de origem.';
                    return res.redirect('/transferencias/criar');
                }
            }

            // Cria a transferência e atualiza os saldos
            await Transferencia.create({
                usuario_id: req.session.user.id,
                conta_origem_id,
                nome_conta_destino,
                valor,
                data_transferencia,
                descricao: (direcao === 'recebimento' ? '[Recebimento] ' : '[Envio] ') + (descricao || '')
            }, { transaction });

            // Atualiza saldo da conta de origem conforme direção
            if (direcao === 'recebimento') {
                await contaOrigem.update({
                    saldo_atual: parseFloat(contaOrigem.saldo_atual) + parseFloat(valor)
                }, { transaction });
            } else {
                await contaOrigem.update({
                    saldo_atual: parseFloat(contaOrigem.saldo_atual) - parseFloat(valor)
                }, { transaction });
            }

            await transaction.commit();
            req.session.success = direcao === 'recebimento' ? 'Recebimento registrado com sucesso!' : 'Transferência realizada com sucesso!';
            res.redirect('/transferencias');
        } catch (error) {
            await transaction.rollback();
            console.error('Erro ao criar transferência:', error);
            req.session.error = 'Erro ao realizar transferência.';
            res.redirect('/transferencias/criar');
        }
    },

    // Renderiza detalhes da transferência
    detalhes: async (req, res) => {
        try {
            const transferencia = await Transferencia.findOne({
                where: {
                    transferencia_id: req.params.id,
                    usuario_id: req.session.user.id
                },
                include: [
                    { model: Conta, as: 'contaOrigem', attributes: ['nome'] }
                ]
            });

            if (!transferencia) {
                req.session.error = 'Transferência não encontrada.';
                return res.redirect('/transferencias');
            }

            res.render('transferencias/detalhes', { transferencia });
        } catch (error) {
            console.error('Erro ao carregar detalhes da transferência:', error);
            req.session.error = 'Erro ao carregar detalhes da transferência.';
            res.redirect('/transferencias');
        }
    },

    // Exclui transferência
    excluir: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const transferencia = await Transferencia.findOne({
                where: {
                    transferencia_id: req.params.id,
                    usuario_id: req.session.user.id
                }
            });

            if (!transferencia) {
                req.session.error = 'Transferência não encontrada.';
                return res.redirect('/transferencias');
            }

            // Reverte o saldo da conta de origem conforme direção
            const contaOrigem = await Conta.findByPk(transferencia.conta_origem_id);
            const isReceb = (transferencia.descricao || '').toLowerCase().includes('recebimento');
            if (isReceb) {
                await contaOrigem.decrement('saldo_atual', { 
                    by: transferencia.valor,
                    transaction 
                });
            } else {
                await contaOrigem.increment('saldo_atual', { 
                    by: transferencia.valor,
                    transaction 
                });
            }

            await transferencia.destroy({ transaction });
            await transaction.commit();

            req.session.success = 'Transferência excluída com sucesso!';
            res.redirect('/transferencias');
        } catch (error) {
            await transaction.rollback();
            console.error('Erro ao excluir transferência:', error);
            req.session.error = 'Erro ao excluir transferência.';
            res.redirect('/transferencias');
        }
    }
};

module.exports = transferenciaController;