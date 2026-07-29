// ==========================================================================
// ARQUIVO: backend/validators/metaValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de metas. Nenhuma
//           regra de negocio aqui - apenas formato e obrigatoriedade dos
//           campos.
//
// OBSERVACAO: a coluna "status" em metas nao possui CHECK constraint no
// banco (ver docs/modelagem-banco.sql), mas a aplicacao ainda assim
// padroniza os valores aceitos para manter consistencia de dados.
// ==========================================================================

const STATUS_VALIDOS = ['em_andamento', 'atingida', 'nao_atingida', 'cancelada'];
const TAMANHO_MAXIMO_TITULO = 150;

/**
 * Valida se uma string representa uma data no formato AAAA-MM-DD valida.
 * @param {string} data
 * @returns {boolean}
 */
function ehDataValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }
  const dataConvertida = new Date(`${data}T00:00:00`);
  return !Number.isNaN(dataConvertida.getTime());
}

/**
 * Valida o payload de criacao de meta.
 * @param {{
 *   colaboradorId: string, indicadorId: string, titulo: string,
 *   valorMeta: number, prazo?: string
 * }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarMeta(dados) {
  const erros = [];
  const { colaboradorId, indicadorId, titulo, valorMeta, prazo } = dados || {};

  if (!colaboradorId) {
    erros.push('O campo "colaboradorId" e obrigatorio.');
  }

  if (!indicadorId) {
    erros.push('O campo "indicadorId" e obrigatorio.');
  }

  if (!titulo || String(titulo).trim().length === 0) {
    erros.push('O campo "titulo" e obrigatorio.');
  } else if (titulo.length > TAMANHO_MAXIMO_TITULO) {
    erros.push(`O campo "titulo" deve ter no maximo ${TAMANHO_MAXIMO_TITULO} caracteres.`);
  }

  if (valorMeta === undefined || valorMeta === null || Number.isNaN(Number(valorMeta))) {
    erros.push('O campo "valorMeta" e obrigatorio e deve ser um numero.');
  }

  if (prazo !== undefined && prazo !== null && !ehDataValida(prazo)) {
    erros.push('O campo "prazo", quando informado, deve estar no formato AAAA-MM-DD.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao de dados gerais da meta.
 * @param {{ titulo?: string, valorMeta?: number, prazo?: string, status?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarMeta(dados) {
  const erros = [];
  const { titulo, valorMeta, prazo, status } = dados || {};

  if (titulo !== undefined) {
    if (String(titulo).trim().length === 0) {
      erros.push('O campo "titulo" nao pode ser vazio.');
    } else if (titulo.length > TAMANHO_MAXIMO_TITULO) {
      erros.push(`O campo "titulo" deve ter no maximo ${TAMANHO_MAXIMO_TITULO} caracteres.`);
    }
  }

  if (valorMeta !== undefined && Number.isNaN(Number(valorMeta))) {
    erros.push('O campo "valorMeta" deve ser um numero.');
  }

  if (prazo !== undefined && prazo !== null && !ehDataValida(prazo)) {
    erros.push('O campo "prazo", quando informado, deve estar no formato AAAA-MM-DD.');
  }

  if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
    erros.push(`O campo "status" deve ser um dos valores: ${STATUS_VALIDOS.join(', ')}.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao do valor atual da meta (acompanhamento).
 * @param {{ valorAtual: number }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarValorAtual(dados) {
  const erros = [];
  const { valorAtual } = dados || {};

  if (valorAtual === undefined || valorAtual === null || Number.isNaN(Number(valorAtual))) {
    erros.push('O campo "valorAtual" e obrigatorio e deve ser um numero.');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarMeta,
  validarAtualizarMeta,
  validarAtualizarValorAtual,
};
