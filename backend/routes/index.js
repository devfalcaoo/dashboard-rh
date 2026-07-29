// ==========================================================================
// ARQUIVO: backend/routes/index.js
// OBJETIVO: Agregador central de todas as rotas da API. Cada modulo de
//           rota (usuarioRoutes, colaboradorRoutes, etc) sera registrado
//           aqui nas proximas fases. Nesta Fase 1, existe apenas a rota
//           de "health-check", usada para confirmar que o servidor esta
//           de pe e conectado corretamente ao Supabase.
// ==========================================================================

const express = require('express');
const supabase = require('../config/supabaseClient');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');

const router = express.Router();

/**
 * GET /api/health
 * Rota publica (sem autenticacao) usada para verificar:
 *  - se o servidor Express esta respondendo;
 *  - se a conexao com o Supabase esta configurada corretamente.
 */
router.get('/health', async (req, res, next) => {
  try {
    // Consulta minima e inofensiva so para validar que as credenciais
    // do Supabase estao corretas (nao depende de nenhuma tabela de negocio).
    const { error } = await supabase.auth.getSession();

    if (error) {
      return respostaErro(
        res,
        'Servidor de pe, porem houve falha ao validar a conexao com o Supabase.',
        { detalhe: error.message },
        503
      );
    }

    return respostaSucesso(res, 'Servidor operacional e conectado ao Supabase.', {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (erro) {
    next(erro);
  }
});

// --------------------------------------------------------------------------
// FASE 2: rotas de autenticacao
// --------------------------------------------------------------------------
router.use('/auth', require('./authRoutes'));

// --------------------------------------------------------------------------
// FASE 3: rotas de negocio - empresas, usuarios, departamentos, cargos
// --------------------------------------------------------------------------
router.use('/empresas', require('./empresaRoutes'));
router.use('/usuarios', require('./usuarioRoutes'));
router.use('/departamentos', require('./departamentoRoutes'));
router.use('/cargos', require('./cargoRoutes'));

// --------------------------------------------------------------------------
// FASE 4: rotas de negocio - colaboradores, equipes, categorias e
// competencias
// --------------------------------------------------------------------------
router.use('/colaboradores', require('./colaboradorRoutes'));
router.use('/equipes', require('./equipeRoutes'));
router.use('/categorias-competencias', require('./categoriaCompetenciaRoutes'));
router.use('/competencias', require('./competenciaRoutes'));

// --------------------------------------------------------------------------
// FASE 5: rotas de negocio - ciclos de avaliacao e motor de avaliacao
// --------------------------------------------------------------------------
router.use('/ciclos-avaliacao', require('./cicloAvaliacaoRoutes'));
router.use('/avaliacoes', require('./avaliacaoRoutes'));

// --------------------------------------------------------------------------
// FASE 6: rotas de negocio - feedbacks e PDIs
// --------------------------------------------------------------------------
router.use('/feedbacks', require('./feedbackRoutes'));
router.use('/pdis', require('./pdiRoutes'));

// --------------------------------------------------------------------------
// FASE 7: rotas de negocio - indicadores e metas
// --------------------------------------------------------------------------
router.use('/indicadores', require('./indicadorRoutes'));
router.use('/metas', require('./metaRoutes'));

// --------------------------------------------------------------------------
// FASE 8: rotas de negocio - notificacoes
// --------------------------------------------------------------------------
router.use('/notificacoes', require('./notificacaoRoutes'));

// --------------------------------------------------------------------------
// FASE 9: rotas de negocio - dashboard
// --------------------------------------------------------------------------
router.use('/dashboard', require('./dashboardRoutes'));

// --------------------------------------------------------------------------
// FASE 10: rotas de negocio - relatorios (PDF/Excel)
// --------------------------------------------------------------------------
router.use('/relatorios', require('./relatorioRoutes'));

// --------------------------------------------------------------------------
// FASE 11: rotas de negocio - consulta de auditoria/logs
// --------------------------------------------------------------------------
router.use('/auditoria', require('./auditoriaRoutes'));

module.exports = router;
