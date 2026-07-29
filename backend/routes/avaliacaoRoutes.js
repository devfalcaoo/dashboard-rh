// ==========================================================================
// ARQUIVO: backend/routes/avaliacaoRoutes.js
// OBJETIVO: Registrar os endpoints de avaliacoes. A visao geral (listagem
//           livre por filtros) e restrita a RH/Administrador da Empresa.
//           As demais rotas (minhas avaliacoes, detalhe, responder,
//           concluir) sao abertas a qualquer perfil autenticado, pois a
//           regra fina de "so o avaliador designado pode responder" e
//           validada na camada de Service (ver SAD, secao 14).
//
// IMPORTANTE: a rota literal "/minhas" e registrada ANTES da rota
// parametrizada "/:id" para evitar que o Express interprete "minhas"
// como um valor de :id.
// ==========================================================================

const express = require('express');
const avaliacaoController = require('../controllers/avaliacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

router.use(authMiddleware, empresaMiddleware);

router.get('/minhas', avaliacaoController.listarMinhas);
router.get('/', permissaoMiddleware(PERFIS_VISAO_GERAL), avaliacaoController.listar);
router.get('/:id', avaliacaoController.buscarPorId);
router.post('/:id/itens', avaliacaoController.registrarItens);
router.post('/:id/concluir', avaliacaoController.concluir);

module.exports = router;
