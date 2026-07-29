// ==========================================================================
// ARQUIVO: backend/utils/validadorTelefone.js
// OBJETIVO: Funcao utilitaria e reutilizavel para validar numero de
//           telefone brasileiro (fixo ou celular, com DDD).
// ==========================================================================

/**
 * Remove qualquer caractere que nao seja digito.
 * @param {string} telefone
 * @returns {string}
 */
function limparTelefone(telefone) {
  return String(telefone || '').replace(/\D/g, '');
}

/**
 * Valida um numero de telefone brasileiro: aceita 10 digitos (fixo, com
 * DDD) ou 11 digitos (celular, com DDD e o "9" na frente).
 * @param {string} telefone
 * @returns {boolean}
 */
function validarTelefone(telefone) {
  const numeros = limparTelefone(telefone);
  return numeros.length === 10 || numeros.length === 11;
}

module.exports = {
  limparTelefone,
  validarTelefone,
};
