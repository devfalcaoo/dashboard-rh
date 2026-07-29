// ==========================================================================
// ARQUIVO: backend/controllers/colaboradorController.js
// OBJETIVO: Receber as requisicoes das rotas de colaboradores, delegar
//           para colaboradorService e devolver a resposta no padrao unico
//           da API.
// ==========================================================================

const colaboradorService = require('../services/colaboradorService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarColaborador,
  validarAtualizarColaborador,
} = require('../validators/colaboradorValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarColaborador(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const colaborador = await colaboradorService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Colaborador cadastrado com sucesso.', { colaborador }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;
    const { departamentoId, cargoId, liderId } = req.query;

    const resultado = await colaboradorService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      departamentoId,
      cargoId,
      liderId,
      ativo,
    });

    return respostaSucesso(res, 'Colaboradores listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const colaborador = await colaboradorService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
    });
    return respostaSucesso(res, 'Colaborador encontrado.', { colaborador });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarColaborador(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const colaborador = await colaboradorService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Colaborador atualizado com sucesso.', { colaborador });
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
