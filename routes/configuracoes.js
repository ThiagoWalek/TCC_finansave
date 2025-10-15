const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', (req, res) => {
  res.render('usuarios/configuracoes', { currentPage: 'configuracoes' });
});

module.exports = router;