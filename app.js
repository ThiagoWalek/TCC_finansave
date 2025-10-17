require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Configuração do EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para processar dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Em produção, configure como true se usar HTTPS
}));

// Middleware global para passar informações do usuário para as views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.error = req.session.error || null;
    res.locals.success = req.session.success || null;
    delete req.session.error;
    delete req.session.success;
    next();
});

// Importação das rotas
const usuariosRoutes = require('./routes/usuarios');
const contasRoutes = require('./routes/contas');
const metasRoutes = require('./routes/metas');
const orcamentosRoutes = require('./routes/orcamentos');
const transferenciasRoutes = require('./routes/transferencias');
const parcelamentosRoutes = require('./routes/parcelamentos');
const gastosRoutes = require('./routes/gastos');
const receitasRoutes = require('./routes/receitas');
const apiRoutes = require('./routes/api');

// Uso das rotas
app.use('/usuarios', usuariosRoutes);
app.use('/contas', contasRoutes);
app.use('/metas', metasRoutes);
app.use('/orcamentos', orcamentosRoutes);
app.use('/transferencias', transferenciasRoutes);
app.use('/parcelamentos', parcelamentosRoutes);
app.use('/gastos', gastosRoutes);
app.use('/receitas', receitasRoutes);
app.use('/api', apiRoutes);

// Rota principal
app.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/usuarios/login');
    }
    
    try {
        const Conta = require('./models/Conta');
        const Meta = require('./models/Meta');
        const Orcamento = require('./models/Orcamento');
        const Parcelamento = require('./models/Parcelamento');
        const Gasto = require('./models/Gasto');
        const { Op } = require('sequelize');

        // Buscar dados para o dashboard
        const contas = await Conta.findAll({
            where: { usuario_id: req.session.user.id },
            order: [['nome', 'ASC']]
        });

        const metas = await Meta.findAll({
            where: { usuario_id: req.session.user.id },
            order: [['data_limite', 'ASC']]
        });

        const parcelamentos = await Parcelamento.findAll({
            where: { 
                usuario_id: req.session.user.id,
                ativo: true
            },
            order: [['data_inicio', 'ASC']]
        });

        // Buscar orçamentos do mês atual
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

        const orcamentosData = await Orcamento.findAll({
            where: {
                usuario_id: req.session.user.id,
                mes_ano: {
                    [Op.between]: [inicioMes, fimMes]
                }
            }
        });

        // Processar dados dos orçamentos
        let orcamentos = null;
        if (orcamentosData.length > 0) {
            orcamentos = {
                receitas: { previsto: 0, realizado: 0 },
                despesas: { previsto: 0, realizado: 0 }
            };

            orcamentosData.forEach(orcamento => {
                if (orcamento.tipo === 'Receita') {
                    orcamentos.receitas.previsto += parseFloat(orcamento.valor_previsto);
                    orcamentos.receitas.realizado += parseFloat(orcamento.valor_real || 0);
                } else {
                    orcamentos.despesas.previsto += parseFloat(orcamento.valor_previsto);
                    orcamentos.despesas.realizado += parseFloat(orcamento.valor_real || 0);
                }
            });
        }

        // Buscar gastos do mês atual
        const gastosDoMes = await Gasto.findAll({
            where: {
                usuario_id: req.session.user.id,
                data_gasto: {
                    [Op.between]: [inicioMes, fimMes]
                }
            },
            include: [
                { model: Conta, attributes: ['nome'] }
            ],
            order: [['data_gasto', 'DESC']],
            limit: 5
        });

        // Calcular total de gastos do mês
        const totalGastosDoMes = gastosDoMes.reduce((total, gasto) => {
            return total + parseFloat(gasto.valor);
        }, 0);

        // Calcular saldo total
        const totalSaldo = contas.reduce((total, conta) => {
            return total + parseFloat(conta.saldo_atual);
        }, 0);

        res.render('index', { 
            contas, 
            metas, 
            orcamentos, 
            parcelamentos, 
            gastosDoMes,
            totalGastosDoMes,
            totalSaldo,
            currentPage: 'dashboard'
        });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        req.session.error = 'Erro ao carregar dados do dashboard.';
        res.render('index', { 
            contas: [], 
            metas: [], 
            orcamentos: null, 
            parcelamentos: [],
            gastosDoMes: [],
            totalGastosDoMes: 0,
            totalSaldo: 0,
            currentPage: 'dashboard'
        });
    }
});

// Tratamento de erros 404
app.use((req, res) => {
    res.status(404).render('404');
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});