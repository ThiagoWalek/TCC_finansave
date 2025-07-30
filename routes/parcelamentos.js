const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const parcelamentoController = require('../controllers/parcelamentoController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para parcelamentos
const validacoesParcelamento = [
    body('descricao')
        .trim()
        .isLength({ min: 2 })
        .withMessage('A descrição deve ter no mínimo 2 caracteres'),
    body('total_parcelas')
        .isInt({ min: 1 })
        .withMessage('O número de parcelas deve ser maior que zero')
        .toInt(),
    body('valor_total')
        .isFloat({ min: 0.01 })
        .withMessage('O valor total deve ser maior que zero')
        .toFloat(),
    body('data_inicio')
        .isDate()
        .withMessage('Data de início inválida'),
    body('parcela_atual')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('A parcela atual deve ser maior que zero')
        .toInt()
        .custom((value, { req }) => {
            if (value > parseInt(req.body.total_parcelas)) {
                throw new Error('A parcela atual não pode ser maior que o total de parcelas');
            }
            return true;
        })
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de parcelamentos
router.get('/', parcelamentoController.listar);
router.get('/criar', parcelamentoController.renderCriar);
router.post('/criar', validacoesParcelamento, parcelamentoController.criar);
router.get('/editar/:id', parcelamentoController.renderEditar);
router.post('/editar/:id', validacoesParcelamento, parcelamentoController.atualizar);
router.post('/excluir/:id', parcelamentoController.excluir);
router.post('/atualizar-parcela/:id', parcelamentoController.atualizarParcela);

module.exports = router;