// ==========================================================================
// ARQUIVO: backend/models/colaboradorModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "colaboradores" no
//           Supabase. Todas as consultas de listagem/busca sao filtradas
//           por empresa_id via utils/escopoEmpresa.js. A checagem de CPF
//           duplicado e feita de forma global (nao apenas na empresa),
//           pois CPF e um documento unico por pessoa fisica.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, usuario_id, empresa_id, cpf, telefone, data_admissao, departamento_id, cargo_id, lider_id, gestor_id, ativo, created_at, updated_at';

/**
 * Lista os colaboradores de uma empresa, com paginacao e filtros.
 * @param {{
 *   empresaId: string, pagina: number, tamanhoPagina: number,
 *   departamentoId?: string, cargoId?: string, liderId?: string, ativo?: boolean
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({
  empresaId,
  pagina = 1,
  tamanhoPagina = 20,
  departamentoId,
  cargoId,
  liderId,
  ativo,
}) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('colaboradores')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (departamentoId) query = query.eq('departamento_id', departamentoId);
  if (cargoId) query = query.eq('cargo_id', cargoId);
  if (liderId) query = query.eq('lider_id', liderId);
  if (ativo !== undefined) query = query.eq('ativo', ativo);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar colaboradores: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Busca um colaborador pelo id, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('colaboradores').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar colaborador por id: ${error.message}`);
  }

  return data;
}

/**
 * Busca um colaborador pelo usuario_id, restrito a empresa informada.
 * Usado para checar se um usuario ja possui registro de colaborador.
 * @param {string} usuarioId
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorUsuarioId(usuarioId, empresaId) {
  let query = supabase.from('colaboradores').select(COLUNAS_PADRAO).eq('usuario_id', usuarioId);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar colaborador por usuario_id: ${error.message}`);
  }

  return data;
}

/**
 * Busca um colaborador pelo CPF, de forma GLOBAL (nao restrita a uma
 * empresa), pois o CPF e unico por pessoa fisica em toda a base.
 * @param {string} cpf
 * @returns {Promise<object|null>}
 */
async function buscarPorCpf(cpf) {
  const { data, error } = await supabase
    .from('colaboradores')
    .select(COLUNAS_PADRAO)
    .eq('cpf', cpf)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar colaborador por cpf: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo colaborador.
 * @param {object} dados
 * @returns {Promise<object>}
 */
async function criar({
  usuarioId,
  empresaId,
  cpf,
  telefone,
  dataAdmissao,
  departamentoId,
  cargoId,
  liderId,
  gestorId,
}) {
  const { data, error } = await supabase
    .from('colaboradores')
    .insert({
      usuario_id: usuarioId,
      empresa_id: empresaId,
      cpf,
      telefone: telefone || null,
      data_admissao: dataAdmissao || null,
      departamento_id: departamentoId || null,
      cargo_id: cargoId || null,
      lider_id: liderId || null,
      gestor_id: gestorId || null,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar colaborador: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um colaborador, restrito a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('colaboradores').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar colaborador: ${error.message}`);
  }

  return data;
}

/**
 * Lista TODOS os colaboradores de uma empresa que atendam aos filtros,
 * sem paginacao. Usado pelo motor de geracao automatica de avaliacoes
 * (precisa varrer toda a base de colaboradores ativos de uma vez) e para
 * localizar pares/subordinados de um lider.
 * @param {{ empresaId: string, liderId?: string, ativo?: boolean }} opcoes
 * @returns {Promise<object[]>}
 */
async function listarTodosPorFiltro({ empresaId, liderId, ativo }) {
  let query = supabase.from('colaboradores').select(COLUNAS_PADRAO);
  query = aplicarFiltroEmpresa(query, empresaId);

  if (liderId) query = query.eq('lider_id', liderId);
  if (ativo !== undefined) query = query.eq('ativo', ativo);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar colaboradores por filtro: ${error.message}`);
  }

  return data;
}

module.exports = {
  listarPorEmpresa,
  listarTodosPorFiltro,
  buscarPorId,
  buscarPorUsuarioId,
  buscarPorCpf,
  criar,
  atualizar,
};
