// ==========================================================================
// ARQUIVO: backend/models/metaModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "metas" no Supabase.
//           Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, colaborador_id, indicador_id, titulo, valor_meta, valor_atual, prazo, status, created_at, updated_at';

/**
 * Lista metas de uma empresa, com filtros opcionais.
 * @param {{
 *   empresaId: string, pagina: number, tamanhoPagina: number,
 *   colaboradorId?: string, indicadorId?: string, status?: string
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({
  empresaId,
  pagina = 1,
  tamanhoPagina = 20,
  colaboradorId,
  indicadorId,
  status,
}) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('metas')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (colaboradorId) query = query.eq('colaborador_id', colaboradorId);
  if (indicadorId) query = query.eq('indicador_id', indicadorId);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar metas: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca uma meta pelo id, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('metas').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar meta por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria uma nova meta.
 * @param {{
 *   empresaId: string, colaboradorId: string, indicadorId: string,
 *   titulo: string, valorMeta: number, prazo?: string
 * }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, colaboradorId, indicadorId, titulo, valorMeta, prazo }) {
  const { data, error } = await supabase
    .from('metas')
    .insert({
      empresa_id: empresaId,
      colaborador_id: colaboradorId,
      indicador_id: indicadorId,
      titulo,
      valor_meta: valorMeta,
      valor_atual: 0,
      prazo: prazo || null,
      status: 'em_andamento',
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar meta: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza uma meta, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('metas').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar meta: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  criar,
  atualizar,
};
