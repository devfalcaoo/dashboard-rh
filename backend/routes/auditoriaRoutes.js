// ==========================================================================
// ARQUIVO: backend/routes/auditoriaRoutes.js
// OBJETIVO: Registrar o endpoint de consulta de logs de auditoria. RH e
//           Administrador da Empresa veem os logs da propria empresa;
//           Administrador Geral ve os logs de todas as empresas (o
//           escopo e resolvido no auditoriaConsultaService).
// ==========================================================================

const express = require('express');
const auditoriaController = require('../controllers/auditoriaController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_COM_ACESSO_AUDITORIA = [PERFIS.ADMINISTRADOR_GERAL, PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_COM_ACESSO_AUDITORIA));

router.get('/', auditoriaController.listar);

module.exports = router;
