// ==========================================================================
// ARQUIVO: backend/controllers/notificacaoController.js
// OBJETIVO: Receber as requisicoes das rotas de notificacoes, delegar
//           para notificacaoService e devolver a resposta no padrao
//           unico da API. Todas as rotas aqui sao pessoais - cada usuario
//           so ve e altera as proprias notificacoes.
// ==========================================================================

const notificacaoService = require('../services/notificacaoService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarFiltroLida } = require('../validators/notificacaoValidator');

async function listar(req, res, next) {
  try {
    const { valido, erros, lida } = validarFiltroLida(req.query.lida);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;

    const resultado = await notificacaoService.listarMinhas({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      pagina,
      tamanhoPagina,
      lida,
    });

    return respostaSucesso(res, 'Notificacoes listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function contarNaoLidas(req, res, next) {
  try {
    const resultado = await notificacaoService.contarNaoLidas({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'Total de notificacoes nao lidas.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function marcarComoLida(req, res, next) {
  try {
    const notificacao = await notificacaoService.marcarComoLida({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'Notificacao marcada como lida.', { notificacao });
  } catch (erro) {
    return next(erro);
  }
}

async function marcarTodasComoLidas(req, res, next) {
  try {
    const resultado = await notificacaoService.marcarTodasComoLidas({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'Todas as notificacoes foram marcadas como lidas.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  listar,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
