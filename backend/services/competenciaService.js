// ==========================================================================
// ARQUIVO: backend/services/competenciaService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de competencias.
//           Uso: Administrador da Empresa e RH, sempre restrito a propria
//           empresa.
// ==========================================================================

const competenciaModel = require('../models/competenciaModel');
const categoriaCompetenciaModel = require('../models/categoriaCompetenciaModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Lista as competencias da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, categoriaId, ativo }) {
  return competenciaModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, categoriaId, ativo });
}

/**
 * Busca uma competencia especifica, restrita a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const competencia = await competenciaModel.buscarPorId(id, empresaId);
  if (!competencia) {
    throw new ErroAplicacao('Competencia nao encontrada.', 404);
  }
  return competencia;
}

/**
 * Valida se a categoria informada pertence a empresa.
 */
async function validarCategoria(categoriaId, empresaId) {
  const categoria = await categoriaCompetenciaModel.buscarPorId(categoriaId, empresaId);
  if (!categoria) {
    throw new ErroAplicacao('A categoria de competencia informada nao foi encontrada nesta empresa.', 422);
  }
}

/**
 * Cria uma nova competencia.
 */
async function criar({ empresaId, categoriaId, nome, descricao, peso, usuarioLogado, ip }) {
  await validarCategoria(categoriaId, empresaId);

  const competenciaCriada = await competenciaModel.criar({
    empresaId,
    categoriaId,
    nome,
    descricao,
    peso,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'competencias',
    registroId: competenciaCriada.id,
    ip,
    detalhes: { nome, categoriaId, peso },
  });

  return competenciaCriada;
}

/**
 * Atualiza uma competencia existente.
 */
async function atualizar({ id, empresaId, categoriaId, nome, descricao, peso, ativo, usuarioLogado, ip }) {
  const competencia = await competenciaModel.buscarPorId(id, empresaId);
  if (!competencia) {
    throw new ErroAplicacao('Competencia nao encontrada.', 404);
  }

  if (categoriaId !== undefined) {
    await validarCategoria(categoriaId, empresaId);
  }

  const camposParaAtualizar = {};
  if (categoriaId !== undefined) camposParaAtualizar.categoria_id = categoriaId;
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (descricao !== undefined) camposParaAtualizar.descricao = descricao;
  if (peso !== undefined) camposParaAtualizar.peso = peso;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const competenciaAtualizada = await competenciaModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'competencias',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return competenciaAtualizada;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
