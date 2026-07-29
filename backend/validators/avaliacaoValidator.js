// ==========================================================================
// ARQUIVO: backend/validators/avaliacaoValidator.js
// OBJETIVO: Validar os payloads de entrada das rotas de avaliacoes
//           (registro de notas por competencia). Nenhuma regra de negocio
//           aqui - apenas formato e obrigatoriedade.
// ==========================================================================

const NOTA_MINIMA = 0;
const NOTA_MAXIMA = 10;

/**
 * Valida o payload de registro de notas de uma avaliacao.
 * @param {{ itens: Array<{ competenciaId: string, nota: number, comentario?: string }> }} dados
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarItensAvaliacao(dados) {
  const erros = [];
  const { itens } = dados || {};

  if (!Array.isArray(itens) || itens.length === 0) {
    erros.push('O campo "itens" e obrigatorio e deve ser uma lista com pelo menos uma competencia avaliada.');
    return { valido: false, erros };
  }

  itens.forEach((item, indice) => {
    if (!item || typeof item !== 'object') {
      erros.push(`O item na posicao ${indice} e invalido.`);
      return;
    }

    if (!item.competenciaId) {
      erros.push(`O item na posicao ${indice} precisa informar "competenciaId".`);
    }

    if (item.nota === undefined || item.nota === null || Number.isNaN(Number(item.nota))) {
      erros.push(`O item na posicao ${indice} precisa informar "nota" (numero).`);
    } else if (Number(item.nota) < NOTA_MINIMA || Number(item.nota) > NOTA_MAXIMA) {
      erros.push(`A nota do item na posicao ${indice} deve estar entre ${NOTA_MINIMA} e ${NOTA_MAXIMA}.`);
    }

    if (item.comentario !== undefined && typeof item.comentario !== 'string') {
      erros.push(`O comentario do item na posicao ${indice} deve ser um texto.`);
    }
  });

  return { valido: erros.length === 0, erros };
}

module.exports = {
  validarItensAvaliacao,
};
