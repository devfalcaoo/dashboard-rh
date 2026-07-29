// ==========================================================================
// ARQUIVO: backend/services/equipeService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de equipes e seus
//           membros. Uso: Administrador da Empresa e RH, sempre restrito
//           a propria empresa.
// ==========================================================================

const equipeModel = require('../models/equipeModel');
const colaboradorModel = require('../models/colaboradorModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Lista as equipes da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, ativo }) {
  return equipeModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, ativo });
}

/**
 * Busca uma equipe especifica, junto com a lista de membros.
 */
async function buscarPorId({ id, empresaId }) {
  const equipe = await equipeModel.buscarPorId(id, empresaId);
  if (!equipe) {
    throw new ErroAplicacao('Equipe nao encontrada.', 404);
  }

  const membros = await equipeModel.listarMembros(id);

  return { ...equipe, membros };
}

/**
 * Cria uma nova equipe.
 */
async function criar({ empresaId, nome, liderId, usuarioLogado, ip }) {
  const equipeExistente = await equipeModel.buscarPorNome(nome, empresaId);
  if (equipeExistente) {
    throw new ErroAplicacao('Ja existe uma equipe com este nome nesta empresa.', 409);
  }

  if (liderId) {
    const lider = await colaboradorModel.buscarPorId(liderId, empresaId);
    if (!lider) {
      throw new ErroAplicacao('O lider informado nao foi encontrado nesta empresa.', 422);
    }
  }

  const equipeCriada = await equipeModel.criar({ empresaId, nome, liderId });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'equipes',
    registroId: equipeCriada.id,
    ip,
    detalhes: { nome },
  });

  return equipeCriada;
}

/**
 * Atualiza uma equipe existente.
 */
async function atualizar({ id, empresaId, nome, liderId, ativo, usuarioLogado, ip }) {
  const equipe = await equipeModel.buscarPorId(id, empresaId);
  if (!equipe) {
    throw new ErroAplicacao('Equipe nao encontrada.', 404);
  }

  if (nome !== undefined && nome !== equipe.nome) {
    const equipeComMesmoNome = await equipeModel.buscarPorNome(nome, empresaId);
    if (equipeComMesmoNome && equipeComMesmoNome.id !== id) {
      throw new ErroAplicacao('Ja existe uma equipe com este nome nesta empresa.', 409);
    }
  }

  if (liderId) {
    const lider = await colaboradorModel.buscarPorId(liderId, empresaId);
    if (!lider) {
      throw new ErroAplicacao('O lider informado nao foi encontrado nesta empresa.', 422);
    }
  }

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (liderId !== undefined) camposParaAtualizar.lider_id = liderId;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const equipeAtualizada = await equipeModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'equipes',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return equipeAtualizada;
}

/**
 * Adiciona um colaborador como membro de uma equipe.
 */
async function adicionarMembro({ equipeId, empresaId, colaboradorId, usuarioLogado, ip }) {
  const equipe = await equipeModel.buscarPorId(equipeId, empresaId);
  if (!equipe) {
    throw new ErroAplicacao('Equipe nao encontrada.', 404);
  }

  const colaborador = await colaboradorModel.buscarPorId(colaboradorId, empresaId);
  if (!colaborador) {
    throw new ErroAplicacao('Colaborador nao encontrado nesta empresa.', 422);
  }

  const membroExistente = await equipeModel.buscarMembro(equipeId, colaboradorId);
  if (membroExistente) {
    throw new ErroAplicacao('Este colaborador ja e membro desta equipe.', 409);
  }

  const membro = await equipeModel.adicionarMembro(equipeId, colaboradorId);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'equipe_membros',
    registroId: equipeId,
    ip,
    detalhes: { motivo: 'membro adicionado', colaboradorId },
  });

  return membro;
}

/**
 * Remove um colaborador de uma equipe.
 */
async function removerMembro({ equipeId, empresaId, colaboradorId, usuarioLogado, ip }) {
  const equipe = await equipeModel.buscarPorId(equipeId, empresaId);
  if (!equipe) {
    throw new ErroAplicacao('Equipe nao encontrada.', 404);
  }

  const membroExistente = await equipeModel.buscarMembro(equipeId, colaboradorId);
  if (!membroExistente) {
    throw new ErroAplicacao('Este colaborador nao e membro desta equipe.', 404);
  }

  await equipeModel.removerMembro(equipeId, colaboradorId);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'equipe_membros',
    registroId: equipeId,
    ip,
    detalhes: { motivo: 'membro removido', colaboradorId },
  });
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  adicionarMembro,
  removerMembro,
};
