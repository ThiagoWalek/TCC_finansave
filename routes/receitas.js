const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const receitaController = require('../controllers/receitaController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para receitas
const validacoesReceita = [
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
    body('data_receita')
        .isDate()
        .withMessage('Data da receita inválida'),
    body('observacoes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('As observações não podem exceder 1000 caracteres')
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de receitas
router.get('/', (req, res) => res.redirect('/receitas/extrato'));
router.get('/extrato', receitaController.extrato);
router.get('/criar', receitaController.renderCriar);
router.post('/criar', validacoesReceita, receitaController.criar);
router.get('/editar/:id', receitaController.renderEditar);
router.post('/editar/:id', validacoesReceita, receitaController.atualizar);
router.get('/detalhe/:id', receitaController.detalhar);
router.post('/excluir/:id', receitaController.excluir);

module.exports = router;