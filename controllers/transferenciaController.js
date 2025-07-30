const Transferencia = require('../models/Transferencia');
const Conta = require('../models/Conta');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

const transferenciaController = {
    // Lista todas as transferências do usuário
    listar: async (req, res) => {
        try {
            const transferencias = await Transferencia.findAll({
                where: { usuario_id: req.session.user.id },
                include: [
                    { model: Conta, as: 'contaOrigem', attributes: ['nome'] },
                    { model: Conta, as: 'contaDestino', attributes: ['nome'] }
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

            res.render('transferencias/listar', { transferencias, contas });
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
            res.render('transferencias/criar', { contas });
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

            const { conta_origem_id, conta_destino_id, valor, data_transferencia, descricao } = req.body;

            // Verifica se as contas pertencem ao usuário
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

            if (parseFloat(contaOrigem.saldo_atual) < parseFloat(valor)) {
                req.session.error = 'Saldo insuficiente na conta de origem.';
                return res.redirect('/transferencias/criar');
            }

            let contaDestino = null;
            if (conta_destino_id) {
                contaDestino = await Conta.findOne({
                    where: {
                        conta_id: conta_destino_id,
                        usuario_id: req.session.user.id,
                        ativa: true
                    }
                });

                if (!contaDestino) {
                    req.session.error = 'Conta de destino inválida.';
                    return res.redirect('/transferencias/criar');
                }
            }

            // Cria a transferência e atualiza os saldos
            await Transferencia.create({
                usuario_id: req.session.user.id,
                conta_origem_id,
                conta_destino_id,
                valor,
                data_transferencia,
                descricao
            }, { transaction });

            // Atualiza saldo da conta de origem
            await contaOrigem.update({
                saldo_atual: parseFloat(contaOrigem.saldo_atual) - parseFloat(valor)
            }, { transaction });

            // Atualiza saldo da conta de destino se existir
            if (contaDestino) {
                await contaDestino.update({
                    saldo_atual: parseFloat(contaDestino.saldo_atual) + parseFloat(valor)
                }, { transaction });
            }

            await transaction.commit();
            req.session.success = 'Transferência realizada com sucesso!';
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
                    { model: Conta, as: 'contaOrigem', attributes: ['nome'] },
                    { model: Conta, as: 'contaDestino', attributes: ['nome'] }
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

            // Reverte os saldos das contas
            const contaOrigem = await Conta.findByPk(transferencia.conta_origem_id);
            await contaOrigem.increment('saldo_atual', { 
                by: transferencia.valor,
                transaction 
            });

            if (transferencia.conta_destino_id) {
                const contaDestino = await Conta.findByPk(transferencia.conta_destino_id);
                await contaDestino.decrement('saldo_atual', { 
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