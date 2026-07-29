// ==========================================================================
// ARQUIVO: backend/routes/relatorioRoutes.js
// OBJETIVO: Registrar os endpoints de relatorios (exportacao PDF/Excel).
//           Uso: RH e Administrador da Empresa (visao gerencial completa).
// ==========================================================================

const express = require('express');
const relatorioController = require('../controllers/relatorioController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_RELATORIOS = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_RELATORIOS));

router.get('/resumo', relatorioController.resumo);
router.get('/avaliacoes', relatorioController.avaliacoes);

module.exports = router;
