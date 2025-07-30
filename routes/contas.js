const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const contaController = require('../controllers/contaController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para contas
const validacoesConta = [
    body('nome')
        .trim()
        .isLength({ min: 2 })
        .withMessage('O nome da conta deve ter no mínimo 2 caracteres'),
    body('tipo')
        .isIn(['Corrente', 'Poupança', 'Investimento', 'Carteira', 'Cartão de Crédito', 'Outro'])
        .withMessage('Tipo de conta inválido'),
    body('saldo_atual')
        .isFloat({ min: 0 })
        .withMessage('O saldo deve ser um número positivo')
        .toFloat(),
    body('instituicao')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 2 })
        .withMessage('O nome da instituição deve ter no mínimo 2 caracteres')
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de contas
router.get('/', contaController.listar);
router.get('/criar', contaController.renderCriar);
router.post('/criar', validacoesConta, contaController.criar);
router.get('/editar/:id', contaController.renderEditar);
router.post('/editar/:id', validacoesConta, contaController.atualizar);
router.post('/excluir/:id', contaController.excluir);

module.exports = router;