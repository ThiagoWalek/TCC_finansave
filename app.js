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

// Uso das rotas
app.use('/usuarios', usuariosRoutes);
app.use('/contas', contasRoutes);
app.use('/metas', metasRoutes);
app.use('/orcamentos', orcamentosRoutes);
app.use('/transferencias', transferenciasRoutes);
app.use('/parcelamentos', parcelamentosRoutes);

// Rota principal
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/usuarios/login');
    }
    res.render('index');
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