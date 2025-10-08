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
                    attributes: ['nome', 'tipo', 'saldo_atual', 'ativa'],
                    required: false // Permite parcelamentos com contas inativas
                }],
                order: [['data_inicio', 'DESC']]
            });

            // Buscar todas as contas do usuário (ativas e inativas) para fallback
            const contasDoUsuario = await Conta.findAll({
                where: { usuario_id: req.session.user.id },
                attributes: ['conta_id', 'nome', 'tipo', 'saldo_atual', 'ativa']
            });
            const contasMap = new Map(contasDoUsuario.map(c => [c.conta_id, c]));

            // Calcula informações adicionais para cada parcelamento
            const parcelamentosInfo = parcelamentos.map(parcelamento => {
                const contaAssociada = parcelamento.Conta || contasMap.get(parcelamento.conta_id) || null;
                const info = {
                    ...parcelamento.toJSON(),
                    progresso: ((parcelamento.parcela_atual / parcelamento.total_parcelas) * 100).toFixed(2),
                    valor_pago: (parcelamento.parcela_atual * parcelamento.valor_parcela).toFixed(2),
                    valor_restante: ((parcelamento.total_parcelas - parcelamento.parcela_atual) * parcelamento.valor_parcela).toFixed(2),
                    conta_inativa: !contaAssociada || !contaAssociada.ativa
                };
                
                // Se a conta não existe ou está inativa, adiciona informação
                if (!contaAssociada) {
                    info.conta_nome = 'Conta não encontrada';
                    info.conta_status = 'inexistente';
                } else if (!contaAssociada.ativa) {
                    info.conta_nome = contaAssociada.nome;
                    info.conta_status = 'inativa';
                } else {
                    info.conta_nome = contaAssociada.nome;
                    info.conta_status = 'ativa';
                }
                
                return info;
            });

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
            // Validar existência da conta do usuário
            const contaCriacao = await Conta.findOne({
                where: {
                    conta_id: parseInt(conta_id),
                    usuario_id: req.session.user.id
                }
            });

            if (!contaCriacao) {
                req.session.error = 'Conta selecionada não encontrada.';
                return res.redirect('/parcelamentos/criar');
            }

            const valor_parcela = parseFloat(valor_total) / parseInt(total_parcelas);

            await Parcelamento.create({
                usuario_id: req.session.user.id,
                conta_id: parseInt(conta_id),
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

            // Validar existência da conta do usuário
            const contaEdicao = await Conta.findOne({
                where: {
                    conta_id: parseInt(conta_id),
                    usuario_id: req.session.user.id
                }
            });

            if (!contaEdicao) {
                req.session.error = 'Conta selecionada não encontrada.';
                return res.redirect(`/parcelamentos/editar/${req.params.id}`);
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
                    attributes: ['conta_id', 'nome', 'saldo_atual', 'ativa'],
                    required: false // Permite carregar parcelamento mesmo com conta inativa
                }]
            });

            if (!parcelamento) {
                req.session.error = 'Parcelamento não encontrado.';
                return res.redirect('/parcelamentos');
            }

            // Buscar conta associada (associação ou fallback pelo conta_id do usuário)
            let conta = parcelamento.Conta;
            if (!conta) {
                conta = await Conta.findOne({
                    where: {
                        conta_id: parcelamento.conta_id,
                        usuario_id: req.session.user.id
                    },
                    attributes: ['conta_id', 'nome', 'saldo_atual', 'ativa']
                });
            }

            if (!conta) {
                console.error('Conta não encontrada para o parcelamento:', parcelamento.id_parcelamento);
                req.session.error = 'Conta associada ao parcelamento não foi localizada no sistema. Verifique os dados informados e tente novamente.';
                return res.redirect('/parcelamentos');
            }

            // Verificar se a conta está ativa
            if (!conta.ativa) {
                console.error('Conta inativa para o parcelamento:', parcelamento.id_parcelamento);
                req.session.error = `A conta "${conta.nome}" está inativa. Reative a conta para continuar com o parcelamento.`;
                return res.redirect('/parcelamentos');
            }

            // A parcela_atual representa a próxima parcela a pagar; permitir quitar a última parcela
            const novaParcela = parcelamento.parcela_atual + 1;
            if (parcelamento.parcela_atual > parcelamento.total_parcelas) {
                req.session.error = 'Todas as parcelas já foram pagas.';
                return res.redirect('/parcelamentos');
            }

            // Verificação adicional de segurança para saldo_atual
            if (typeof conta.saldo_atual === 'undefined' || conta.saldo_atual === null) {
                console.error('Saldo atual da conta não definido:', conta);
                req.session.error = 'Erro nos dados da conta. Verifique se a conta está configurada corretamente.';
                return res.redirect('/parcelamentos');
            }

            const saldoAtual = parseFloat(conta.saldo_atual);
            const valorParcela = parseFloat(parcelamento.valor_parcela);

            if (isNaN(saldoAtual) || isNaN(valorParcela)) {
                console.error('Valores inválidos - Saldo:', saldoAtual, 'Valor parcela:', valorParcela);
                req.session.error = 'Erro nos valores da conta ou parcela.';
                return res.redirect('/parcelamentos');
            }

            if (saldoAtual < valorParcela) {
                req.session.error = `Saldo insuficiente na conta ${conta.nome}. Saldo atual: R$ ${saldoAtual.toFixed(2)}, Valor da parcela: R$ ${valorParcela.toFixed(2)}.`;
                return res.redirect('/parcelamentos');
            }

            // Descontar o valor da parcela da conta
            const novoSaldo = saldoAtual - valorParcela;
            await conta.update({
                saldo_atual: novoSaldo
            });

            await parcelamento.update({
                parcela_atual: novaParcela,
                ativo: novaParcela <= parcelamento.total_parcelas ? (novaParcela < parcelamento.total_parcelas) : false
            });

            req.session.success = `Parcela ${novaParcela}/${parcelamento.total_parcelas} paga com sucesso! Valor de R$ ${valorParcela.toFixed(2)} descontado da conta ${conta.nome}. Novo saldo: R$ ${novoSaldo.toFixed(2)}.`;
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