// ==========================================================================
// ARQUIVO: backend/services/auditoriaConsultaService.js
// OBJETIVO: Regra de negocio de CONSULTA aos logs de auditoria (diferente
//           de services/auditoriaService.js, que trata apenas do REGISTRO
//           dos logs). Uso: RH e Administrador da Empresa consultam os
//           logs da propria empresa; Administrador Geral consulta os logs
//           de TODAS as empresas (SAD, Matriz de Permissoes, secao 8).
// ==========================================================================

const logModel = require('../models/logModel');
const { PERFIS } = require('../config/constantes');

/**
 * Lista os logs de auditoria, respeitando o escopo de cada perfil.
 */
async function listar({ empresaId, usuarioLogado, pagina, tamanhoPagina, usuarioId, operacao, tabelaAfetada }) {
  // Administrador Geral enxerga logs de todas as empresas (empresaId nao
  // e aplicado como filtro); os demais perfis autorizados a acessar esta
  // rota (RH, Administrador da Empresa - validado no permissaoMiddleware)
  // ficam restritos a propria empresa.
  const empresaParaFiltrar = usuarioLogado.perfil === PERFIS.ADMINISTRADOR_GERAL ? undefined : empresaId;

  return logModel.listar({
    empresaId: empresaParaFiltrar,
    pagina,
    tamanhoPagina,
    usuarioId,
    operacao,
    tabelaAfetada,
  });
}

module.exports = {
  listar,
};
