// ==========================================================================
// ARQUIVO: backend/controllers/feedbackController.js
// OBJETIVO: Receber as requisicoes das rotas de feedbacks, delegar para
//           feedbackService e devolver a resposta no padrao unico da API.
// ==========================================================================

const feedbackService = require('../services/feedbackService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarCriarFeedback, validarAtualizarFeedback } = require('../validators/feedbackValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarFeedback(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const feedback = await feedbackService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Feedback registrado com sucesso.', { feedback }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { colaboradorId, autorId, tipo } = req.query;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

    const resultado = await feedbackService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      colaboradorId,
      autorId,
      tipo,
      ativo,
    });

    return respostaSucesso(res, 'Feedbacks listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function listarMeus(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { tipo } = req.query;

    const resultado = await feedbackService.listarMeus({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      pagina,
      tamanhoPagina,
      tipo,
    });

    return respostaSucesso(res, 'Seus feedbacks foram listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const feedback = await feedbackService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'Feedback encontrado.', { feedback });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarFeedback(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const feedback = await feedbackService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Feedback atualizado com sucesso.', { feedback });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criar,
  listar,
  listarMeus,
  buscarPorId,
  atualizar,
};
