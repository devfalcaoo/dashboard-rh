// ==========================================================================
// ARQUIVO: backend/services/indicadorService.js
// OBJETIVO: Regra de negocio de indicadores (catalogo de metricas usado
//           como base para as metas). Uso: RH e Gestor, conforme a
//           Matriz de Permissoes do SAD (secao 8) - diferente de
//           feedback/PDI, o Lider NAO gerencia indicadores/metas.
// ==========================================================================

const indicadorModel = require('../models/indicadorModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Lista os indicadores da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina }) {
  return indicadorModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina });
}

/**
 * Busca um indicador especifico, restrito a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const indicador = await indicadorModel.buscarPorId(id, empresaId);
  if (!indicador) {
    throw new ErroAplicacao('Indicador nao encontrado.', 404);
  }
  return indicador;
}

/**
 * Cria um novo indicador.
 */
async function criar({ empresaId, nome, descricao, unidadeMedida, usuarioLogado, ip }) {
  const indicadorExistente = await indicadorModel.buscarPorNome(nome, empresaId);
  if (indicadorExistente) {
    throw new ErroAplicacao('Ja existe um indicador com este nome nesta empresa.', 409);
  }

  const indicadorCriado = await indicadorModel.criar({ empresaId, nome, descricao, unidadeMedida });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'indicadores',
    registroId: indicadorCriado.id,
    ip,
    detalhes: { nome },
  });

  return indicadorCriado;
}

/**
 * Atualiza um indicador existente.
 */
async function atualizar({ id, empresaId, nome, descricao, unidadeMedida, usuarioLogado, ip }) {
  const indicador = await indicadorModel.buscarPorId(id, empresaId);
  if (!indicador) {
    throw new ErroAplicacao('Indicador nao encontrado.', 404);
  }

  if (nome !== undefined && nome !== indicador.nome) {
    const indicadorComMesmoNome = await indicadorModel.buscarPorNome(nome, empresaId);
    if (indicadorComMesmoNome && indicadorComMesmoNome.id !== id) {
      throw new ErroAplicacao('Ja existe um indicador com este nome nesta empresa.', 409);
    }
  }

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (descricao !== undefined) camposParaAtualizar.descricao = descricao;
  if (unidadeMedida !== undefined) camposParaAtualizar.unidade_medida = unidadeMedida;

  const indicadorAtualizado = await indicadorModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'indicadores',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return indicadorAtualizado;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
