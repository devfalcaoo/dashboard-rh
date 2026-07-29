// ==========================================================================
// ARQUIVO: backend/services/empresaService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de empresas.
//           Criacao, listagem, atualizacao completa e ativacao/inativacao
//           sao de uso EXCLUSIVO do Administrador Geral. A consulta e
//           atualizacao restrita dos "dados proprios" (usada por
//           Administrador da Empresa/RH) tambem fica centralizada aqui.
// ==========================================================================

const empresaModel = require('../models/empresaModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { limparCnpj } = require('../validators/empresaValidator');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Cria uma nova empresa (Administrador Geral).
 */
async function criar({ razaoSocial, cnpj, plano, usuarioLogado, ip }) {
  const cnpjLimpo = limparCnpj(cnpj);

  const empresaExistente = await empresaModel.buscarPorCnpj(cnpjLimpo);
  if (empresaExistente) {
    throw new ErroAplicacao('Ja existe uma empresa cadastrada com este CNPJ.', 409);
  }

  const empresaCriada = await empresaModel.criar({ razaoSocial, cnpj: cnpjLimpo, plano });

  await auditoriaService.registrar({
    empresaId: null,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'empresas',
    registroId: empresaCriada.id,
    ip,
    detalhes: { razaoSocial, cnpj: cnpjLimpo },
  });

  return empresaCriada;
}

/**
 * Lista todas as empresas cadastradas (Administrador Geral).
 */
async function listar({ pagina, tamanhoPagina, ativo }) {
  return empresaModel.listar({ pagina, tamanhoPagina, ativo });
}

/**
 * Busca uma empresa especifica pelo id (Administrador Geral).
 */
async function buscarPorId(id) {
  const empresa = await empresaModel.buscarPorId(id);
  if (!empresa) {
    throw new ErroAplicacao('Empresa nao encontrada.', 404);
  }
  return empresa;
}

/**
 * Atualiza os dados completos de uma empresa (Administrador Geral):
 * razao social, CNPJ e plano.
 */
async function atualizar({ id, razaoSocial, cnpj, plano, usuarioLogado, ip }) {
  const empresa = await empresaModel.buscarPorId(id);
  if (!empresa) {
    throw new ErroAplicacao('Empresa nao encontrada.', 404);
  }

  const camposParaAtualizar = {};

  if (razaoSocial !== undefined) {
    camposParaAtualizar.razao_social = razaoSocial;
  }

  if (cnpj !== undefined) {
    const cnpjLimpo = limparCnpj(cnpj);
    const empresaComMesmoCnpj = await empresaModel.buscarPorCnpj(cnpjLimpo);
    if (empresaComMesmoCnpj && empresaComMesmoCnpj.id !== id) {
      throw new ErroAplicacao('Ja existe outra empresa cadastrada com este CNPJ.', 409);
    }
    camposParaAtualizar.cnpj = cnpjLimpo;
  }

  if (plano !== undefined) {
    camposParaAtualizar.plano = plano;
  }

  const empresaAtualizada = await empresaModel.atualizar(id, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId: null,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'empresas',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return empresaAtualizada;
}

/**
 * Ativa ou inativa uma empresa (Administrador Geral). Inativar uma
 * empresa bloqueia o acesso de todos os seus usuarios, via
 * empresaMiddleware.
 */
async function alterarStatus({ id, ativo, usuarioLogado, ip }) {
  const empresa = await empresaModel.buscarPorId(id);
  if (!empresa) {
    throw new ErroAplicacao('Empresa nao encontrada.', 404);
  }

  const empresaAtualizada = await empresaModel.atualizar(id, { ativo });

  await auditoriaService.registrar({
    empresaId: null,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'empresas',
    registroId: id,
    ip,
    detalhes: { motivo: ativo ? 'empresa ativada' : 'empresa inativada' },
  });

  return empresaAtualizada;
}

/**
 * Retorna os dados da propria empresa do usuario logado
 * (Administrador da Empresa / RH).
 */
async function buscarMinhaEmpresa(empresaId) {
  const empresa = await empresaModel.buscarPorId(empresaId);
  if (!empresa) {
    throw new ErroAplicacao('Empresa nao encontrada.', 404);
  }
  return empresa;
}

/**
 * Atualiza APENAS a razao social da propria empresa
 * (Administrador da Empresa / RH). CNPJ e plano sao restritos ao
 * Administrador Geral.
 */
async function atualizarDadosProprios({ empresaId, razaoSocial, usuarioLogado, ip }) {
  const empresaAtualizada = await empresaModel.atualizar(empresaId, { razao_social: razaoSocial });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'empresas',
    registroId: empresaId,
    ip,
    detalhes: { razaoSocial },
  });

  return empresaAtualizada;
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  alterarStatus,
  buscarMinhaEmpresa,
  atualizarDadosProprios,
};
