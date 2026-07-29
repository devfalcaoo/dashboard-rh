// ==========================================================================
// ARQUIVO: backend/routes/cargoRoutes.js
// OBJETIVO: Registrar os endpoints de cargos. Uso restrito a
//           Administrador da Empresa e RH, sempre dentro da propria
//           empresa.
// ==========================================================================

const express = require('express');
const cargoController = require('../controllers/cargoController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_ESTRUTURA = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_ESTRUTURA));

router.post('/', cargoController.criar);
router.get('/', cargoController.listar);
router.get('/:id', cargoController.buscarPorId);
router.put('/:id', cargoController.atualizar);

module.exports = router;
