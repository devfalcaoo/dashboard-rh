// ==========================================================================
// ARQUIVO: backend/services/cargoService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de cargos. Uso:
//           Administrador da Empresa e RH, sempre restrito a propria
//           empresa (empresaId vem do empresaMiddleware).
// ==========================================================================

const cargoModel = require('../models/cargoModel');
const departamentoModel = require('../models/departamentoModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Lista os cargos da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, departamentoId, ativo }) {
  return cargoModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, departamentoId, ativo });
}

/**
 * Busca um cargo especifico, restrito a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const cargo = await cargoModel.buscarPorId(id, empresaId);
  if (!cargo) {
    throw new ErroAplicacao('Cargo nao encontrado.', 404);
  }
  return cargo;
}

/**
 * Valida se o departamento informado existe na empresa (quando informado).
 */
async function validarDepartamento(departamentoId, empresaId) {
  if (!departamentoId) {
    return;
  }
  const departamento = await departamentoModel.buscarPorId(departamentoId, empresaId);
  if (!departamento) {
    throw new ErroAplicacao('O departamento informado nao foi encontrado nesta empresa.', 422);
  }
}

/**
 * Cria um novo cargo.
 */
async function criar({ empresaId, nome, nivel, departamentoId, usuarioLogado, ip }) {
  await validarDepartamento(departamentoId, empresaId);

  const cargoCriado = await cargoModel.criar({ empresaId, nome, nivel, departamentoId });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'cargos',
    registroId: cargoCriado.id,
    ip,
    detalhes: { nome, nivel },
  });

  return cargoCriado;
}

/**
 * Atualiza um cargo existente.
 */
async function atualizar({ id, empresaId, nome, nivel, departamentoId, ativo, usuarioLogado, ip }) {
  const cargo = await cargoModel.buscarPorId(id, empresaId);
  if (!cargo) {
    throw new ErroAplicacao('Cargo nao encontrado.', 404);
  }

  await validarDepartamento(departamentoId, empresaId);

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (nivel !== undefined) camposParaAtualizar.nivel = nivel;
  if (departamentoId !== undefined) camposParaAtualizar.departamento_id = departamentoId;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const cargoAtualizado = await cargoModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'cargos',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return cargoAtualizado;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
