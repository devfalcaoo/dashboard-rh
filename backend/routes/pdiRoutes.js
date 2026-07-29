// ==========================================================================
// ARQUIVO: backend/routes/pdiRoutes.js
// OBJETIVO: Registrar os endpoints de PDI. Criacao e edicao de dados
//           gerais restritas a RH, Gestor e Lider (com escopo hierarquico
//           validado no Service). Atualizacao de PROGRESSO e liberada a
//           qualquer perfil autenticado, pois o proprio colaborador deve
//           poder atualizar seu progresso (checagem fina no Service).
//
// IMPORTANTE: a rota literal "/meus" e registrada ANTES da rota
// parametrizada "/:id".
// ==========================================================================

const express = require('express');
const pdiController = require('../controllers/pdiController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_QUE_GERENCIAM = [PERFIS.RH, PERFIS.GESTOR, PERFIS.LIDER];
const PERFIS_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

router.use(authMiddleware, empresaMiddleware);

router.post('/', permissaoMiddleware(PERFIS_QUE_GERENCIAM), pdiController.criar);
router.get('/meus', pdiController.listarMeus);
router.get('/', permissaoMiddleware(PERFIS_VISAO_GERAL), pdiController.listar);
router.get('/:id', pdiController.buscarPorId);
router.put('/:id', permissaoMiddleware(PERFIS_QUE_GERENCIAM), pdiController.atualizar);
router.patch('/:id/progresso', pdiController.atualizarProgresso);

module.exports = router;
