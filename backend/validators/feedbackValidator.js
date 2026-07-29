// ==========================================================================
// ARQUIVO: backend/validators/feedbackValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de feedbacks.
//           Nenhuma regra de negocio aqui - apenas formato e
//           obrigatoriedade dos campos.
// ==========================================================================

const TIPOS_VALIDOS = ['positivo', 'construtivo'];
const TAMANHO_MAXIMO_MENSAGEM = 2000;

/**
 * Valida o payload de criacao de feedback.
 * @param {{ colaboradorId: string, tipo: string, mensagem: string, avaliacaoId?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarFeedback(dados) {
  const erros = [];
  const { colaboradorId, tipo, mensagem } = dados || {};

  if (!colaboradorId) {
    erros.push('O campo "colaboradorId" e obrigatorio.');
  }

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    erros.push(`O campo "tipo" e obrigatorio e deve ser um dos valores: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  if (!mensagem || String(mensagem).trim().length === 0) {
    erros.push('O campo "mensagem" e obrigatorio.');
  } else if (mensagem.length > TAMANHO_MAXIMO_MENSAGEM) {
    erros.push(`O campo "mensagem" deve ter no maximo ${TAMANHO_MAXIMO_MENSAGEM} caracteres.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao de feedback (campos opcionais).
 * @param {{ tipo?: string, mensagem?: string, ativo?: boolean }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarFeedback(dados) {
  const erros = [];
  const { tipo, mensagem, ativo } = dados || {};

  if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
    erros.push(`O campo "tipo" deve ser um dos valores: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  if (mensagem !== undefined) {
    if (String(mensagem).trim().length === 0) {
      erros.push('O campo "mensagem" nao pode ser vazio.');
    } else if (mensagem.length > TAMANHO_MAXIMO_MENSAGEM) {
      erros.push(`O campo "mensagem" deve ter no maximo ${TAMANHO_MAXIMO_MENSAGEM} caracteres.`);
    }
  }

  if (ativo !== undefined && typeof ativo !== 'boolean') {
    erros.push('O campo "ativo" deve ser booleano.');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarFeedback,
  validarAtualizarFeedback,
};
