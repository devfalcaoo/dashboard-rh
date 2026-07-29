// ==========================================================================
// ARQUIVO: backend/controllers/usuarioController.js
// OBJETIVO: Receber as requisicoes das rotas de usuarios, delegar para
//           usuarioService e devolver a resposta no padrao unico da API.
// ==========================================================================

const usuarioService = require('../services/usuarioService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarCriarUsuario, validarAtualizarUsuario } = require('../validators/usuarioValidator');

/**
 * POST /api/usuarios - Administrador da Empresa / RH
 */
async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarUsuario(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const usuario = await usuarioService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Usuario criado com sucesso.', { usuario }, 201);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/usuarios - Administrador da Empresa / RH
 */
async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;
    const { perfil } = req.query;

    const resultado = await usuarioService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      perfil,
      ativo,
    });

    return respostaSucesso(res, 'Usuarios listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/usuarios/:id - Administrador da Empresa / RH
 */
async function buscarPorId(req, res, next) {
  try {
    const usuario = await usuarioService.buscarPorId({ id: req.params.id, empresaId: req.empresaId });
    return respostaSucesso(res, 'Usuario encontrado.', { usuario });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * PUT /api/usuarios/:id - Administrador da Empresa / RH
 */
async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarUsuario(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const usuario = await usuarioService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Usuario atualizado com sucesso.', { usuario });
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
