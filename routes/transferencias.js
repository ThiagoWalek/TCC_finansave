const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transferenciaController = require('../controllers/transferenciaController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para transferências
const validacoesTransferencia = [
    body('conta_origem_id')
        .isInt({ min: 1 })
        .withMessage('Conta de origem inválida')
        .toInt(),
    body('nome_conta_destino')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 50 })
        .withMessage('O nome do destino deve ter no máximo 50 caracteres'),
    body('valor')
        .isFloat({ min: 0.01 })
        .withMessage('O valor deve ser maior que zero')
        .toFloat(),
    body('data_transferencia')
        .isDate()
        .withMessage('Data inválida'),
    body('descricao')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('A descrição deve ter no máximo 255 caracteres')
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de transferências
router.get('/', transferenciaController.listar);
router.get('/criar', transferenciaController.renderCriar);
router.post('/criar', validacoesTransferencia, transferenciaController.criar);
router.get('/detalhes/:id', transferenciaController.detalhes);
// Não incluímos rota de edição pois transferências não devem ser editadas após criadas
router.post('/excluir/:id', transferenciaController.excluir);

module.exports = router;