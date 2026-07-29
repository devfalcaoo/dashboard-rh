// ==========================================================================
// ARQUIVO: backend/validators/competenciaValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de competencias.
// ==========================================================================

const TAMANHO_MAXIMO_NOME = 150;
const PESO_MINIMO = 0.01;
const PESO_MAXIMO = 100;

/**
 * @param {{ categoriaId: string, nome: string, descricao?: string, peso?: number }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarCriarCompetencia(dados) {
  const erros = [];
  const { categoriaId, nome, peso } = dados || {};

  if (!categoriaId) {
    erros.push('O campo "categoriaId" e obrigatorio.');
  }

  if (!nome) {
    erros.push('O campo "nome" e obrigatorio.');
  } else if (nome.length > TAMANHO_MAXIMO_NOME) {
    erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
  }

  if (peso !== undefined && peso !== null) {
    const pesoNumerico = Number(peso);
    if (Number.isNaN(pesoNumerico) || pesoNumerico < PESO_MINIMO || pesoNumerico > PESO_MAXIMO) {
      erros.push(`O campo "peso" deve ser um numero entre ${PESO_MINIMO} e ${PESO_MAXIMO}.`);
    }
  }

  return { valido: erros.length === 0, erros };
}

/**
 * @param {{ categoriaId?: string, nome?: string, descricao?: string, peso?: number, ativo?: boolean }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarAtualizarCompetencia(dados) {
  const erros = [];
  const { nome, peso, ativo } = dados || {};

  if (nome !== undefined) {
    if (!nome) {
      erros.push('O campo "nome" nao pode ser vazio.');
    } else if (nome.length > TAMANHO_MAXIMO_NOME) {
      erros.push(`O campo "nome" deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
    }
  }

  if (peso !== undefined && peso !== null) {
    const pesoNumerico = Number(peso);
    if (Number.isNaN(pesoNumerico) || pesoNumerico < PESO_MINIMO || pesoNumerico > PESO_MAXIMO) {
      erros.push(`O campo "peso" deve ser um numero entre ${PESO_MINIMO} e ${PESO_MAXIMO}.`);
    }
  }

  if (ativo !== undefined && typeof ativo !== 'boolean') {
    erros.push('O campo "ativo" deve ser um valor booleano (true/false).');
  }

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarCriarCompetencia,
  validarAtualizarCompetencia,
};
