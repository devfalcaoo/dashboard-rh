// ==========================================================================
// ARQUIVO: backend/controllers/categoriaCompetenciaController.js
// OBJETIVO: Receber as requisicoes das rotas de categorias de
//           competencias, delegar para categoriaCompetenciaService e
//           devolver a resposta no padrao unico da API.
// ==========================================================================

const categoriaCompetenciaService = require('../services/categoriaCompetenciaService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarCategoria,
  validarAtualizarCategoria,
} = require('../validators/categoriaCompetenciaValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarCategoria(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const categoria = await categoriaCompetenciaService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Categoria de competencia criada com sucesso.', { categoria }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

    const resultado = await categoriaCompetenciaService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      ativo,
    });

    return respostaSucesso(res, 'Categorias de competencias listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const categoria = await categoriaCompetenciaService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
    });
    return respostaSucesso(res, 'Categoria de competencia encontrada.', { categoria });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarCategoria(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const categoria = await categoriaCompetenciaService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Categoria de competencia atualizada com sucesso.', { categoria });
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
