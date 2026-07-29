// ==========================================================================
// ARQUIVO: backend/routes/competenciaRoutes.js
// OBJETIVO: Registrar os endpoints de competencias. Uso restrito a
//           Administrador da Empresa e RH, sempre dentro da propria
//           empresa.
// ==========================================================================

const express = require('express');
const competenciaController = require('../controllers/competenciaController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_COMPETENCIAS = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_COMPETENCIAS));

router.post('/', competenciaController.criar);
router.get('/', competenciaController.listar);
router.get('/:id', competenciaController.buscarPorId);
router.put('/:id', competenciaController.atualizar);

module.exports = router;
