// ==========================================================================
// ARQUIVO: backend/models/avaliacaoModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "avaliacoes" no
//           Supabase. Todas as consultas sao filtradas por empresa_id via
//           utils/escopoEmpresa.js.
//
// OBSERVACAO IMPORTANTE: a coluna "nota_final" e calculada automaticamente
// por uma trigger no banco (trg_calcula_nota_final_avaliacao) sempre que
// os itens de avaliacao (avaliacao_itens) sao alterados. Este Model nunca
// escreve diretamente em "nota_final".
// ==========================================================================

const supabase = require('../config/supabaseClient');
const { aplicarFiltroEmpresa } = require('../utils/escopoEmpresa');

const COLUNAS_PADRAO =
  'id, ciclo_id, empresa_id, colaborador_id, avaliador_id, tipo, status, nota_final, data_conclusao, created_at, updated_at';

/**
 * Lista avaliacoes de uma empresa, com filtros opcionais.
 * @param {{
 *   empresaId: string, pagina: number, tamanhoPagina: number,
 *   cicloId?: string, colaboradorId?: string, avaliadorId?: string,
 *   tipo?: string, status?: string
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listar({
  empresaId,
  pagina = 1,
  tamanhoPagina = 20,
  cicloId,
  colaboradorId,
  avaliadorId,
  tipo,
  status,
}) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('avaliacoes')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(de, ate);

  query = aplicarFiltroEmpresa(query, empresaId);

  if (cicloId) query = query.eq('ciclo_id', cicloId);
  if (colaboradorId) query = query.eq('colaborador_id', colaboradorId);
  if (avaliadorId) query = query.eq('avaliador_id', avaliadorId);
  if (tipo) query = query.eq('tipo', tipo);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar avaliacoes: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Lista TODAS as avaliacoes de uma empresa, sem paginacao, com filtro
 * opcional por ciclo. Uso: agregacoes do Dashboard (medias, ranking,
 * contagens), onde e necessario processar o conjunto completo de dados.
 * @param {{ empresaId: string, cicloId?: string }} opcoes
 * @returns {Promise<object[]>}
 */
async function listarTodasPorEmpresa({ empresaId, cicloId }) {
  let query = supabase.from('avaliacoes').select(COLUNAS_PADRAO);
  query = aplicarFiltroEmpresa(query, empresaId);

  if (cicloId) query = query.eq('ciclo_id', cicloId);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar todas as avaliacoes da empresa: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma avaliacao pelo id, restrita a empresa informada.
 * @param {string} id
 * @param {string} empresaId
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id, empresaId) {
  let query = supabase.from('avaliacoes').select(COLUNAS_PADRAO).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar avaliacao por id: ${error.message}`);
  }

  return data;
}

/**
 * Verifica se ja existe uma avaliacao com a mesma combinacao de
 * ciclo + colaborador + avaliador + tipo (evita duplicidade).
 * @param {{ cicloId: string, colaboradorId: string, avaliadorId: string, tipo: string, empresaId: string }} parametros
 * @returns {Promise<object|null>}
 */
async function buscarExistente({ cicloId, colaboradorId, avaliadorId, tipo, empresaId }) {
  let query = supabase
    .from('avaliacoes')
    .select(COLUNAS_PADRAO)
    .eq('ciclo_id', cicloId)
    .eq('colaborador_id', colaboradorId)
    .eq('avaliador_id', avaliadorId)
    .eq('tipo', tipo);

  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Erro ao verificar avaliacao existente: ${error.message}`);
  }

  return data;
}

/**
 * Cria varias avaliacoes de uma vez (insercao em lote), usado pelo motor
 * de geracao automatica de avaliacoes ao abrir um ciclo.
 * @param {Array<{ cicloId: string, empresaId: string, colaboradorId: string, avaliadorId: string, tipo: string }>} listaAvaliacoes
 * @returns {Promise<object[]>}
 */
async function criarEmLote(listaAvaliacoes) {
  if (listaAvaliacoes.length === 0) {
    return [];
  }

  const registros = listaAvaliacoes.map((item) => ({
    ciclo_id: item.cicloId,
    empresa_id: item.empresaId,
    colaborador_id: item.colaboradorId,
    avaliador_id: item.avaliadorId,
    tipo: item.tipo,
    status: 'pendente',
  }));

  const { data, error } = await supabase.from('avaliacoes').insert(registros).select(COLUNAS_PADRAO);

  if (error) {
    throw new Error(`Erro ao criar avaliacoes em lote: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza uma avaliacao (ex: status, data_conclusao), restrita a empresa.
 * Nunca deve receber "nota_final" (calculada por trigger no banco).
 * @param {string} id
 * @param {string} empresaId
 * @param {object} camposParaAtualizar
 * @returns {Promise<object>}
 */
async function atualizar(id, empresaId, camposParaAtualizar) {
  let query = supabase.from('avaliacoes').update(camposParaAtualizar).eq('id', id);
  query = aplicarFiltroEmpresa(query, empresaId);

  const { data, error } = await query.select(COLUNAS_PADRAO).single();

  if (error) {
    throw new Error(`Erro ao atualizar avaliacao: ${error.message}`);
  }

  return data;
}

/**
 * Conta quantas avaliacoes de um ciclo NAO estao com status "concluida".
 * Usado para decidir se o ciclo pode ser encerrado sem justificativa.
 * @param {string} cicloId
 * @param {string} empresaId
 * @returns {Promise<number>}
 */
async function contarPendentesDoCiclo(cicloId, empresaId) {
  let query = supabase
    .from('avaliacoes')
    .select('id', { count: 'exact', head: true })
    .eq('ciclo_id', cicloId)
    .neq('status', 'concluida');

  query = aplicarFiltroEmpresa(query, empresaId);

  const { count, error } = await query;

  if (error) {
    throw new Error(`Erro ao contar avaliacoes pendentes do ciclo: ${error.message}`);
  }

  return count || 0;
}

module.exports = {
  listar,
  listarTodasPorEmpresa,
  buscarPorId,
  buscarExistente,
  criarEmLote,
  atualizar,
  contarPendentesDoCiclo,
};
