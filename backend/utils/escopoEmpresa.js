// ==========================================================================
// ARQUIVO: backend/utils/escopoEmpresa.js
// OBJETIVO: Centralizar a aplicacao do filtro de "empresa_id" em toda
//           consulta feita pelos Models a tabelas de negocio. Este e o
//           mecanismo central de isolamento multiempresa em nivel de
//           aplicacao (ver SAD, secao 15).
//
// REGRA: nenhum Model pode montar uma query em tabela de negocio sem
//        passar por esta funcao (exceto tabelas verdadeiramente globais,
//        como "empresas", que sao geridas apenas pelo Administrador Geral).
// ==========================================================================

/**
 * Aplica o filtro obrigatorio de empresa_id a uma query do Supabase.
 *
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {string} empresaId
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
function aplicarFiltroEmpresa(query, empresaId) {
  if (!empresaId) {
    throw new Error(
      'escopoEmpresa: empresaId obrigatorio e nao foi informado. ' +
        'Toda consulta de negocio deve ser filtrada por empresa.'
    );
  }
  return query.eq('empresa_id', empresaId);
}

module.exports = {
  aplicarFiltroEmpresa,
};
