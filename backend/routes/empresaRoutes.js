// ==========================================================================
// ARQUIVO: backend/routes/empresaRoutes.js
// OBJETIVO: Registrar os endpoints de empresas. Rotas apenas encadeiam
//           middlewares e apontam para o Controller correspondente.
//
// IMPORTANTE: as rotas literais (ex: "/minha") sao registradas ANTES das
// rotas com parametro (ex: "/:id") para evitar que o Express interprete
// "minha" como um valor de :id.
// ==========================================================================

const express = require('express');
const empresaController = require('../controllers/empresaController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

// Todas as rotas de empresas exigem usuario autenticado
router.use(authMiddleware, empresaMiddleware);

// ---- Rotas da PROPRIA empresa (Administrador da Empresa / RH) -----------
router.get(
  '/minha',
  permissaoMiddleware([PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH]),
  empresaController.buscarMinhaEmpresa
);
router.put(
  '/minha',
  permissaoMiddleware([PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH]),
  empresaController.atualizarMinhaEmpresa
);

// ---- Rotas de gestao de TODAS as empresas (Administrador Geral) ---------
router.post('/', permissaoMiddleware([PERFIS.ADMINISTRADOR_GERAL]), empresaController.criar);
router.get('/', permissaoMiddleware([PERFIS.ADMINISTRADOR_GERAL]), empresaController.listar);
router.get('/:id', permissaoMiddleware([PERFIS.ADMINISTRADOR_GERAL]), empresaController.buscarPorId);
router.put('/:id', permissaoMiddleware([PERFIS.ADMINISTRADOR_GERAL]), empresaController.atualizar);
router.patch(
  '/:id/status',
  permissaoMiddleware([PERFIS.ADMINISTRADOR_GERAL]),
  empresaController.alterarStatus
);

module.exports = router;
