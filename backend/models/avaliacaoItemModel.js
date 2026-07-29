// ==========================================================================
// ARQUIVO: backend/models/avaliacaoItemModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "avaliacao_itens" no
//           Supabase (as notas por competencia dentro de uma avaliacao).
//
// OBSERVACAO: esta tabela NAO possui empresa_id proprio - o isolamento
// multiempresa e garantido indiretamente pois "avaliacao_id" sempre
// pertence a uma avaliacao ja filtrada por empresa (verificada na camada
// de Service antes de chamar este Model), e reforcado no banco pela
// trigger trg_valida_mesma_empresa_avaliacao_item.
// ==========================================================================

const supabase = require('../config/supabaseClient');

const COLUNAS_PADRAO = 'id, avaliacao_id, competencia_id, nota, comentario, created_at';

/**
 * Lista todos os itens (notas por competencia) de uma avaliacao.
 * @param {string} avaliacaoId
 * @returns {Promise<object[]>}
 */
async function listarPorAvaliacao(avaliacaoId) {
  const { data, error } = await supabase
    .from('avaliacao_itens')
    .select(COLUNAS_PADRAO)
    .eq('avaliacao_id', avaliacaoId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar itens da avaliacao: ${error.message}`);
  }

  return data;
}

/**
 * Lista todos os itens (notas por competencia) de um conjunto de
 * avaliacoes. Uso: agregacoes do Dashboard (ex: competencias criticas).
 * @param {string[]} avaliacaoIds
 * @returns {Promise<object[]>}
 */
async function listarPorAvaliacoes(avaliacaoIds) {
  if (!avaliacaoIds || avaliacaoIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('avaliacao_itens')
    .select(COLUNAS_PADRAO)
    .in('avaliacao_id', avaliacaoIds);

  if (error) {
    throw new Error(`Erro ao listar itens de multiplas avaliacoes: ${error.message}`);
  }

  return data;
}

/**
 * Cria ou atualiza (upsert) a nota de uma competencia especifica dentro
 * de uma avaliacao. A combinacao (avaliacao_id, competencia_id) e tratada
 * como chave natural para o upsert.
 * @param {{ avaliacaoId: string, competenciaId: string, nota: number, comentario?: string }} dados
 * @returns {Promise<object>}
 */
async function salvarItem({ avaliacaoId, competenciaId, nota, comentario }) {
  // Verifica se ja existe um item para esta avaliacao + competencia
  const { data: itemExistente, error: erroBusca } = await supabase
    .from('avaliacao_itens')
    .select('id')
    .eq('avaliacao_id', avaliacaoId)
    .eq('competencia_id', competenciaId)
    .maybeSingle();

  if (erroBusca) {
    throw new Error(`Erro ao verificar item de avaliacao existente: ${erroBusca.message}`);
  }

  if (itemExistente) {
    const { data, error } = await supabase
      .from('avaliacao_itens')
      .update({ nota, comentario: comentario || null })
      .eq('id', itemExistente.id)
      .select(COLUNAS_PADRAO)
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar item de avaliacao: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await supabase
    .from('avaliacao_itens')
    .insert({
      avaliacao_id: avaliacaoId,
      competencia_id: competenciaId,
      nota,
      comentario: comentario || null,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar item de avaliacao: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorAvaliacao,
  listarPorAvaliacoes,
  salvarItem,
};
