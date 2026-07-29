// ==========================================================================
// ARQUIVO: backend/controllers/dashboardController.js
// OBJETIVO: Receber as requisicoes das rotas de dashboard, delegar para
//           dashboardService e devolver a resposta no padrao unico da API.
// ==========================================================================

const dashboardService = require('../services/dashboardService');
const { respostaSucesso } = require('../utils/respostaPadrao');

async function resumo(req, res, next) {
  try {
    const { cicloId } = req.query;
    const resultado = await dashboardService.obterResumo({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      cicloId,
    });
    return respostaSucesso(res, 'Resumo do dashboard carregado com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function evolucaoMensal(req, res, next) {
  try {
    const meses = Number(req.query.meses) || 6;
    const resultado = await dashboardService.obterEvolucaoMensal({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      meses,
    });
    return respostaSucesso(res, 'Evolucao mensal carregada com sucesso.', { evolucao: resultado });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  resumo,
  evolucaoMensal,
};
