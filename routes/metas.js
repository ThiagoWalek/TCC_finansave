const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const metaController = require('../controllers/metaController');
const { isAuthenticated } = require('../middleware/auth');

// Validações para metas
const validacoesMeta = [
    body('nome')
        .trim()
        .isLength({ min: 2 })
        .withMessage('O nome da meta deve ter no mínimo 2 caracteres'),
    body('valor_alvo')
        .isFloat({ min: 0.01 })
        .withMessage('O valor alvo deve ser maior que zero')
        .toFloat(),
    // Permite validar tanto valor_inicial (na criação) quanto valor_atual (na edição)
    body('valor_inicial')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('O valor inicial deve ser um número positivo')
        .toFloat(),
    body('valor_atual')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('O valor atual deve ser um número positivo')
        .toFloat(),
    body('data_inicio')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('Data de início inválida'),
    body('data_limite')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('Data limite inválida')
        .custom((value, { req }) => {
            if (req.body.data_inicio && value && new Date(value) <= new Date(req.body.data_inicio)) {
                throw new Error('A data limite deve ser posterior à data de início');
            }
            return true;
        }),
    body('descricao')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('A descrição deve ter no máximo 255 caracteres')
];

// Validação para atualização de progresso
const validacaoProgresso = [
    body('valor_atual')
        .isFloat({ min: 0 })
        .withMessage('O valor atual deve ser um número positivo')
        .toFloat()
];

// Validação para adicionar valor (somar)
const validacaoAdicionarValor = [
    body('valor')
        .isFloat({ min: 0.01 })
        .withMessage('O valor a adicionar deve ser maior que zero')
        .toFloat()
];

// Todas as rotas requerem autenticação
router.use(isAuthenticated);

// Rotas de metas
router.get('/', metaController.listar);
router.get('/criar', metaController.renderCriar);
router.post('/criar', validacoesMeta, metaController.criar);
router.get('/editar/:id', metaController.renderEditar);
router.post('/editar/:id', validacoesMeta, metaController.atualizar);
router.post('/excluir/:id', metaController.excluir);
router.post('/progresso/:id', validacaoProgresso, metaController.atualizarProgresso);
router.post('/:id/adicionar-valor', validacaoAdicionarValor, metaController.adicionarValor);

module.exports = router;