// ==========================================================================
// ARQUIVO: backend/controllers/pdiController.js
// OBJETIVO: Receber as requisicoes das rotas de PDI, delegar para
//           pdiService e devolver a resposta no padrao unico da API.
// ==========================================================================

const pdiService = require('../services/pdiService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarPdi,
  validarAtualizarPdi,
  validarAtualizarProgresso,
} = require('../validators/pdiValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarPdi(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const pdi = await pdiService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'PDI criado com sucesso.', { pdi }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { colaboradorId, competenciaId, status } = req.query;

    const resultado = await pdiService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      colaboradorId,
      competenciaId,
      status,
    });

    return respostaSucesso(res, 'PDIs listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function listarMeus(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { status } = req.query;

    const resultado = await pdiService.listarMeus({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      pagina,
      tamanhoPagina,
      status,
    });

    return respostaSucesso(res, 'Seus PDIs foram listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const pdi = await pdiService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
    });

    return respostaSucesso(res, 'PDI encontrado.', { pdi });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarPdi(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const pdi = await pdiService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'PDI atualizado com sucesso.', { pdi });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizarProgresso(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarProgresso(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const pdi = await pdiService.atualizarProgresso({
      id: req.params.id,
      empresaId: req.empresaId,
      progresso: req.body.progresso,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Progresso do PDI atualizado com sucesso.', { pdi });
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
  atualizarProgresso,
};
