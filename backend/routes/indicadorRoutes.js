// ==========================================================================
// ARQUIVO: backend/routes/indicadorRoutes.js
// OBJETIVO: Registrar os endpoints de indicadores. Uso restrito a RH e
//           Gestor, conforme a Matriz de Permissoes do SAD (secao 8).
// ==========================================================================

const express = require('express');
const indicadorController = require('../controllers/indicadorController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_INDICADORES = [PERFIS.RH, PERFIS.GESTOR];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_INDICADORES));

router.post('/', indicadorController.criar);
router.get('/', indicadorController.listar);
router.get('/:id', indicadorController.buscarPorId);
router.put('/:id', indicadorController.atualizar);

module.exports = router;
