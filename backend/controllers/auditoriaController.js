// ==========================================================================
// ARQUIVO: backend/controllers/auditoriaController.js
// OBJETIVO: Receber as requisicoes da rota de consulta de logs de
//           auditoria, delegar para auditoriaConsultaService e devolver a
//           resposta no padrao unico da API.
// ==========================================================================

const auditoriaConsultaService = require('../services/auditoriaConsultaService');
const { respostaSucesso } = require('../utils/respostaPadrao');

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 50;
    const { usuarioId, operacao, tabelaAfetada } = req.query;

    const resultado = await auditoriaConsultaService.listar({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      pagina,
      tamanhoPagina,
      usuarioId,
      operacao,
      tabelaAfetada,
    });

    return respostaSucesso(res, 'Logs de auditoria listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  listar,
};
