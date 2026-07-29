// ==========================================================================
// ARQUIVO: backend/routes/metaRoutes.js
// OBJETIVO: Registrar os endpoints de metas. Criacao e edicao de dados
//           gerais restritas a RH e Gestor (escopo hierarquico validado
//           no Service). Atualizacao de VALOR ATUAL e liberada a qualquer
//           perfil autenticado, pois o proprio colaborador deve poder
//           reportar seu progresso (checagem fina no Service).
//
// IMPORTANTE: a rota literal "/minhas" e registrada ANTES da rota
// parametrizada "/:id".
// ==========================================================================

const express = require('express');
const metaController = require('../controllers/metaController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_QUE_GERENCIAM = [PERFIS.RH, PERFIS.GESTOR];
const PERFIS_VISAO_GERAL = [PERFIS.RH, PERFIS.GESTOR, PERFIS.ADMINISTRADOR_EMPRESA];

router.use(authMiddleware, empresaMiddleware);

router.post('/', permissaoMiddleware(PERFIS_QUE_GERENCIAM), metaController.criar);
router.get('/minhas', metaController.listarMinhas);
router.get('/', permissaoMiddleware(PERFIS_VISAO_GERAL), metaController.listar);
router.get('/:id', metaController.buscarPorId);
router.put('/:id', permissaoMiddleware(PERFIS_QUE_GERENCIAM), metaController.atualizar);
router.patch('/:id/valor-atual', metaController.atualizarValorAtual);

module.exports = router;
