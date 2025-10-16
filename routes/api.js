const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { Op } = require('sequelize');

// Middleware de autenticação para todas as rotas da API
router.use(isAuthenticated);

// Rota para resumo financeiro
router.get('/dashboard/resumo-financeiro', async (req, res) => {
    try {
        const Conta = require('../models/Conta');
        const Gasto = require('../models/Gasto');
        const Orcamento = require('../models/Orcamento');
        const Receita = require('../models/Receita');
        
        const userId = req.session.user.id;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Buscar saldo total das contas
        const contas = await Conta.findAll({
            where: { usuario_id: userId }
        });
        
        const saldoTotal = contas.reduce((total, conta) => {
            return total + parseFloat(conta.saldo_atual || 0);
        }, 0);
        
        // Receitas reais do mês a partir de Receitas
        const receitasMes = await Receita.findAll({
            where: {
                usuario_id: userId,
                data_receita: {
                    [Op.and]: [
                        { [Op.gte]: new Date(currentYear, currentMonth - 1, 1) },
                        { [Op.lt]: new Date(currentYear, currentMonth, 1) }
                    ]
                }
            }
        });

        const totalReceitas = receitasMes.reduce((total, receita) => {
            return total + parseFloat(receita.valor || 0);
        }, 0);

        // Despesas reais do mês a partir de Gastos
        const gastosMes = await Gasto.findAll({
            where: {
                usuario_id: userId,
                data_gasto: {
                    [Op.and]: [
                        { [Op.gte]: new Date(currentYear, currentMonth - 1, 1) },
                        { [Op.lt]: new Date(currentYear, currentMonth, 1) }
                    ]
                }
            }
        });

        const totalDespesas = gastosMes.reduce((total, gasto) => {
            return total + parseFloat(gasto.valor || 0);
        }, 0);
        
        res.json({
            receitas: totalReceitas,
            despesas: totalDespesas,
            saldo: saldoTotal
        });
        
    } catch (error) {
        console.error('Erro ao buscar resumo financeiro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para evolução do saldo
router.get('/dashboard/evolucao-saldo', async (req, res) => {
    try {
        const Conta = require('../models/Conta');
        const Gasto = require('../models/Gasto');
        
        const userId = req.session.user.id;
        const periodo = parseInt(req.query.periodo) || 7;
        const dataFinal = new Date();
        const dataInicial = new Date();
        dataInicial.setDate(dataFinal.getDate() - periodo);
        
        // Buscar saldo atual das contas
        const contas = await Conta.findAll({
            where: { usuario_id: userId }
        });
        
        const saldoAtual = contas.reduce((total, conta) => {
            return total + parseFloat(conta.saldo_atual || 0);
        }, 0);
        
        // Buscar gastos no período para simular evolução
        const gastos = await Gasto.findAll({
            include: [{
                model: Conta,
                where: { usuario_id: userId }
            }],
            where: {
                data_gasto: {
                    [Op.between]: [dataInicial, dataFinal]
                }
            },
            order: [['data_gasto', 'ASC']]
        });
        
        // Gerar dados simulados para evolução do saldo
        const labels = [];
        const valores = [];
        let saldoSimulado = saldoAtual;
        
        for (let i = periodo; i >= 0; i--) {
            const data = new Date();
            data.setDate(data.getDate() - i);
            
            const gastosNaData = gastos.filter(gasto => {
                const dataGasto = new Date(gasto.data_gasto);
                return dataGasto.toDateString() === data.toDateString();
            });
            
            const totalGastosNaData = gastosNaData.reduce((total, gasto) => {
                return total + parseFloat(gasto.valor || 0);
            }, 0);
            
            if (i > 0) {
                saldoSimulado += totalGastosNaData; // Adiciona de volta os gastos para simular saldo anterior
            }
            
            labels.push(data.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit' 
            }));
            valores.push(saldoSimulado);
            
            if (i > 0) {
                saldoSimulado -= totalGastosNaData; // Remove os gastos para o próximo dia
            }
        }
        
        res.json({
            labels: labels,
            valores: valores
        });
        
    } catch (error) {
        console.error('Erro ao buscar evolução do saldo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para gastos por categoria
router.get('/dashboard/gastos-categoria', async (req, res) => {
    try {
        const Gasto = require('../models/Gasto');
        const Conta = require('../models/Conta');
        
        const userId = req.session.user.id;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Buscar gastos do mês atual agrupados por categoria
        const gastos = await Gasto.findAll({
            where: {
                usuario_id: userId,
                data_gasto: {
                    [Op.and]: [
                        { [Op.gte]: new Date(currentYear, currentMonth - 1, 1) },
                        { [Op.lt]: new Date(currentYear, currentMonth, 1) }
                    ]
                }
            }
        });
        
        // Agrupar por categoria
        const categorias = {};
        gastos.forEach(gasto => {
            const categoria = gasto.categoria || 'Outros';
            if (!categorias[categoria]) {
                categorias[categoria] = 0;
            }
            categorias[categoria] += parseFloat(gasto.valor || 0);
        });
        
        const categoriasArray = Object.keys(categorias);
        const valoresArray = Object.values(categorias);
        
        res.json({
            categorias: categoriasArray,
            valores: valoresArray
        });
        
    } catch (error) {
        console.error('Erro ao buscar gastos por categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para comparativo mensal
router.get('/dashboard/comparativo-mensal', async (req, res) => {
    try {
        const Orcamento = require('../models/Orcamento');
        const Gasto = require('../models/Gasto');
        const Conta = require('../models/Conta');
        const Receita = require('../models/Receita');
        
        const userId = req.session.user.id;
        const tipo = req.query.tipo || 'both';
        const periodo = parseInt(req.query.periodo) || 6;
        const categoria = req.query.categoria;
        const conta = req.query.conta;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Buscar dados dos últimos N meses
        const meses = [];
        const receitas = [];
        const despesas = [];
        const saldos = [];
        const gastosReais = [];
        const receitasReais = [];
        
        for (let i = periodo - 1; i >= 0; i--) {
            const data = new Date(currentYear, currentDate.getMonth() - i, 1);
            const mes = data.getMonth() + 1;
            const ano = data.getFullYear();
            const mesAno = `${ano}-${mes.toString().padStart(2, '0')}`;
            
            meses.push(data.toLocaleDateString('pt-BR', { 
                month: 'short',
                year: '2-digit'
            }));
            
            // Receitas reais do mês (Receitas)
            let whereReceita = {
                usuario_id: userId,
                data_receita: {
                    [Op.and]: [
                        { [Op.gte]: new Date(ano, mes - 1, 1) },
                        { [Op.lt]: new Date(ano, mes, 1) }
                    ]
                }
            };
            if (categoria) {
                whereReceita.categoria = categoria;
            }
            if (conta) {
                whereReceita.conta_id = conta;
            }
            const receitasDoMes = await Receita.findAll({
                where: whereReceita
            });
            let receitasMes = receitasDoMes.reduce((total, r) => total + parseFloat(r.valor || 0), 0);
            
            // Buscar gastos reais do mês
            let whereGasto = {
                usuario_id: userId,
                data_gasto: {
                    [Op.and]: [
                        { [Op.gte]: new Date(ano, mes - 1, 1) },
                        { [Op.lt]: new Date(ano, mes, 1) }
                    ]
                }
            };
            
            if (categoria) {
                whereGasto.categoria = categoria;
            }
            
            const gastosDoMes = await Gasto.findAll({
                where: whereGasto,
                include: conta ? [{
                    model: Conta,
                    where: { conta_id: conta }
                }] : []
            });
            
            const totalGastosReais = gastosDoMes.reduce((total, gasto) => {
                return total + parseFloat(gasto.valor || 0);
            }, 0);

            const despesasMes = totalGastosReais;
            const saldoMes = receitasMes - despesasMes;

            receitas.push(receitasMes);
            despesas.push(despesasMes);
            saldos.push(saldoMes);
            gastosReais.push(despesasMes);
            receitasReais.push(receitasMes);
        }
        
        const response = {
            meses: meses,
            periodo: periodo
        };
        
        if (tipo === 'saldo') {
            response.saldo = saldos;
        } else if (tipo === 'gastos-reais') {
            response.gastosReais = gastosReais;
            response.despesas = despesas; // Corrigido: usar 'despesas' em vez de 'gastosOrcados'
        } else {
            response.receitas = receitas;
            response.despesas = despesas;
            response.gastosReais = gastosReais;
            response.saldo = saldos; // Adicionado: incluir saldo para o tipo 'both'
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Erro ao buscar comparativo mensal:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para próximas parcelas a vencer
router.get('/dashboard/proximas-parcelas', async (req, res) => {
    try {
        const Parcelamento = require('../models/Parcelamento');
        const Conta = require('../models/Conta');

        const userId = req.session.user.id;

        // Buscar parcelamentos ativos do usuário
        const parcelamentos = await Parcelamento.findAll({
            where: {
                usuario_id: userId,
                ativo: true
            },
            include: [{
                model: Conta,
                attributes: ['conta_id', 'nome', 'ativa'],
                required: false
            }],
            order: [['data_inicio', 'ASC']]
        });

        // Buscar todas as contas do usuário para fallback em casos de associação ausente
        const contasDoUsuario = await Conta.findAll({
            where: { usuario_id: userId },
            attributes: ['conta_id', 'nome', 'ativa']
        });
        const contasMap = new Map(contasDoUsuario.map(c => [c.conta_id, c]));

        // Função para adicionar meses com cuidado para fim de mês
        function addMonths(date, months) {
            let d;
            if (typeof date === 'string') {
                // Parse seguro em local time para evitar deslocamento de dia
                const parts = date.slice(0,10).split('-').map(Number);
                d = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                d = new Date(date);
            }
            const day = d.getDate();
            d.setMonth(d.getMonth() + months);
            // Ajuste para meses com menos dias
            if (d.getDate() < day) {
                d.setDate(0); // último dia do mês anterior
            }
            return d;
        }

        const hoje = new Date();
        const proximas = parcelamentos
            .filter(p => p.parcela_atual <= p.total_parcelas)
            .map(p => {
                // Ajuste: a "parcela_atual" representa a próxima parcela a pagar; a data é data_inicio + (parcela_atual - 1) meses
                const mesesParaAdicionar = Math.max((p.parcela_atual || 1) - 1, 0);
                const proximaData = addMonths(p.data_inicio, mesesParaAdicionar);
                const diasRestantes = Math.ceil((proximaData - hoje) / (1000 * 60 * 60 * 24));

                // Fallback de conta: usa associação ou busca no mapa de contas do usuário
                const contaAssociada = p.Conta || contasMap.get(p.conta_id) || null;

                let contaStatus = 'ativa';
                let contaNome = contaAssociada ? contaAssociada.nome : 'Conta não encontrada';
                if (!contaAssociada) {
                    contaStatus = 'inexistente';
                } else if (!contaAssociada.ativa) {
                    contaStatus = 'inativa';
                }

                return {
                    id_parcelamento: p.id_parcelamento,
                    descricao: p.descricao,
                    parcela_atual: p.parcela_atual,
                    total_parcelas: p.total_parcelas,
                    valor_parcela: parseFloat(p.valor_parcela),
                    data_proxima: proximaData,
                    dias_restantes: diasRestantes,
                    conta_nome: contaNome,
                    conta_status: contaStatus
                };
            })
            .sort((a, b) => new Date(a.data_proxima) - new Date(b.data_proxima))
            .slice(0, 3); // retornar apenas as 3 mais próximas

        res.json({ proximas });
    } catch (error) {
        console.error('Erro ao buscar próximas parcelas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter categorias disponíveis
router.get('/dashboard/categorias', async (req, res) => {
    try {
        const Gasto = require('../models/Gasto');
        const Orcamento = require('../models/Orcamento');
        
        const userId = req.session.user.id;
        
        // Buscar categorias de gastos
        const categoriasGastos = await Gasto.findAll({
            where: { usuario_id: userId },
            attributes: ['categoria'],
            group: ['categoria'],
            order: [['categoria', 'ASC']]
        });
        
        // Buscar categorias de orçamentos
        const categoriasOrcamentos = await Orcamento.findAll({
            where: { usuario_id: userId },
            attributes: ['categoria'],
            group: ['categoria'],
            order: [['categoria', 'ASC']]
        });
        
        // Combinar e remover duplicatas
        const todasCategorias = new Set();
        categoriasGastos.forEach(item => {
            if (item.categoria) todasCategorias.add(item.categoria);
        });
        categoriasOrcamentos.forEach(item => {
            if (item.categoria) todasCategorias.add(item.categoria);
        });
        
        res.json(Array.from(todasCategorias).sort());
        
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter contas disponíveis
router.get('/dashboard/contas', async (req, res) => {
    try {
        const Conta = require('../models/Conta');
        
        const userId = req.session.user.id;
        
        const contas = await Conta.findAll({
            where: { usuario_id: userId },
            attributes: ['conta_id', 'nome', 'tipo', 'saldo_atual'],
            order: [['nome', 'ASC']]
        });
        
        res.json(contas);
        
    } catch (error) {
        console.error('Erro ao buscar contas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter orçamento agregado do mês atual
router.get('/dashboard/orcamento-mensal', async (req, res) => {
    try {
        const { startOfMonth, endOfMonth } = require('../utils/dateRange');
        const { Op } = require('sequelize');
        const Orcamento = require('../models/Orcamento');
        const userId = req.session.user.id;

        const inicioMes = startOfMonth(new Date());
        const fimMes = endOfMonth(new Date());

        // Somatórios por tipo (Receita/Despesa)
        const orcamentos = await Orcamento.findAll({
            where: {
                usuario_id: userId,
                mes_ano: { [Op.between]: [inicioMes, fimMes] }
            },
            attributes: ['tipo', 'valor_previsto', 'valor_real']
        });

        let previstoReceitas = 0, realReceitas = 0, previstoDespesas = 0, realDespesas = 0;
        orcamentos.forEach(o => {
            if (o.tipo === 'Receita') {
                previstoReceitas += Number(o.valor_previsto || 0);
                realReceitas += Number(o.valor_real || 0);
            } else if (o.tipo === 'Despesa') {
                previstoDespesas += Number(o.valor_previsto || 0);
                realDespesas += Number(o.valor_real || 0);
            }
        });

        res.json({
            previstoReceitas,
            realReceitas,
            previstoDespesas,
            realDespesas,
            totalPrevisto: previstoReceitas - previstoDespesas,
            totalReal: realReceitas - realDespesas
        });
    } catch (error) {
        console.error('Erro ao obter orçamento mensal:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter parcelas com vencimento no mês atual
router.get('/dashboard/parcelas-mes', async (req, res) => {
    try {
        const { startOfMonth, endOfMonth, diffInDays } = require('../utils/dateRange');
        const Parcelamento = require('../models/Parcelamento');
        const { Op } = require('sequelize');
        const userId = req.session.user.id;

        const inicioMes = startOfMonth(new Date());
        const fimMes = endOfMonth(new Date());

        const parcelamentos = await Parcelamento.findAll({
            where: {
                usuario_id: userId,
                ativo: true,
                data_inicio: { [Op.lte]: fimMes }
            },
            attributes: ['id_parcelamento', 'descricao', 'parcela_atual', 'total_parcelas', 'valor_parcela', 'data_inicio']
        });

        const resultados = [];
        parcelamentos.forEach(p => {
            const atual = Number(p.parcela_atual || 0);
            const total = Number(p.total_parcelas || 0);
            if (atual >= total) return; // já concluído

            // Próxima parcela (parcela_atual + 1)
            const proximaIndex = atual + 1;
            const dataInicio = new Date(p.data_inicio);
            const proximaData = new Date(dataInicio);
            proximaData.setMonth(dataInicio.getMonth() + (proximaIndex - 1));

            if (proximaData >= inicioMes && proximaData <= fimMes) {
                resultados.push({
                    id_parcelamento: p.id_parcelamento,
                    descricao: p.descricao,
                    parcela: `${proximaIndex}/${total}`,
                    valor: Number(p.valor_parcela || 0),
                    data: proximaData,
                    dias_restantes: diffInDays(new Date(), proximaData)
                });
            }
        });

        resultados.sort((a, b) => a.data - b.data);
        res.json(resultados);
    } catch (error) {
        console.error('Erro ao obter parcelas do mês:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;