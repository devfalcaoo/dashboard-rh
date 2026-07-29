// ==========================================================================
// ARQUIVO: backend/models/feedbackModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "feedbacks" no
//           Supabase. Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, colaborador_id, autor_id, tipo, mensagem, avaliacao_id, ativo, created_at, updated_at';

/**
 * Lista feedbacks de uma empresa, com filtros opcionais.
 * @param {{
 *   empresaId: string, pagina: number, tamanhoPagina: number,
 *   colaboradorId?: string, autorId?: string, tipo?: string, ativo?: boolean
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({
  empresaId,
  pagina = 1,
  tamanhoPagina = 20,
  colaboradorId,
  autorId,
  tipo,
  ativo,
}) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('feedbacks')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (colaboradorId) query = query.eq('colaborador_id', colaboradorId);
  if (autorId) query = query.eq('autor_id', autorId);
  if (tipo) query = query.eq('tipo', tipo);
  if (ativo !== undefined) query = query.eq('ativo', ativo);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar feedbacks: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca um feedback pelo id, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('feedbacks').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar feedback por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo feedback.
 * @param {{
 *   empresaId: string, colaboradorId: string, autorId: string,
 *   tipo: string, mensagem: string, avaliacaoId?: string
 * }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, colaboradorId, autorId, tipo, mensagem, avaliacaoId }) {
  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      empresa_id: empresaId,
      colaborador_id: colaboradorId,
      autor_id: autorId,
      tipo,
      mensagem,
      avaliacao_id: avaliacaoId || null,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar feedback: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um feedback, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('feedbacks').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar feedback: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  criar,
  atualizar,
};
