// ==========================================================================
// ARQUIVO: backend/models/logModel.js
// OBJETIVO: Unico ponto de comunicacao com a tabela "logs" (auditoria de
//           negocio) no Supabase. Nenhuma regra de negocio deve existir
//           aqui - apenas a insercao do registro de auditoria.
// ==========================================================================

const supabase = require('../config/supabaseClient');

const COLUNAS_PADRAO =
  'id, empresa_id, usuario_id, operacao, tabela_afetada, registro_id, ip, data_hora, detalhes';

/**
 * Lista os logs de auditoria. Se "empresaId" for informado, restringe a
 * consulta a essa empresa (uso: RH/Administrador da Empresa). Se for
 * omitido, retorna logs de TODAS as empresas (uso exclusivo do
 * Administrador Geral - a checagem de quem pode omitir esse filtro e
 * feita na camada de Service).
 *
 * @param {{
 *   empresaId?: string|null, pagina: number, tamanhoPagina: number,
 *   usuarioId?: string, operacao?: string, tabelaAfetada?: string
 * }} opcoes
 * @returns {Promise<{ registros: object[], total: number }>}
 */
async function listar({ empresaId, pagina = 1, tamanhoPagina = 50, usuarioId, operacao, tabelaAfetada }) {
  const de = (pagina - 1) * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase
    .from('logs')
    .select(COLUNAS_PADRAO, { count: 'exact' })
    .order('data_hora', { ascending: false })
    .range(de, ate);

  if (empresaId) query = query.eq('empresa_id', empresaId);
  if (usuarioId) query = query.eq('usuario_id', usuarioId);
  if (operacao) query = query.eq('operacao', operacao);
  if (tabelaAfetada) query = query.eq('tabela_afetada', tabelaAfetada);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar logs de auditoria: ${error.message}`);
  }

  return { registros: data, total: count };
}

/**
 * Insere um novo registro de auditoria na tabela "logs".
 * @param {{
 *   empresaId: string|null,
 *   usuarioId: string|null,
 *   operacao: string,
 *   tabelaAfetada: string|null,
 *   registroId: string|null,
 *   ip: string|null,
 *   detalhes: object|null
 * }} dadosLog
 */
async function criar(dadosLog) {
  const { error } = await supabase.from('logs').insert({
    empresa_id: dadosLog.empresaId || null,
    usuario_id: dadosLog.usuarioId || null,
    operacao: dadosLog.operacao,
    tabela_afetada: dadosLog.tabelaAfetada || null,
    registro_id: dadosLog.registroId || null,
    ip: dadosLog.ip || null,
    detalhes: dadosLog.detalhes || null,
  });

  if (error) {
    // Falha ao gravar auditoria nao deve derrubar o fluxo principal da
    // requisicao, mas precisa ficar visivel para investigacao.
    console.error('Falha ao gravar log de auditoria:', error.message);
  }
}

module.exports = {
  listar,
  criar,
};
