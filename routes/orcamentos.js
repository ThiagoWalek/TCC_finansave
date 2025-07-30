const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orcamentoController = require('../controllers/orcamentoController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para orçamentos
const validacoesOrcamento = [
    body('nome')
        .trim()
        .isLength({ min: 2 })
        .withMessage('O nome do orçamento deve ter no mínimo 2 caracteres'),
    body('mes_ano')
        .custom((value) => {
            if (!value || !value.match(/^\d{4}-\d{2}$/)) {
                throw new Error('Formato de data inválido');
            }
            return true;
        }),
    body('tipo')
        .isIn(['Receita', 'Despesa'])
        .withMessage('Tipo inválido'),
    body('categoria')
        .trim()
        .isLength({ min: 2 })
        .withMessage('A categoria deve ter no mínimo 2 caracteres'),
    body('valor_previsto')
        .isFloat({ min: 0.01 })
        .withMessage('O valor previsto deve ser maior que zero')
        .toFloat(),
    body('valor_real')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('O valor real deve ser um número positivo')
        .toFloat(),
    body('descricao')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('A descrição deve ter no máximo 255 caracteres')
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de orçamentos
router.get('/', orcamentoController.listar);
router.get('/criar', orcamentoController.renderCriar);
router.post('/criar', validacoesOrcamento, orcamentoController.criar);
router.get('/editar/:id', orcamentoController.renderEditar);
router.post('/editar/:id', validacoesOrcamento, orcamentoController.atualizar);
router.post('/excluir/:id', orcamentoController.excluir);

module.exports = router;