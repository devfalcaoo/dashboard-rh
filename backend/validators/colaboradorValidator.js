// ==========================================================================
// ARQUIVO: backend/validators/colaboradorValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de colaboradores.
//           Apenas validacao de formato/obrigatoriedade - regras de
//           negocio (ex: usuario ja vinculado a outro colaborador,
//           lider/gestor pertencerem a mesma empresa) ficam no Service.
// ==========================================================================

const { validarCpf } = require('../utils/validadorCpf');
const { validarTelefone } = require('../utils/validadorTelefone');

/**
 * @param {{
 *   usuarioId: string,
 *   cpf: string,
 *   telefone?: string,
 *   dataAdmissao?: string,
 *   departamentoId?: string,
 *   cargoId?: string,
 *   liderId?: string,
 *   gestorId?: string
 * }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarColaborador(dados) {
  const erros = [];
  const { usuarioId, cpf, telefone, dataAdmissao } = dados || {};

  if (!usuarioId) {
    erros.push('O campo "usuarioId" e obrigatorio.');
  }

  if (!cpf) {
    erros.push('O campo "cpf" e obrigatorio.');
  } else if (!validarCpf(cpf)) {
    erros.push('O campo "cpf" e invalido.');
  }

  if (telefone !== undefined && telefone !== null && telefone !== '' && !validarTelefone(telefone)) {
    erros.push('O campo "telefone" e invalido (informe DDD + numero).');
  }

  if (dataAdmissao !== undefined && dataAdmissao !== null && isNaN(Date.parse(dataAdmissao))) {
    erros.push('O campo "dataAdmissao" e invalido.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * @param {{
 *   telefone?: string,
 *   dataAdmissao?: string,
 *   departamentoId?: string,
 *   cargoId?: string,
 *   liderId?: string,
 *   gestorId?: string,
 *   ativo?: boolean
 * }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarColaborador(dados) {
  const erros = [];
  const { telefone, dataAdmissao, ativo } = dados || {};

  if (telefone !== undefined && telefone !== null && telefone !== '' && !validarTelefone(telefone)) {
    erros.push('O campo "telefone" e invalido (informe DDD + numero).');
  }

  if (dataAdmissao !== undefined && dataAdmissao !== null && isNaN(Date.parse(dataAdmissao))) {
    erros.push('O campo "dataAdmissao" e invalido.');
  }

  if (ativo !== undefined && typeof ativo !== 'boolean') {
    erros.push('O campo "ativo" deve ser um valor booleano (true/false).');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarColaborador,
  validarAtualizarColaborador,
};
