// ==========================================================================
// ARQUIVO: backend/models/pdiModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "pdis" (Planos de
//           Desenvolvimento Individual) no Supabase. Todas as consultas
//           sao filtradas por empresa_id via utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, colaborador_id, criado_por, objetivo, competencia_id, prazo, status, progresso, created_at, updated_at';

/**
 * Lista PDIs de uma empresa, com filtros opcionais.
 * @param {{
 *   empresaId: string, pagina: number, tamanhoPagina: number,
 *   colaboradorId?: string, competenciaId?: string, status?: string
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({
  empresaId,
  pagina = 1,
  tamanhoPagina = 20,
  colaboradorId,
  competenciaId,
  status,
}) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('pdis')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (colaboradorId) query = query.eq('colaborador_id', colaboradorId);
  if (competenciaId) query = query.eq('competencia_id', competenciaId);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar PDIs: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca um PDI pelo id, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('pdis').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar PDI por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo PDI.
 * @param {{
 *   empresaId: string, colaboradorId: string, criadoPor: string,
 *   objetivo: string, competenciaId: string, prazo?: string
 * }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, colaboradorId, criadoPor, objetivo, competenciaId, prazo }) {
  const { data, error } = await supabase
    .from('pdis')
    .insert({
      empresa_id: empresaId,
      colaborador_id: colaboradorId,
      criado_por: criadoPor,
      objetivo,
      competencia_id: competenciaId,
      prazo: prazo || null,
      status: 'nao_iniciado',
      progresso: 0,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar PDI: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um PDI, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('pdis').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar PDI: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  buscarPorId,
  criar,
  atualizar,
};
