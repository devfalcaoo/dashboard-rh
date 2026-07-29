// ==========================================================================
// ARQUIVO: backend/validators/relatorioValidator.js
// OBJETIVO: Validar os parametros de consulta das rotas de relatorios.
// ==========================================================================

const FORMATOS_VALIDOS = ['pdf', 'xlsx'];

function validarParametrosRelatorio(query) {
  const erros = [];
  const { formato } = query || {};

  if (!formato || !FORMATOS_VALIDOS.includes(formato)) {
    erros.push(`O parametro "formato" e obrigatorio e deve ser um dos valores: ${FORMATOS_VALIDOS.join(', ')}.`);
  }

  return { valido: erros.length === 0, erros };
}

module.exports = { validarParametrosRelatorio };
