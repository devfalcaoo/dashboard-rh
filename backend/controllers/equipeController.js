// ==========================================================================
// ARQUIVO: backend/controllers/equipeController.js
// OBJETIVO: Receber as requisicoes das rotas de equipes, delegar para
//           equipeService e devolver a resposta no padrao unico da API.
// ==========================================================================

const equipeService = require('../services/equipeService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarEquipe,
  validarAtualizarEquipe,
  validarAdicionarMembro,
} = require('../validators/equipeValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarEquipe(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const equipe = await equipeService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Equipe criada com sucesso.', { equipe }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

    const resultado = await equipeService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      ativo,
    });

    return respostaSucesso(res, 'Equipes listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const equipe = await equipeService.buscarPorId({ id: req.params.id, empresaId: req.empresaId });
    return respostaSucesso(res, 'Equipe encontrada.', { equipe });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarEquipe(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const equipe = await equipeService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Equipe atualizada com sucesso.', { equipe });
  } catch (erro) {
    return next(erro);
  }
}

async function adicionarMembro(req, res, next) {
  try {
    const { valido, erros } = validarAdicionarMembro(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const membro = await equipeService.adicionarMembro({
      equipeId: req.params.id,
      empresaId: req.empresaId,
      colaboradorId: req.body.colaboradorId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Membro adicionado a equipe com sucesso.', { membro }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function removerMembro(req, res, next) {
  try {
    const ip = auditoriaService.extrairIp(req);
    await equipeService.removerMembro({
      equipeId: req.params.id,
      empresaId: req.empresaId,
      colaboradorId: req.params.colaboradorId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Membro removido da equipe com sucesso.', {});
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  adicionarMembro,
  removerMembro,
};
