// ==========================================================================
// ARQUIVO: backend/routes/departamentoRoutes.js
// OBJETIVO: Registrar os endpoints de departamentos. Uso restrito a
//           Administrador da Empresa e RH, sempre dentro da propria
//           empresa.
// ==========================================================================

const express = require('express');
const departamentoController = require('../controllers/departamentoController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_ESTRUTURA = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_ESTRUTURA));

router.post('/', departamentoController.criar);
router.get('/', departamentoController.listar);
router.get('/:id', departamentoController.buscarPorId);
router.put('/:id', departamentoController.atualizar);

module.exports = router;
