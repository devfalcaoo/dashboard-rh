// ==========================================================================
// ARQUIVO: backend/validators/categoriaCompetenciaValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de categorias de
//           competencias.
// ==========================================================================

const TAMANHO_MAXIMO_NOME = 100;

/**
 * @param {{ nome: string, descricao?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarCategoria(dados) {
  const erros = [];
  const { nome } = dados || {};

  if (!nome) {
    erros.push('O campo "nome" e obrigatorio.');
  } else if (nome.length > TAMANHO_MAXIMO_NOME) {
    erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * @param {{ nome?: string, descricao?: string, ativo?: boolean }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarCategoria(dados) {
  const erros = [];
  const { nome, ativo } = dados || {};

  if (nome !== undefined) {
    if (!nome) {
      erros.push('O campo "nome" nao pode ser vazio.');
    } else if (nome.length > TAMANHO_MAXIMO_NOME) {
      erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
    }
  }

  if (ativo !== undefined && typeof ativo !== 'boolean') {
    erros.push('O campo "ativo" deve ser um valor booleano (true/false).');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarCategoria,
  validarAtualizarCategoria,
};
