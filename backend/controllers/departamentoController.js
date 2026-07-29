// ==========================================================================
// ARQUIVO: backend/controllers/departamentoController.js
// OBJETIVO: Receber as requisicoes das rotas de departamentos, delegar
//           para departamentoService e devolver a resposta no padrao
//           unico da API.
// ==========================================================================

const departamentoService = require('../services/departamentoService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarDepartamento,
  validarAtualizarDepartamento,
} = require('../validators/departamentoValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarDepartamento(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const departamento = await departamentoService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Departamento criado com sucesso.', { departamento }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

    const resultado = await departamentoService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      ativo,
    });

    return respostaSucesso(res, 'Departamentos listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const departamento = await departamentoService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
    });
    return respostaSucesso(res, 'Departamento encontrado.', { departamento });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarDepartamento(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const departamento = await departamentoService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Departamento atualizado com sucesso.', { departamento });
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
