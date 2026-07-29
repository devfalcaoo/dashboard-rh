// ==========================================================================
// ARQUIVO: backend/services/categoriaCompetenciaService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de categorias de
//           competencias. Uso: Administrador da Empresa e RH, sempre
//           restrito a propria empresa.
// ==========================================================================

const categoriaCompetenciaModel = require('../models/categoriaCompetenciaModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Lista as categorias de competencias da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, ativo }) {
  return categoriaCompetenciaModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, ativo });
}

/**
 * Busca uma categoria especifica, restrita a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const categoria = await categoriaCompetenciaModel.buscarPorId(id, empresaId);
  if (!categoria) {
    throw new ErroAplicacao('Categoria de competencia nao encontrada.', 404);
  }
  return categoria;
}

/**
 * Cria uma nova categoria de competencia.
 */
async function criar({ empresaId, nome, descricao, usuarioLogado, ip }) {
  const categoriaExistente = await categoriaCompetenciaModel.buscarPorNome(nome, empresaId);
  if (categoriaExistente) {
    throw new ErroAplicacao('Ja existe uma categoria de competencia com este nome nesta empresa.', 409);
  }

  const categoriaCriada = await categoriaCompetenciaModel.criar({ empresaId, nome, descricao });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'categorias_competencias',
    registroId: categoriaCriada.id,
    ip,
    detalhes: { nome },
  });

  return categoriaCriada;
}

/**
 * Atualiza uma categoria existente.
 */
async function atualizar({ id, empresaId, nome, descricao, ativo, usuarioLogado, ip }) {
  const categoria = await categoriaCompetenciaModel.buscarPorId(id, empresaId);
  if (!categoria) {
    throw new ErroAplicacao('Categoria de competencia nao encontrada.', 404);
  }

  if (nome !== undefined && nome !== categoria.nome) {
    const categoriaComMesmoNome = await categoriaCompetenciaModel.buscarPorNome(nome, empresaId);
    if (categoriaComMesmoNome && categoriaComMesmoNome.id !== id) {
      throw new ErroAplicacao('Ja existe uma categoria de competencia com este nome nesta empresa.', 409);
    }
  }

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (descricao !== undefined) camposParaAtualizar.descricao = descricao;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const categoriaAtualizada = await categoriaCompetenciaModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'categorias_competencias',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return categoriaAtualizada;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
