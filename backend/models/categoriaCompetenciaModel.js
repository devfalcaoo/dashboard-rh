// ==========================================================================
// ARQUIVO: backend/models/categoriaCompetenciaModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "categorias_competencias"
//           no Supabase. Todas as consultas sao filtradas por empresa_id
//           via utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO = 'id, empresa_id, nome, descricao, ativo, created_at, updated_at';

/**
 * Lista as categorias de competencias de uma empresa.
 * @param {{ empresaId: string, pagina: number, tamanhoPagina: number, ativo?: boolean }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({ empresaId, pagina = 1, tamanhoPagina = 20, ativo }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('categorias_competencias')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('nome', { ascending: true })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar categorias de competencias: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca uma categoria pelo id, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('categorias_competencias').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar categoria por id: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma categoria pelo nome dentro de uma empresa (checagem de
 * duplicidade). Comparacao case-insensitive.
 * @param {string} nome
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorNome(nome, empresaId) {
  let query = supabase.from('categorias_competencias').select(COLUNAS_PADRAO).ilike('nome', nome);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar categoria por nome: ${error.message}`);
  }

  return data;
}

/**
 * Cria uma nova categoria de competencia.
 * @param {{ empresaId: string, nome: string, descricao?: string }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, nome, descricao }) {
  const { data, error } = await supabase
    .from('categorias_competencias')
    .insert({
      empresa_id: empresaId,
      nome,
      descricao: descricao || null,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar categoria de competencia: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza uma categoria, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('categorias_competencias').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar categoria de competencia: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  buscarPorNome,
  criar,
  atualizar,
};
