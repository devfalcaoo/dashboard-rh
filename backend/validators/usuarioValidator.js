// ==========================================================================
// ARQUIVO: backend/validators/usuarioValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de usuarios.
//           Apenas validacao de formato/obrigatoriedade - a regra de
//           negocio sobre QUAIS perfis cada ator pode criar fica na
//           camada de Service.
// ==========================================================================

const { validarFormatoEmail } = require('../utils/validadorEmail');
const { LISTA_PERFIS } = require('../config/constantes');

const TAMANHO_MAXIMO_NOME = 150;
const TAMANHO_MINIMO_SENHA = 6;

/**
 * Valida o payload de criacao de usuario.
 * @param {{ nome: string, email: string, perfil: string, senhaTemporaria: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarUsuario(dados) {
  const erros = [];
  const { nome, email, perfil, senhaTemporaria } = dados || {};

  if (!nome) {
    erros.push('O campo "nome" e obrigatorio.');
  } else if (nome.length > TAMANHO_MAXIMO_NOME) {
    erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
  }

  if (!email) {
    erros.push('O campo "email" e obrigatorio.');
  } else if (!validarFormatoEmail(email)) {
    erros.push('O campo "email" possui formato invalido.');
  }

  if (!perfil) {
    erros.push('O campo "perfil" e obrigatorio.');
  } else if (!LISTA_PERFIS.includes(perfil)) {
    erros.push(`O campo "perfil" deve ser um dos seguintes: ${LISTA_PERFIS.join(', ')}.`);
  }

  if (!senhaTemporaria) {
    erros.push('O campo "senhaTemporaria" e obrigatorio.');
  } else if (senhaTemporaria.length < TAMANHO_MINIMO_SENHA) {
    erros.push(`A "senhaTemporaria" deve possuir no minimo ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao de usuario.
 * @param {{ nome?: string, perfil?: string, ativo?: boolean }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarUsuario(dados) {
  const erros = [];
  const { nome, perfil, ativo } = dados || {};

  if (nome !== undefined) {
    if (!nome) {
      erros.push('O campo "nome" nao pode ser vazio.');
    } else if (nome.length > TAMANHO_MAXIMO_NOME) {
      erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
    }
  }

  if (perfil !== undefined && !LISTA_PERFIS.includes(perfil)) {
    erros.push(`O campo "perfil" deve ser um dos seguintes: ${LISTA_PERFIS.join(', ')}.`);
  }

  if (ativo !== undefined && typeof ativo !== 'boolean') {
    erros.push('O campo "ativo" deve ser um valor booleano (true/false).');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarUsuario,
  validarAtualizarUsuario,
};
