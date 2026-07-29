// ==========================================================================
// ARQUIVO: backend/routes/dashboardRoutes.js
// OBJETIVO: Registrar os endpoints de dashboard. Acessivel a RH,
//           Administrador da Empresa, Gestor e Lider - cada um ve os
//           dados no proprio escopo hierarquico (filtragem feita no
//           dashboardService).
// ==========================================================================

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_COM_ACESSO_AO_DASHBOARD = [
  PERFIS.RH,
  PERFIS.ADMINISTRADOR_EMPRESA,
  PERFIS.GESTOR,
  PERFIS.LIDER,
];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_COM_ACESSO_AO_DASHBOARD));

router.get('/resumo', dashboardController.resumo);
router.get('/evolucao-mensal', dashboardController.evolucaoMensal);

module.exports = router;
