// ==========================================================================
// ARQUIVO: backend/controllers/cargoController.js
// OBJETIVO: Receber as requisicoes das rotas de cargos, delegar para
//           cargoService e devolver a resposta no padrao unico da API.
// ==========================================================================

const cargoService = require('../services/cargoService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarCriarCargo, validarAtualizarCargo } = require('../validators/cargoValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarCargo(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const cargo = await cargoService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Cargo criado com sucesso.', { cargo }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;
    const { departamentoId } = req.query;

    const resultado = await cargoService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      departamentoId,
      ativo,
    });

    return respostaSucesso(res, 'Cargos listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const cargo = await cargoService.buscarPorId({ id: req.params.id, empresaId: req.empresaId });
    return respostaSucesso(res, 'Cargo encontrado.', { cargo });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarCargo(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const cargo = await cargoService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Cargo atualizado com sucesso.', { cargo });
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
