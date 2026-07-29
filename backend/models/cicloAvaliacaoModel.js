// ==========================================================================
// ARQUIVO: backend/models/cicloAvaliacaoModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "ciclos_avaliacao" no
//           Supabase. Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, nome, data_inicio, data_fim, status, tipo, created_at, updated_at';

/**
 * Lista os ciclos de avaliacao de uma empresa.
 * @param {{ empresaId: string, pagina: number, tamanhoPagina: number, status?: string }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({ empresaId, pagina = 1, tamanhoPagina = 20, status }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('ciclos_avaliacao')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('data_inicio', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar ciclos de avaliacao: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca um ciclo de avaliacao pelo id, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('ciclos_avaliacao').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar ciclo de avaliacao por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo ciclo de avaliacao (sempre com status inicial "planejado").
 * @param {{ empresaId: string, nome: string, dataInicio: string, dataFim: string, tipo: string }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, nome, dataInicio, dataFim, tipo }) {
  const { data, error } = await supabase
    .from('ciclos_avaliacao')
    .insert({
      empresa_id: empresaId,
      nome,
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo,
      status: 'planejado',
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar ciclo de avaliacao: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um ciclo de avaliacao, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('ciclos_avaliacao').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar ciclo de avaliacao: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  criar,
  atualizar,
};
