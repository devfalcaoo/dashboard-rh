// ==========================================================================
// ARQUIVO: backend/controllers/avaliacaoController.js
// OBJETIVO: Receber as requisicoes das rotas de avaliacoes, delegar para
//           avaliacaoService e devolver a resposta no padrao unico da API.
// ==========================================================================

const avaliacaoService = require('../services/avaliacaoService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarItensAvaliacao } = require('../validators/avaliacaoValidator');

/**
 * GET /api/avaliacoes - visao geral (RH / Administrador da Empresa)
 */
async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { cicloId, colaboradorId, avaliadorId, tipo, status } = req.query;

    const resultado = await avaliacaoService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      cicloId,
      colaboradorId,
      avaliadorId,
      tipo,
      status,
    });

    return respostaSucesso(res, 'Avaliacoes listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/avaliacoes/minhas - avaliacoes onde o usuario logado e o avaliador
 */
async function listarMinhas(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { cicloId, status } = req.query;

    const resultado = await avaliacaoService.listarMinhas({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      pagina,
      tamanhoPagina,
      cicloId,
      status,
    });

    return respostaSucesso(res, 'Suas avaliacoes foram listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/avaliacoes/:id
 */
async function buscarPorId(req, res, next) {
  try {
    const avaliacao = await avaliacaoService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'Avaliacao encontrada.', { avaliacao });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * POST /api/avaliacoes/:id/itens - registra as notas por competencia
 */
async function registrarItens(req, res, next) {
  try {
    const { valido, erros } = validarItensAvaliacao(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const avaliacao = await avaliacaoService.registrarItens({
      id: req.params.id,
      empresaId: req.empresaId,
      itens: req.body.itens,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Notas registradas com sucesso.', { avaliacao });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * POST /api/avaliacoes/:id/concluir
 */
async function concluir(req, res, next) {
  try {
    const ip = auditoriaService.extrairIp(req);
    const avaliacao = await avaliacaoService.concluir({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Avaliacao concluida com sucesso.', { avaliacao });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  listar,
  listarMinhas,
  buscarPorId,
  registrarItens,
  concluir,
};
