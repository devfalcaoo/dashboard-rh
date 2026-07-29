// ==========================================================================
// ARQUIVO: backend/utils/validadorEmail.js
// OBJETIVO: Funcao utilitaria e reutilizavel para validar o formato de
//           um endereco de e-mail. Usada por qualquer Validator que
//           precise validar este tipo de campo (usuarios, colaboradores,
//           autenticacao, etc), evitando duplicacao de regex pelo projeto.
// ==========================================================================

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida se uma string possui formato de e-mail valido.
 * @param {string} email
 * @returns {boolean}
 */
function validarFormatoEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  return REGEX_EMAIL.test(email.trim());
}

module.exports = {
  validarFormatoEmail,
};
