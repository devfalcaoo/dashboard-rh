// ==========================================================================
// ARQUIVO: backend/validators/notificacaoValidator.js
// OBJETIVO: Validar os parametros de consulta das rotas de notificacoes.
// ==========================================================================

/**
 * Valida o parametro opcional "lida" vindo da query string.
 * @param {string|undefined} lidaTexto
 * @returns {{ valido: boolean, erros: string[], lida: boolean|undefined }}
 */
function validarFiltroLida(lidaTexto) {
  const erros = [];

  if (lidaTexto === undefined) {
    return { valido: true, erros, lida: undefined };
  }

  if (lidaTexto !== 'true' && lidaTexto !== 'false') {
    erros.push('O parametro "lida", quando informado, deve ser "true" ou "false".');
    return { valido: false, erros, lida: undefined };
  }

  return { valido: true, erros, lida: lidaTexto === 'true' };
}

module.exports = {
  validarFiltroLida,
};
