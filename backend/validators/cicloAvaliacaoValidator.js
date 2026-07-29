// ==========================================================================
// ARQUIVO: backend/validators/cicloAvaliacaoValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de ciclos de
//           avaliacao. Nenhuma regra de negocio aqui - apenas formato,
//           obrigatoriedade e consistencia basica dos campos.
// ==========================================================================

const TIPOS_VALIDOS = ['90', '180', '360'];

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
 * Valida o payload de criacao de ciclo de avaliacao.
 * @param {{ nome: string, dataInicio: string, dataFim: string, tipo: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarCiclo(dados) {
  const erros = [];
  const { nome, dataInicio, dataFim, tipo } = dados || {};

  if (!nome || String(nome).trim().length === 0) {
    erros.push('O campo "nome" e obrigatorio.');
  } else if (nome.length > 150) {
    erros.push('O campo "nome" deve ter no maximo 150 caracteres.');
  }

  if (!dataInicio || !ehDataValida(dataInicio)) {
    erros.push('O campo "dataInicio" e obrigatorio e deve estar no formato AAAA-MM-DD.');
  }

  if (!dataFim || !ehDataValida(dataFim)) {
    erros.push('O campo "dataFim" e obrigatorio e deve estar no formato AAAA-MM-DD.');
  }

  if (dataInicio && dataFim && ehDataValida(dataInicio) && ehDataValida(dataFim)) {
    if (new Date(dataFim) <= new Date(dataInicio)) {
      erros.push('O campo "dataFim" deve ser posterior ao campo "dataInicio".');
    }
  }

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    erros.push(`O campo "tipo" e obrigatorio e deve ser um dos valores: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao de ciclo de avaliacao (campos opcionais).
 * @param {{ nome?: string, dataInicio?: string, dataFim?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarCiclo(dados) {
  const erros = [];
  const { nome, dataInicio, dataFim } = dados || {};

  if (nome !== undefined && (!nome || String(nome).trim().length === 0)) {
    erros.push('O campo "nome" nao pode ser vazio.');
  }

  if (dataInicio !== undefined && !ehDataValida(dataInicio)) {
    erros.push('O campo "dataInicio" deve estar no formato AAAA-MM-DD.');
  }

  if (dataFim !== undefined && !ehDataValida(dataFim)) {
    erros.push('O campo "dataFim" deve estar no formato AAAA-MM-DD.');
  }

  if (
    dataInicio !== undefined &&
    dataFim !== undefined &&
    ehDataValida(dataInicio) &&
    ehDataValida(dataFim) &&
    new Date(dataFim) <= new Date(dataInicio)
  ) {
    erros.push('O campo "dataFim" deve ser posterior ao campo "dataInicio".');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de encerramento de ciclo (justificativa e opcional,
 * mas se enviada deve ser uma string nao vazia).
 * @param {{ justificativa?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarEncerrarCiclo(dados) {
  const erros = [];
  const { justificativa } = dados || {};

  if (justificativa !== undefined && String(justificativa).trim().length === 0) {
    erros.push('O campo "justificativa", quando informado, nao pode ser vazio.');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarCiclo,
  validarAtualizarCiclo,
  validarEncerrarCiclo,
};
