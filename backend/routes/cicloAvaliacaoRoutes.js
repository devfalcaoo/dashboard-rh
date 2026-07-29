// ==========================================================================
// ARQUIVO: backend/routes/cicloAvaliacaoRoutes.js
// OBJETIVO: Registrar os endpoints de ciclos de avaliacao. A abertura e o
//           encerramento de ciclos sao exclusivos do RH (conforme Matriz
//           de Permissoes do SAD, secao 8). A visualizacao (leitura) e
//           liberada tambem para Administrador da Empresa e Gestor.
// ==========================================================================

const express = require('express');
const cicloAvaliacaoController = require('../controllers/cicloAvaliacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const empresaMiddleware = require('../middlewares/empresaMiddleware');
const permissaoMiddleware = require('../middlewares/permissaoMiddleware');
const { PERFIS } = require('../config/constantes');

const router = express.Router();

const PERFIS_GESTAO_CICLOS = [PERFIS.RH];
const PERFIS_LEITURA_CICLOS = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA, PERFIS.GESTOR];

router.use(authMiddleware, empresaMiddleware);

router.post('/', permissaoMiddleware(PERFIS_GESTAO_CICLOS), cicloAvaliacaoController.criar);
router.get('/', permissaoMiddleware(PERFIS_LEITURA_CICLOS), cicloAvaliacaoController.listar);
router.get('/:id', permissaoMiddleware(PERFIS_LEITURA_CICLOS), cicloAvaliacaoController.buscarPorId);
router.put('/:id', permissaoMiddleware(PERFIS_GESTAO_CICLOS), cicloAvaliacaoController.atualizar);
router.patch('/:id/abrir', permissaoMiddleware(PERFIS_GESTAO_CICLOS), cicloAvaliacaoController.abrir);
router.patch(
  '/:id/encerrar',
  permissaoMiddleware(PERFIS_GESTAO_CICLOS),
  cicloAvaliacaoController.encerrar
);

module.exports = router;
