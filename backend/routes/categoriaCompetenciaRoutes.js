// ==========================================================================
// ARQUIVO: backend/routes/categoriaCompetenciaRoutes.js
// OBJETIVO: Registrar os endpoints de categorias de competencias. Uso
//           restrito a Administrador da Empresa e RH, sempre dentro da
//           propria empresa.
// ==========================================================================

const express = require('express');
const categoriaCompetenciaController = require('../controllers/categoriaCompetenciaController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_COMPETENCIAS = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_COMPETENCIAS));

router.post('/', categoriaCompetenciaController.criar);
router.get('/', categoriaCompetenciaController.listar);
router.get('/:id', categoriaCompetenciaController.buscarPorId);
router.put('/:id', categoriaCompetenciaController.atualizar);

module.exports = router;
