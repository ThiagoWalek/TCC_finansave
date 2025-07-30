const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const usuarioController = require('../controllers/usuarioController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

// Validações para registro de usuário
const validacoesRegistro = [
    body('nome')
        .trim()
        .isLength({ min: 2 })
        .withMessage('O nome deve ter no mínimo 2 caracteres'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Digite um email válido'),
    body('senha')
        .isLength({ min: 6 })
        .withMessage('A senha deve ter no mínimo 6 caracteres'),
    body('confirmar_senha')
        .custom((value, { req }) => {
            if (value !== req.body.senha) {
                throw new Error('As senhas não conferem');
            }
            return true;
        })
];

// Validações para atualização de perfil
const validacoesAtualizacao = [
    body('nome')
        .trim()
        .isLength({ min: 2 })
        .withMessage('O nome deve ter no mínimo 2 caracteres'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Digite um email válido'),
    body('nova_senha')
        .optional({ checkFalsy: true })
        .isLength({ min: 6 })
        .withMessage('A nova senha deve ter no mínimo 6 caracteres'),
    body('confirmar_nova_senha')
        .custom((value, { req }) => {
            if (req.body.nova_senha && value !== req.body.nova_senha) {
                throw new Error('As senhas não conferem');
            }
            return true;
        })
];

// Rotas públicas
router.get('/registro', isNotAuthenticated, usuarioController.renderRegistro);
router.post('/registro', isNotAuthenticated, validacoesRegistro, usuarioController.registrar);
router.get('/login', isNotAuthenticated, usuarioController.renderLogin);
router.post('/login', isNotAuthenticated, usuarioController.login);

// Rotas protegidas
router.get('/logout', isAuthenticated, usuarioController.logout);
router.get('/perfil', isAuthenticated, usuarioController.perfil);
router.post('/perfil', isAuthenticated, validacoesAtualizacao, usuarioController.atualizarPerfil);

module.exports = router;