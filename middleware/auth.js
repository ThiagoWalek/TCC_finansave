// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.session.error = 'Por favor, faça login para acessar esta página.';
    res.redirect('/usuarios/login');
};

// Middleware para verificar se o usuário NÃO está autenticado (útil para páginas de login/registro)
const isNotAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    res.redirect('/');
};

// Middleware para validar se o recurso pertence ao usuário atual
const isOwner = (model) => async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resource = await model.findOne({
            where: {
                id: resourceId,
                usuario_id: req.session.user.id
            }
        });

        if (!resource) {
            req.session.error = 'Acesso não autorizado.';
            return res.redirect('/');
        }
        req.resource = resource;
        next();
    } catch (error) {
        console.error('Erro ao verificar propriedade do recurso:', error);
        req.session.error = 'Erro ao verificar permissões.';
        res.redirect('/');
    }
};

module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    isOwner
};