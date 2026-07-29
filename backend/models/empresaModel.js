// ==========================================================================
// ARQUIVO: backend/models/empresaModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "empresas" no
//           Supabase. A tabela "empresas" e a unica tabela de negocio que
//           NAO possui "empresa_id" (ela propria e a unidade de escopo),
//           por isso nao usa utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');

const COLUNAS_PADRAO = 'id, razao_social, cnpj, plano, ativo, created_at, updated_at';

/**
 * Busca uma empresa pelo id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id) {
  const { data, error } = await supabase
    .from('empresas')
    .select(COLUNAS_PADRAO)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar empresa por id: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma empresa pelo CNPJ (usado para checar duplicidade).
 * @param {string} cnpj
 * @returns {Promise<object|null>}
 */
async function buscarPorCnpj(cnpj) {
  const { data, error } = await supabase
    .from('empresas')
    .select(COLUNAS_PADRAO)
    .eq('cnpj', cnpj)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar empresa por cnpj: ${error.message}`);
  }

  return data;
}

/**
 * Lista todas as empresas (uso exclusivo do Administrador Geral),
 * com paginacao simples e filtro opcional por status.
 * @param {{ pagina: number, tamanhoPagina: number, ativo?: boolean }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listar({ pagina = 1, tamanhoPagina = 20, ativo } = {}) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('empresas')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar empresas: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Cria uma nova empresa.
 * @param {{ razaoSocial: string, cnpj: string, plano?: string }} dados
 * @returns {Promise<object>}
 */
async function criar({ razaoSocial, cnpj, plano }) {
  const { data, error } = await supabase
    .from('empresas')
    .insert({
      razao_social: razaoSocial,
      cnpj,
      plano: plano || 'padrao',
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar empresa: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza os dados de uma empresa (uso do Administrador Geral, ou
 * atualizacao restrita de "razao_social" feita pelo proprio Admin da
 * Empresa/RH atraves de usuarioEmpresaService).
 * @param {string} id
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, camposParaAtualizar) {
  const { data, error } = await supabase
    .from('empresas')
    .update(camposParaAtualizar)
    .eq('id', id)
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar empresa: ${error.message}`);
  }

  return data;
}

module.exports = {
  buscarPorId,
  buscarPorCnpj,
  listar,
  criar,
  atualizar,
};
