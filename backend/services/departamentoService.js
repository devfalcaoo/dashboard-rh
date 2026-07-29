// ==========================================================================
// ARQUIVO: backend/services/departamentoService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de departamentos.
//           Uso: Administrador da Empresa e RH, sempre restrito a propria
//           empresa (empresaId vem do empresaMiddleware, nunca do payload
//           do cliente).
// ==========================================================================

const departamentoModel = require('../models/departamentoModel');
const usuarioModel = require('../models/usuarioModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Lista os departamentos da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, ativo }) {
  return departamentoModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, ativo });
}

/**
 * Busca um departamento especifico, restrito a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const departamento = await departamentoModel.buscarPorId(id, empresaId);
  if (!departamento) {
    throw new ErroAplicacao('Departamento nao encontrado.', 404);
  }
  return departamento;
}

/**
 * Cria um novo departamento.
 */
async function criar({ empresaId, nome, descricao, responsavelId, usuarioLogado, ip }) {
  const departamentoExistente = await departamentoModel.buscarPorNome(nome, empresaId);
  if (departamentoExistente) {
    throw new ErroAplicacao('Ja existe um departamento com este nome nesta empresa.', 409);
  }

  if (responsavelId) {
    const responsavel = await usuarioModel.buscarPorIdNaEmpresa(responsavelId, empresaId);
    if (!responsavel) {
      throw new ErroAplicacao('O usuario informado como responsavel nao foi encontrado nesta empresa.', 422);
    }
  }

  const departamentoCriado = await departamentoModel.criar({
    empresaId,
    nome,
    descricao,
    responsavelId,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'departamentos',
    registroId: departamentoCriado.id,
    ip,
    detalhes: { nome },
  });

  return departamentoCriado;
}

/**
 * Atualiza um departamento existente.
 */
async function atualizar({ id, empresaId, nome, descricao, responsavelId, ativo, usuarioLogado, ip }) {
  const departamento = await departamentoModel.buscarPorId(id, empresaId);
  if (!departamento) {
    throw new ErroAplicacao('Departamento nao encontrado.', 404);
  }

  if (nome !== undefined && nome !== departamento.nome) {
    const departamentoComMesmoNome = await departamentoModel.buscarPorNome(nome, empresaId);
    if (departamentoComMesmoNome && departamentoComMesmoNome.id !== id) {
      throw new ErroAplicacao('Ja existe um departamento com este nome nesta empresa.', 409);
    }
  }

  if (responsavelId) {
    const responsavel = await usuarioModel.buscarPorIdNaEmpresa(responsavelId, empresaId);
    if (!responsavel) {
      throw new ErroAplicacao('O usuario informado como responsavel nao foi encontrado nesta empresa.', 422);
    }
  }

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (descricao !== undefined) camposParaAtualizar.descricao = descricao;
  if (responsavelId !== undefined) camposParaAtualizar.responsavel_id = responsavelId;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const departamentoAtualizado = await departamentoModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'departamentos',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return departamentoAtualizado;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
