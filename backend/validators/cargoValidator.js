// ==========================================================================
// ARQUIVO: backend/validators/cargoValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de cargos.
// ==========================================================================

const TAMANHO_MAXIMO_NOME = 150;
const NIVEIS_VALIDOS = ['junior', 'pleno', 'senior'];

/**
 * @param {{ nome: string, nivel?: string, departamentoId?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarCargo(dados) {
  const erros = [];
  const { nome, nivel } = dados || {};

  if (!nome) {
    erros.push('O campo "nome" e obrigatorio.');
  } else if (nome.length > TAMANHO_MAXIMO_NOME) {
    erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
  }

  if (nivel !== undefined && nivel !== null && !NIVEIS_VALIDOS.includes(nivel)) {
    erros.push(`O campo "nivel" deve ser um dos seguintes: ${NIVEIS_VALIDOS.join(', ')}.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * @param {{ nome?: string, nivel?: string, departamentoId?: string, ativo?: boolean }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarCargo(dados) {
  const erros = [];
  const { nome, nivel, ativo } = dados || {};

  if (nome !== undefined) {
    if (!nome) {
      erros.push('O campo "nome" nao pode ser vazio.');
    } else if (nome.length > TAMANHO_MAXIMO_NOME) {
      erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
    }
  }

  if (nivel !== undefined && nivel !== null && !NIVEIS_VALIDOS.includes(nivel)) {
    erros.push(`O campo "nivel" deve ser um dos seguintes: ${NIVEIS_VALIDOS.join(', ')}.`);
  }

  if (ativo !== undefined && typeof ativo !== 'boolean') {
    erros.push('O campo "ativo" deve ser um valor booleano (true/false).');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarCargo,
  validarAtualizarCargo,
};
