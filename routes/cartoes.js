const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartaoController = require('../controllers/cartaoController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para cartões
const validacoesCartao = [
    body('conta_id')
        .isInt({ min: 1 })
        .withMessage('Selecione uma conta válida'),
    body('nome')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('O nome do cartão deve ter entre 2 e 100 caracteres'),
    body('tipo')
        .isIn(['Débito', 'Crédito'])
        .withMessage('Tipo de cartão inválido'),
    body('numero_final')
        .optional({ checkFalsy: true })
        .isLength({ min: 4, max: 4 })
        .withMessage('Os últimos 4 dígitos devem ter exatamente 4 caracteres'),
    body('limite_credito')
        .if(body('tipo').equals('Crédito'))
        .isFloat({ min: 0.01 })
        .withMessage('O limite de crédito deve ser maior que zero')
        .toFloat(),
    body('data_vencimento')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('Data de vencimento inválida')
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de cartões
router.get('/', cartaoController.listar);
router.get('/criar', cartaoController.renderCriar);
router.post('/criar', validacoesCartao, cartaoController.criar);
router.get('/editar/:id', cartaoController.renderEditar);
router.post('/editar/:id', validacoesCartao, cartaoController.atualizar);
router.post('/excluir/:id', cartaoController.excluir);

module.exports = router;