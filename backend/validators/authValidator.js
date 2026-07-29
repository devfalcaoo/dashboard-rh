// ==========================================================================
// ARQUIVO: backend/validators/authValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de autenticacao
//           (login, recuperacao de senha e alteracao de senha) ANTES de
//           chegarem na camada de Service. Esta camada NUNCA contem regra
//           de negocio, apenas validacao de formato/obrigatoriedade.
// ==========================================================================

const { validarFormatoEmail } = require('../utils/validadorEmail');

const TAMANHO_MINIMO_SENHA = 6;

/**
 * Valida o payload de login.
 * @param {{ email: string, senha: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarLogin(dados) {
  const erros = [];
  const { email, senha } = dados || {};

  if (!email) {
    erros.push('O campo "email" e obrigatorio.');
  } else if (!validarFormatoEmail(email)) {
    erros.push('O campo "email" possui formato invalido.');
  }

  if (!senha) {
    erros.push('O campo "senha" e obrigatorio.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de recuperacao de senha.
 * @param {{ email: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarRecuperarSenha(dados) {
  const erros = [];
  const { email } = dados || {};

  if (!email) {
    erros.push('O campo "email" e obrigatorio.');
  } else if (!validarFormatoEmail(email)) {
    erros.push('O campo "email" possui formato invalido.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de alteracao de senha.
 * @param {{ novaSenha: string, confirmarSenha: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAlterarSenha(dados) {
  const erros = [];
  const { novaSenha, confirmarSenha } = dados || {};

  if (!novaSenha) {
    erros.push('O campo "novaSenha" e obrigatorio.');
  } else if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
    erros.push(`A senha deve possuir no minimo ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  if (!confirmarSenha) {
    erros.push('O campo "confirmarSenha" e obrigatorio.');
  } else if (novaSenha && novaSenha !== confirmarSenha) {
    erros.push('Os campos "novaSenha" e "confirmarSenha" nao coincidem.');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarLogin,
  validarRecuperarSenha,
  validarAlterarSenha,
};
