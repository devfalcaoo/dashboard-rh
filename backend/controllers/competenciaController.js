// ==========================================================================
// ARQUIVO: backend/controllers/competenciaController.js
// OBJETIVO: Receber as requisicoes das rotas de competencias, delegar
//           para competenciaService e devolver a resposta no padrao unico
//           da API.
// ==========================================================================

const competenciaService = require('../services/competenciaService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarCompetencia,
  validarAtualizarCompetencia,
} = require('../validators/competenciaValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarCompetencia(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const competencia = await competenciaService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Competencia criada com sucesso.', { competencia }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;
    const { categoriaId } = req.query;

    const resultado = await competenciaService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      categoriaId,
      ativo,
    });

    return respostaSucesso(res, 'Competencias listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const competencia = await competenciaService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
    });
    return respostaSucesso(res, 'Competencia encontrada.', { competencia });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarCompetencia(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const competencia = await competenciaService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Competencia atualizada com sucesso.', { competencia });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
};
