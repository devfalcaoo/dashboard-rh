// ==========================================================================
// ARQUIVO: backend/validators/indicadorValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de indicadores.
//           Nenhuma regra de negocio aqui - apenas formato e
//           obrigatoriedade dos campos.
// ==========================================================================

const TAMANHO_MAXIMO_NOME = 150;
const TAMANHO_MAXIMO_UNIDADE = 30;

/**
 * Valida o payload de criacao de indicador.
 * @param {{ nome: string, descricao?: string, unidadeMedida?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarIndicador(dados) {
  const erros = [];
  const { nome, unidadeMedida } = dados || {};

  if (!nome || String(nome).trim().length === 0) {
    erros.push('O campo "nome" e obrigatorio.');
  } else if (nome.length > TAMANHO_MAXIMO_NOME) {
    erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
  }

  if (unidadeMedida !== undefined && unidadeMedida !== null && unidadeMedida.length > TAMANHO_MAXIMO_UNIDADE) {
    erros.push(`O campo "unidadeMedida" deve ter no maximo ${TAMANHO_MAXIMO_UNIDADE} caracteres.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao de indicador (campos opcionais).
 * @param {{ nome?: string, descricao?: string, unidadeMedida?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarIndicador(dados) {
  const erros = [];
  const { nome, unidadeMedida } = dados || {};

  if (nome !== undefined) {
    if (String(nome).trim().length === 0) {
      erros.push('O campo "nome" nao pode ser vazio.');
    } else if (nome.length > TAMANHO_MAXIMO_NOME) {
      erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
    }
  }

  if (
    unidadeMedida !== undefined &&
    unidadeMedida !== null &&
    unidadeMedida.length > TAMANHO_MAXIMO_UNIDADE
  ) {
    erros.push(`O campo "unidadeMedida" deve ter no maximo ${TAMANHO_MAXIMO_UNIDADE} caracteres.`);
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarIndicador,
  validarAtualizarIndicador,
};
