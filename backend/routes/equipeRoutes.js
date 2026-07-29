// ==========================================================================
// ARQUIVO: backend/routes/equipeRoutes.js
// OBJETIVO: Registrar os endpoints de equipes e gerenciamento de membros.
//           Uso restrito a Administrador da Empresa e RH, sempre dentro
//           da propria empresa.
// ==========================================================================

const express = require('express');
const equipeController = require('../controllers/equipeController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_EQUIPES = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_EQUIPES));

router.post('/', equipeController.criar);
router.get('/', equipeController.listar);
router.get('/:id', equipeController.buscarPorId);
router.put('/:id', equipeController.atualizar);
router.post('/:id/membros', equipeController.adicionarMembro);
router.delete('/:id/membros/:colaboradorId', equipeController.removerMembro);

module.exports = router;
