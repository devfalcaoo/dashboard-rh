// ==========================================================================
// ARQUIVO: backend/routes/usuarioRoutes.js
// OBJETIVO: Registrar os endpoints de usuarios. Uso restrito a
//           Administrador da Empresa e RH, sempre dentro da propria
//           empresa (isolamento multiempresa garantido pelo
//           empresaMiddleware + escopoEmpresa nos Models).
// ==========================================================================

const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_USUARIOS = [PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.RH];

router.use(authMiddleware, empresaMiddleware, permissaoMiddleware(PERFIS_GESTAO_USUARIOS));

router.post('/', usuarioController.criar);
router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);
router.put('/:id', usuarioController.atualizar);

module.exports = router;
