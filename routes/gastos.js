const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const gastoController = require('../controllers/gastoController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para gastos
const validacoesGasto = [
    body('conta_id')
        .isInt({ min: 1 })
        .withMessage('Selecione uma conta válida'),
    body('descricao')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('A descrição deve ter entre 3 e 255 caracteres'),
    body('categoria')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('A categoria deve ter entre 2 e 50 caracteres'),
    body('valor')
        .isFloat({ min: 0.01 })
        .withMessage('O valor deve ser maior que zero')
        .toFloat(),
    body('data_gasto')
        .isDate()
        .withMessage('Data do gasto inválida'),
    body('observacoes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('As observações não podem exceder 1000 caracteres')
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de gastos
router.get('/extrato', gastoController.extrato);
router.get('/criar', gastoController.renderCriar);
router.post('/criar', validacoesGasto, gastoController.criar);
router.post('/excluir/:id', gastoController.excluir);

module.exports = router;