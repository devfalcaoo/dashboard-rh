// ==========================================================================
// ARQUIVO: backend/controllers/indicadorController.js
// OBJETIVO: Receber as requisicoes das rotas de indicadores, delegar para
//           indicadorService e devolver a resposta no padrao unico da API.
// ==========================================================================

const indicadorService = require('../services/indicadorService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarCriarIndicador, validarAtualizarIndicador } = require('../validators/indicadorValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarIndicador(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const indicador = await indicadorService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Indicador criado com sucesso.', { indicador }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;

    const resultado = await indicadorService.listar({ empresaId: req.empresaId, pagina, tamanhoPagina });

    return respostaSucesso(res, 'Indicadores listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const indicador = await indicadorService.buscarPorId({ id: req.params.id, empresaId: req.empresaId });
    return respostaSucesso(res, 'Indicador encontrado.', { indicador });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarIndicador(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const indicador = await indicadorService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Indicador atualizado com sucesso.', { indicador });
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
