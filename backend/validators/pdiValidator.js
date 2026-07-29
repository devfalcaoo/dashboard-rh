// ==========================================================================
// ARQUIVO: backend/validators/pdiValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de PDI (Plano de
//           Desenvolvimento Individual). Nenhuma regra de negocio aqui -
//           apenas formato e obrigatoriedade dos campos.
// ==========================================================================

const STATUS_VALIDOS = ['nao_iniciado', 'em_andamento', 'concluido'];
const TAMANHO_MAXIMO_OBJETIVO = 2000;

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
 * Valida o payload de criacao de PDI.
 * @param {{ colaboradorId: string, competenciaId: string, objetivo: string, prazo?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarPdi(dados) {
  const erros = [];
  const { colaboradorId, competenciaId, objetivo, prazo } = dados || {};

  if (!colaboradorId) {
    erros.push('O campo "colaboradorId" e obrigatorio.');
  }

  if (!competenciaId) {
    erros.push('O campo "competenciaId" e obrigatorio.');
  }

  if (!objetivo || String(objetivo).trim().length === 0) {
    erros.push('O campo "objetivo" e obrigatorio.');
  } else if (objetivo.length > TAMANHO_MAXIMO_OBJETIVO) {
    erros.push(`O campo "objetivo" deve ter no maximo ${TAMANHO_MAXIMO_OBJETIVO} caracteres.`);
  }

  if (prazo !== undefined && prazo !== null && !ehDataValida(prazo)) {
    erros.push('O campo "prazo", quando informado, deve estar no formato AAAA-MM-DD.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida o payload de atualizacao de PDI (dados gerais, sem progresso).
 * @param {{ objetivo?: string, competenciaId?: string, prazo?: string, status?: string }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarPdi(dados) {
  const erros = [];
  const { objetivo, prazo, status } = dados || {};

  if (objetivo !== undefined) {
    if (String(objetivo).trim().length === 0) {
      erros.push('O campo "objetivo" nao pode ser vazio.');
    } else if (objetivo.length > TAMANHO_MAXIMO_OBJETIVO) {
      erros.push(`O campo "objetivo" deve ter no maximo ${TAMANHO_MAXIMO_OBJETIVO} caracteres.`);
    }
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
 * Valida o payload de atualizacao de progresso do PDI.
 * @param {{ progresso: number }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarProgresso(dados) {
  const erros = [];
  const { progresso } = dados || {};

  if (progresso === undefined || progresso === null || Number.isNaN(Number(progresso))) {
    erros.push('O campo "progresso" e obrigatorio e deve ser um numero.');
  } else if (Number(progresso) < 0 || Number(progresso) > 100) {
    erros.push('O campo "progresso" deve estar entre 0 e 100.');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarPdi,
  validarAtualizarPdi,
  validarAtualizarProgresso,
};
