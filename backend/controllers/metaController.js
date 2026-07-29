// ==========================================================================
// ARQUIVO: backend/controllers/metaController.js
// OBJETIVO: Receber as requisicoes das rotas de metas, delegar para
//           metaService e devolver a resposta no padrao unico da API.
// ==========================================================================

const metaService = require('../services/metaService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarMeta,
  validarAtualizarMeta,
  validarAtualizarValorAtual,
} = require('../validators/metaValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarMeta(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const meta = await metaService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Meta criada com sucesso.', { meta }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { colaboradorId, indicadorId, status } = req.query;

    const resultado = await metaService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      colaboradorId,
      indicadorId,
      status,
    });

    return respostaSucesso(res, 'Metas listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function listarMinhas(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { status } = req.query;

    const resultado = await metaService.listarMinhas({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      pagina,
      tamanhoPagina,
      status,
    });

    return respostaSucesso(res, 'Suas metas foram listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const meta = await metaService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'Meta encontrada.', { meta });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarMeta(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const meta = await metaService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Meta atualizada com sucesso.', { meta });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizarValorAtual(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarValorAtual(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const meta = await metaService.atualizarValorAtual({
      id: req.params.id,
      empresaId: req.empresaId,
      valorAtual: req.body.valorAtual,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Valor atual da meta atualizado com sucesso.', { meta });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criar,
  listar,
  listarMinhas,
  buscarPorId,
  atualizar,
  atualizarValorAtual,
};
