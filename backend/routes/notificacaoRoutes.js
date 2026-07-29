// ==========================================================================
// ARQUIVO: backend/routes/notificacaoRoutes.js
// OBJETIVO: Registrar os endpoints de notificacoes. Todas as rotas sao
//           pessoais - qualquer perfil autenticado pode acessar apenas as
//           proprias notificacoes (sem permissaoMiddleware por perfil).
//
// IMPORTANTE: rotas literais ("/nao-lidas", "/marcar-todas-como-lidas")
// sao registradas ANTES de rotas parametrizadas ("/:id/...").
// ==========================================================================

const express = require('express');
const notificacaoController = require('../controllers/notificacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');

const router = express.Router();

router.use(authMiddleware, empresaMiddleware);

router.get('/nao-lidas', notificacaoController.contarNaoLidas);
router.patch('/marcar-todas-como-lidas', notificacaoController.marcarTodasComoLidas);
router.get('/', notificacaoController.listar);
router.patch('/:id/lida', notificacaoController.marcarComoLida);

module.exports = router;
