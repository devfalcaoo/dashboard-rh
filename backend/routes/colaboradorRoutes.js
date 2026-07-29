// ==========================================================================
// ARQUIVO: backend/routes/colaboradorRoutes.js
// OBJETIVO: Registrar os endpoints de colaboradores. Uso restrito a
//           Administrador da Empresa e RH, sempre dentro da propria
//           empresa.
// ==========================================================================

const express = require('express');
const colaboradorController = require('../controllers/colaboradorController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_COLABORADORES = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_COLABORADORES));

router.post('/', colaboradorController.criar);
router.get('/', colaboradorController.listar);
router.get('/:id', colaboradorController.buscarPorId);
router.put('/:id', colaboradorController.atualizar);

module.exports = router;
