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
    body('conta_destino_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Conta de destino inválida')
        .toInt()
        .custom((value, { req }) => {
            if (value === req.body.conta_origem_id) {
                throw new Error('A conta de destino deve ser diferente da conta de origem');
            }
            return true;
        }),
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
router.post('/excluir/:id', transferenciaController.excluir);

module.exports = router;