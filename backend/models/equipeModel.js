// ==========================================================================
// ARQUIVO: backend/models/equipeModel.js
// OBJETIVO: Unico ponto de comunicacao com as tabelas "equipes" e
//           "equipe_membros" no Supabase. Todas as consultas de listagem
//           sao filtradas por empresa_id via utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO = 'id, empresa_id, nome, lider_id, ativo, created_at, updated_at';

/**
 * Lista as equipes de uma empresa.
 * @param {{ empresaId: string, pagina: number, tamanhoPagina: number, ativo?: boolean }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({ empresaId, pagina = 1, tamanhoPagina = 20, ativo }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('equipes')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('nome', { ascending: true })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar equipes: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca uma equipe pelo id, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('equipes').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar equipe por id: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma equipe pelo nome dentro de uma empresa (checagem de
 * duplicidade). Comparacao case-insensitive.
 * @param {string} nome
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorNome(nome, empresaId) {
  let query = supabase.from('equipes').select(COLUNAS_PADRAO).ilike('nome', nome);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar equipe por nome: ${error.message}`);
  }

  return data;
}

/**
 * Cria uma nova equipe.
 * @param {{ empresaId: string, nome: string, liderId?: string }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, nome, liderId }) {
  const { data, error } = await supabase
    .from('equipes')
    .insert({
      empresa_id: empresaId,
      nome,
      lider_id: liderId || null,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar equipe: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza uma equipe, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('equipes').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar equipe: ${error.message}`);
  }

  return data;
}

/**
 * Lista os membros de uma equipe, com os dados basicos do colaborador
 * (join via relacionamento de chave estrangeira).
 * @param {string} equipeId
 * @returns {Promise<object[]>}
 */
async function listarMembros(equipeId) {
  const { data, error } = await supabase
    .from('equipe_membros')
    .select('id, colaborador_id, created_at, colaboradores(id, usuario_id, cpf, departamento_id, cargo_id, ativo)')
    .eq('equipe_id', equipeId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar membros da equipe: ${error.message}`);
  }

  return data;
}

/**
 * Verifica se um colaborador ja e membro de uma equipe.
 * @param {string} equipeId
 * @param {string} colaboradorId
 * @returns {Promise<object|null>}
 */
async function buscarMembro(equipeId, colaboradorId) {
  const { data, error } = await supabase
    .from('equipe_membros')
    .select('id, equipe_id, colaborador_id')
    .eq('equipe_id', equipeId)
    .eq('colaborador_id', colaboradorId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar membro da equipe: ${error.message}`);
  }

  return data;
}

/**
 * Adiciona um colaborador como membro de uma equipe.
 * @param {string} equipeId
 * @param {string} colaboradorId
 * @returns {Promise<object>}
 */
async function adicionarMembro(equipeId, colaboradorId) {
  const { data, error } = await supabase
    .from('equipe_membros')
    .insert({ equipe_id: equipeId, colaborador_id: colaboradorId })
    .select('id, equipe_id, colaborador_id, created_at')
    .single();

  if (error) {
    throw new Error(`Erro ao adicionar membro a equipe: ${error.message}`);
  }

  return data;
}

/**
 * Remove um colaborador de uma equipe.
 * @param {string} equipeId
 * @param {string} colaboradorId
 */
async function removerMembro(equipeId, colaboradorId) {
  const { error } = await supabase
    .from('equipe_membros')
    .delete()
    .eq('equipe_id', equipeId)
    .eq('colaborador_id', colaboradorId);

  if (error) {
    throw new Error(`Erro ao remover membro da equipe: ${error.message}`);
  }
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  buscarPorNome,
  criar,
  atualizar,
  listarMembros,
  buscarMembro,
  adicionarMembro,
  removerMembro,
};
