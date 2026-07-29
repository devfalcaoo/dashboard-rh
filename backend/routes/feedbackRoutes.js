// ==========================================================================
// ARQUIVO: backend/routes/feedbackRoutes.js
// OBJETIVO: Registrar os endpoints de feedbacks. A criacao e restrita a
//           RH, Gestor e Lider (com escopo hierarquico validado no
//           Service). A listagem geral (sem filtro obrigatorio) fica
//           restrita a RH/Administrador da Empresa; demais perfis usam
//           "/meus" para ver o que receberam, e "/:id" para ver um
//           feedback especifico (checagem fina no Service).
//
// IMPORTANTE: a rota literal "/meus" e registrada ANTES da rota
// parametrizada "/:id".
// ==========================================================================

const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_QUE_REGISTRAM = [PERFIS.RH, PERFIS.GESTOR, PERFIS.LIDER];
const PERFIS_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

router.use(authMiddleware, empresaMiddleware);

router.post('/', permissaoMiddleware(PERFIS_QUE_REGISTRAM), feedbackController.criar);
router.get('/meus', feedbackController.listarMeus);
router.get('/', permissaoMiddleware(PERFIS_VISAO_GERAL), feedbackController.listar);
router.get('/:id', feedbackController.buscarPorId);
router.put('/:id', feedbackController.atualizar);

module.exports = router;
