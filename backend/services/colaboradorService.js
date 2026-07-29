// ==========================================================================
// ARQUIVO: backend/services/colaboradorService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de colaboradores.
//           Uso: Administrador da Empresa e RH, sempre restrito a propria
//           empresa. Um colaborador SEMPRE se origina de um usuario ja
//           existente (criado via usuarioService, Fase 3) - este Service
//           adiciona os dados de vinculo empregaticio (CPF, telefone,
//           admissao, departamento, cargo, lideranca).
// ==========================================================================

const colaboradorModel = require('../models/colaboradorModel');
const usuarioModel = require('../models/usuarioModel');
const departamentoModel = require('../models/departamentoModel');
const cargoModel = require('../models/cargoModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { limparCpf } = require('../utils/validadorCpf');
const { limparTelefone } = require('../utils/validadorTelefone');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Valida se departamento, cargo, lider e gestor informados pertencem
 * de fato a empresa do colaborador (defesa contra vinculo cruzado entre
 * empresas).
 */
async function validarReferencias({ empresaId, departamentoId, cargoId, liderId, gestorId, idColaboradorAtual }) {
  if (departamentoId) {
    const departamento = await departamentoModel.buscarPorId(departamentoId, empresaId);
    if (!departamento) {
      throw new ErroAplicacao('O departamento informado nao foi encontrado nesta empresa.', 422);
    }
  }

  if (cargoId) {
    const cargo = await cargoModel.buscarPorId(cargoId, empresaId);
    if (!cargo) {
      throw new ErroAplicacao('O cargo informado nao foi encontrado nesta empresa.', 422);
    }
  }

  if (liderId) {
    if (idColaboradorAtual && liderId === idColaboradorAtual) {
      throw new ErroAplicacao('Um colaborador nao pode ser lider de si mesmo.', 422);
    }
    const lider = await colaboradorModel.buscarPorId(liderId, empresaId);
    if (!lider) {
      throw new ErroAplicacao('O lider informado nao foi encontrado nesta empresa.', 422);
    }
  }

  if (gestorId) {
    if (idColaboradorAtual && gestorId === idColaboradorAtual) {
      throw new ErroAplicacao('Um colaborador nao pode ser gestor de si mesmo.', 422);
    }
    const gestor = await colaboradorModel.buscarPorId(gestorId, empresaId);
    if (!gestor) {
      throw new ErroAplicacao('O gestor informado nao foi encontrado nesta empresa.', 422);
    }
  }
}

/**
 * Lista os colaboradores da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, departamentoId, cargoId, liderId, ativo }) {
  return colaboradorModel.listarPorEmpresa({
    empresaId,
    pagina,
    tamanhoPagina,
    departamentoId,
    cargoId,
    liderId,
    ativo,
  });
}

/**
 * Busca um colaborador especifico, restrito a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const colaborador = await colaboradorModel.buscarPorId(id, empresaId);
  if (!colaborador) {
    throw new ErroAplicacao('Colaborador nao encontrado.', 404);
  }
  return colaborador;
}

/**
 * Cria o registro de colaborador para um usuario ja existente.
 */
async function criar({
  usuarioId,
  empresaId,
  cpf,
  telefone,
  dataAdmissao,
  departamentoId,
  cargoId,
  liderId,
  gestorId,
  usuarioLogado,
  ip,
}) {
  const usuario = await usuarioModel.buscarPorIdNaEmpresa(usuarioId, empresaId);
  if (!usuario) {
    throw new ErroAplicacao('O usuario informado nao foi encontrado nesta empresa.', 422);
  }

  const colaboradorExistenteParaUsuario = await colaboradorModel.buscarPorUsuarioId(usuarioId, empresaId);
  if (colaboradorExistenteParaUsuario) {
    throw new ErroAplicacao('Este usuario ja possui um cadastro de colaborador.', 409);
  }

  const cpfLimpo = limparCpf(cpf);
  const colaboradorComMesmoCpf = await colaboradorModel.buscarPorCpf(cpfLimpo);
  if (colaboradorComMesmoCpf) {
    throw new ErroAplicacao('Ja existe um colaborador cadastrado com este CPF.', 409);
  }

  await validarReferencias({ empresaId, departamentoId, cargoId, liderId, gestorId });

  const colaboradorCriado = await colaboradorModel.criar({
    usuarioId,
    empresaId,
    cpf: cpfLimpo,
    telefone: telefone ? limparTelefone(telefone) : null,
    dataAdmissao,
    departamentoId,
    cargoId,
    liderId,
    gestorId,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'colaboradores',
    registroId: colaboradorCriado.id,
    ip,
    detalhes: { usuarioId, cpf: cpfLimpo },
  });

  return colaboradorCriado;
}

/**
 * Atualiza os dados de vinculo de um colaborador existente.
 */
async function atualizar({
  id,
  empresaId,
  telefone,
  dataAdmissao,
  departamentoId,
  cargoId,
  liderId,
  gestorId,
  ativo,
  usuarioLogado,
  ip,
}) {
  const colaborador = await colaboradorModel.buscarPorId(id, empresaId);
  if (!colaborador) {
    throw new ErroAplicacao('Colaborador nao encontrado.', 404);
  }

  await validarReferencias({
    empresaId,
    departamentoId,
    cargoId,
    liderId,
    gestorId,
    idColaboradorAtual: id,
  });

  const camposParaAtualizar = {};
  if (telefone !== undefined) camposParaAtualizar.telefone = telefone ? limparTelefone(telefone) : null;
  if (dataAdmissao !== undefined) camposParaAtualizar.data_admissao = dataAdmissao;
  if (departamentoId !== undefined) camposParaAtualizar.departamento_id = departamentoId;
  if (cargoId !== undefined) camposParaAtualizar.cargo_id = cargoId;
  if (liderId !== undefined) camposParaAtualizar.lider_id = liderId;
  if (gestorId !== undefined) camposParaAtualizar.gestor_id = gestorId;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const colaboradorAtualizado = await colaboradorModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'colaboradores',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return colaboradorAtualizado;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
