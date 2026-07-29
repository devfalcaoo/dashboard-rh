// ==========================================================================
// ARQUIVO: backend/routes/authRoutes.js
// OBJETIVO: Registrar os endpoints de autenticacao. Rotas apenas
//           encadeiam middlewares e apontam para o Controller
//           correspondente - nenhuma logica aqui alem disso.
// ==========================================================================

const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');

const router = express.Router();

// ---- Rotas publicas (sem autenticacao) ----------------------------------
router.post('/login', authController.login);
router.post('/recuperar-senha', authController.recuperarSenha);

// ---- Rotas protegidas (exigem usuario autenticado) -----------------------
// Qualquer perfil autenticado pode fazer logout, alterar a propria senha
// e consultar seus proprios dados - por isso nao ha permissaoMiddleware
// aqui (nao ha restricao por perfil, apenas exigencia de estar logado).
router.post('/logout', authMiddleware, empresaMiddleware, authController.logout);
router.post('/alterar-senha', authMiddleware, empresaMiddleware, authController.alterarSenha);
router.get('/me', authMiddleware, empresaMiddleware, authController.me);

module.exports = router;
