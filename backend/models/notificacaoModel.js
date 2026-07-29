// ==========================================================================
// ARQUIVO: backend/models/notificacaoModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "notificacoes" no
//           Supabase. Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
//
// OBSERVACAO: a tabela "notificacoes" nao possui coluna "updated_at" (ver
// docs/modelagem-banco.sql) - o unico campo mutavel e "lida".
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, empresa_id, usuario_id, titulo, mensagem, lida, tipo, link, created_at';

/**
 * Lista as notificacoes de um usuario especifico, dentro da empresa.
 * @param {{
 *   empresaId: string, usuarioId: string, pagina: number,
 *   tamanhoPagina: number, lida?: boolean
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listarPorUsuario({ empresaId, usuarioId, pagina = 1, tamanhoPagina = 20, lida }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('notificacoes')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (lida !== undefined) {
    query = query.eq('lida', lida);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar notificacoes: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Conta quantas notificacoes nao lidas um usuario possui.
 * @param {string} empresaId
 * @param {string} usuarioId
 * @returns {Promise<number>}
 */
async function contarNaoLidas(empresaId, usuarioId) {
  let query = supabase
    .from('notificacoes')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('lida', false);

  query = aplicarFiltroEmpresa(query, empresaId);

  const { count, error } = await query;

  if (error) {
    throw new Error(`Erro ao contar notificacoes nao lidas: ${error.message}`);
  }

  return count || 0;
}

/**
 * Busca uma notificacao pelo id, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('notificacoes').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar notificacao por id: ${error.message}`);
  }

  return data;
}

/**
 * Cria uma nova notificacao.
 * @param {{
 *   empresaId: string, usuarioId: string, titulo: string,
 *   mensagem: string, tipo?: string, link?: string
 * }} dados
 * @returns {Promise<object>}
 */
async function criar({ empresaId, usuarioId, titulo, mensagem, tipo, link }) {
  const { data, error } = await supabase
    .from('notificacoes')
    .insert({
      empresa_id: empresaId,
      usuario_id: usuarioId,
      titulo,
      mensagem,
      tipo: tipo || null,
      link: link || null,
      lida: false,
    })
    .select(COLUNAS_PADRAO)
    .single();

  if (error) {
    throw new Error(`Erro ao criar notificacao: ${error.message}`);
  }

  return data;
}

/**
 * Cria varias notificacoes de uma vez (uso: disparo em lote, ex: ao abrir
 * um ciclo de avaliacao, notificar todos os avaliadores de uma vez).
 * @param {Array<{ empresaId: string, usuarioId: string, titulo: string, mensagem: string, tipo?: string, link?: string }>} listaDeNotificacoes
 * @returns {Promise<object[]>}
 */
async function criarEmLote(listaDeNotificacoes) {
  if (listaDeNotificacoes.length === 0) {
    return [];
  }

  const registrosParaInserir = listaDeNotificacoes.map((notificacao) => ({
    empresa_id: notificacao.empresaId,
    usuario_id: notificacao.usuarioId,
    titulo: notificacao.titulo,
    mensagem: notificacao.mensagem,
    tipo: notificacao.tipo || null,
    link: notificacao.link || null,
    lida: false,
  }));

  const { data, error } = await supabase
    .from('notificacoes')
    .insert(registrosParaInserir)
    .select(COLUNAS_PADRAO);

  if (error) {
    throw new Error(`Erro ao criar notificacoes em lote: ${error.message}`);
  }

  return data;
}

/**
 * Marca uma notificacao especifica como lida.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object>}
 */
async function marcarComoLida(id, empresaId) {
  let query = supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao marcar notificacao como lida: ${error.message}`);
  }

  return data;
}

/**
 * Marca TODAS as notificacoes de um usuario como lidas.
 * @param {string} empresaId
 * @param {string} usuarioId
 * @returns {Promise<number>} quantidade de notificacoes atualizadas
 */
async function marcarTodasComoLidas(empresaId, usuarioId) {
  let query = supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', usuarioId)
    .eq('lida', false);

  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select('id');

  if (error) {
    throw new Error(`Erro ao marcar todas as notificacoes como lidas: ${error.message}`);
  }

  return data.length;
}

module.exports = {
  listarPorUsuario,
  contarNaoLidas,
  buscarPorId,
  criar,
  criarEmLote,
  marcarComoLida,
  marcarTodasComoLidas,
};
