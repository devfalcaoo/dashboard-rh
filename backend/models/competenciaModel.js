// ==========================================================================
// ARQUIVO: backend/models/competenciaModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "competencias" no
//           Supabase. Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, categoria_id, nome, descricao, peso, ativo, created_at, updated_at';

/**
 * Lista as competencias de uma empresa.
 * @param {{ empresaId: string, pagina: number, tamanhoPagina: number, categoriaId?: string, ativo?: boolean }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({ empresaId, pagina = 1, tamanhoPagina = 20, categoriaId, ativo }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('competencias')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('nome', { ascending: true })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId);
  }
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar competencias: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca uma competencia pelo id, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('competencias').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar competencia por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria uma nova competencia.
 * @param {{ empresaId: string, categoriaId: string, nome: string, descricao?: string, peso?: number }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, categoriaId, nome, descricao, peso }) {
  const { data, error } = await supabase
    .from('competencias')
    .insert({
      empresa_id: empresaId,
      categoria_id: categoriaId,
      nome,
      descricao: descricao || null,
      peso: peso !== undefined && peso !== null ? peso : 1.0,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar competencia: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza uma competencia, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('competencias').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar competencia: ${error.message}`);
  }

  return data;
}

/**
 * Lista TODAS as competencias ativas de uma empresa, sem paginacao.
 * Usado pelo motor de avaliacao para validar se todas as competencias
 * obrigatorias foram avaliadas antes de permitir concluir uma avaliacao.
 * @param {string} empresaId
 * @returns {Promise<object[]>}
 */
async function listarTodasAtivas(empresaId) {
  let query = supabase
    .from('competencias')
    .select(COLUNAS_PADRAO)
    .eq('ativo', true)
    .order('nome', { ascending: true });

  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar todas as competencias ativas: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  listarTodasAtivas,
  buscarPorId,
  criar,
  atualizar,
};
