// ==========================================================================
// ARQUIVO: backend/models/cargoModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "cargos" no Supabase.
//           Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, nome, nivel, departamento_id, ativo, created_at, updated_at';

/**
 * Lista os cargos de uma empresa.
 * @param {{ empresaId: string, pagina: number, tamanhoPagina: number, departamentoId?: string, ativo?: boolean }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({ empresaId, pagina = 1, tamanhoPagina = 20, departamentoId, ativo }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('cargos')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('nome', { ascending: true })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (departamentoId) {
    query = query.eq('departamento_id', departamentoId);
  }
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar cargos: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca um cargo pelo id, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('cargos').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar cargo por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo cargo.
 * @param {{ empresaId: string, nome: string, nivel?: string, departamentoId?: string }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, nome, nivel, departamentoId }) {
  const { data, error } = await supabase
    .from('cargos')
    .insert({
      empresa_id: empresaId,
      nome,
      nivel: nivel || null,
      departamento_id: departamentoId || null,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar cargo: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um cargo, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('cargos').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar cargo: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  criar,
  atualizar,
};
