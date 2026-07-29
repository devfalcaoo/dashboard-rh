// ==========================================================================
// ARQUIVO: backend/validators/empresaValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de empresas.
//           Apenas validacao de formato/obrigatoriedade - nenhuma regra
//           de negocio ou acesso a dados.
// ==========================================================================

const { validarCnpj, limparCnpj } = require('../utils/validadorCnpj');

const TAMANHO_MAXIMO_RAZAO_SOCIAL = 200;

/**
 * Valida o payload de criacao de empresa.
 * @param {{ razaoSocial: string, cnpj: string, plano?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarEmpresa(dados) {
  const erros = [];
  const { razaoSocial, cnpj } = dados || {};

  if (!razaoSocial) {
    erros.push('O campo "razaoSocial" e obrigatorio.');
  } else if (razaoSocial.length > TAMANHO_MAXIMO_RAZAO_SOCIAL) {
    erros.push(`O campo "razaoSocial" deve ter no maximo ${TAMANHO_MAXIMO_RAZAO_SOCIAL} caracteres.`);
  }

  if (!cnpj) {
    erros.push('O campo "cnpj" e obrigatorio.');
  } else if (!validarCnpj(cnpj)) {
    erros.push('O campo "cnpj" e invalido.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao completa de empresa (uso do Administrador Geral).
 * @param {{ razaoSocial?: string, cnpj?: string, plano?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarEmpresa(dados) {
  const erros = [];
  const { razaoSocial, cnpj } = dados || {};

  if (razaoSocial !== undefined) {
    if (!razaoSocial) {
      erros.push('O campo "razaoSocial" nao pode ser vazio.');
    } else if (razaoSocial.length > TAMANHO_MAXIMO_RAZAO_SOCIAL) {
      erros.push(`O campo "razaoSocial" deve ter no maximo ${TAMANHO_MAXIMO_RAZAO_SOCIAL} caracteres.`);
    }
  }

  if (cnpj !== undefined && !validarCnpj(cnpj)) {
    erros.push('O campo "cnpj" e invalido.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao dos DADOS PROPRIOS da empresa, usado por
 * Administrador da Empresa / RH (apenas razao social pode ser alterada
 * por este publico - cnpj e plano sao restritos ao Administrador Geral).
 * @param {{ razaoSocial: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarDadosProprios(dados) {
  const erros = [];
  const { razaoSocial } = dados || {};

  if (!razaoSocial) {
    erros.push('O campo "razaoSocial" e obrigatorio.');
  } else if (razaoSocial.length > TAMANHO_MAXIMO_RAZAO_SOCIAL) {
    erros.push(`O campo "razaoSocial" deve ter no maximo ${TAMANHO_MAXIMO_RAZAO_SOCIAL} caracteres.`);
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarEmpresa,
  validarAtualizarEmpresa,
  validarAtualizarDadosProprios,
  limparCnpj,
};
