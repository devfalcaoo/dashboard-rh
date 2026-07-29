// ==========================================================================
// ARQUIVO: backend/models/usuarioModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "usuarios" no
//           Supabase. Nenhuma regra de negocio deve existir aqui - apenas
//           consultas e comandos de persistencia. Toda consulta que lista
//           multiplos usuarios aplica o isolamento multiempresa via
//           utils/escopoEmpresa.js.
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO = 'id, empresa_id, nome, email, perfil, ativo, ultimo_login, created_at, updated_at';

/**
 * Busca um usuario pelo seu id (mesmo id do auth.users do Supabase Auth).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(COLUNAS_PADRAO)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar usuario por id: ${error.message}`);
  }

  return data;
}

/**
 * Busca um usuario pelo id, mas apenas se pertencer a empresa informada
 * (usado pelos Services para impedir acesso cruzado entre empresas).
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorIdNaEmpresa(id, empresaId) {
  let query = supabase.from('usuarios').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar usuario por id na empresa: ${error.message}`);
  }

  return data;
}

/**
 * Busca um usuario pelo e-mail (uso interno, ex: checar duplicidade).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function buscarPorEmail(email) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(COLUNAS_PADRAO)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar usuario por email: ${error.message}`);
  }

  return data;
}

/**
 * Lista os usuarios de uma empresa, com paginacao simples e filtro
 * opcional por perfil/status.
 * @param {{ empresaId: string, pagina: number, tamanhoPagina: number, perfil?: string, ativo?: boolean }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorEmpresa({ empresaId, pagina = 1, tamanhoPagina = 20, perfil, ativo }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('usuarios')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (perfil) {
    query = query.eq('perfil', perfil);
  }
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar usuarios da empresa: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Insere o registro de negocio do usuario na tabela "usuarios".
 * O "id" deve ser o mesmo id ja criado no Supabase Auth.
 * @param {{ id: string, empresaId: string, nome: string, email: string, perfil: string }} dados
 * @returns {Promise<object>}
 */
async function criar({ id, empresaId, nome, email, perfil }) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      id,
      empresa_id: empresaId,
      nome,
      email,
      perfil,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar usuario: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza os dados de um usuario, sempre restrito a sua propria empresa.
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar - ja no formato snake_case do banco
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('usuarios').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar usuario: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza a data/hora do ultimo login do usuario.
 * @param {string} id
 */
async function atualizarUltimoLogin(id) {
  const { error } = await supabase
    .from('usuarios')
    .update({ ultimo_login: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao atualizar ultimo_login: ${error.message}`);
  }
}

module.exports = {
  buscarPorId,
  buscarPorIdNaEmpresa,
  buscarPorEmail,
  listarPorEmpresa,
  criar,
  atualizar,
  atualizarUltimoLogin,
};
