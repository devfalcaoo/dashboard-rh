// ==========================================================================
// ARQUIVO: backend/services/auditoriaService.js
// OBJETIVO: Centralizar a regra de registro de auditoria (quem fez o que,
//           quando, de onde). Qualquer Service que precise registrar uma
//           operacao de login, logout, criacao, alteracao, exclusao ou
//           falha deve chamar esta funcao, em vez de acessar o logModel
//           diretamente.
// ==========================================================================

const logModel = require('../models/logModel');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Registra uma operacao de auditoria.
 * @param {{
 *   empresaId?: string|null,
 *   usuarioId?: string|null,
 *   operacao: string,
 *   tabelaAfetada?: string|null,
 *   registroId?: string|null,
 *   ip?: string|null,
 *   detalhes?: object|null
 * }} parametros
 */
async function registrar(parametros) {
  const operacoesValidas = Object.values(OPERACOES_LOG);

  if (!operacoesValidas.includes(parametros.operacao)) {
    console.error(`Operacao de auditoria invalida: ${parametros.operacao}`);
    return;
  }

  await logModel.criar({
    empresaId: parametros.empresaId || null,
    usuarioId: parametros.usuarioId || null,
    operacao: parametros.operacao,
    tabelaAfetada: parametros.tabelaAfetada || null,
    registroId: parametros.registroId || null,
    ip: parametros.ip || null,
    detalhes: parametros.detalhes || null,
  });
}

/**
 * Extrai o IP real da requisicao, considerando proxies/load balancers.
 * @param {import('express').Request} req
 * @returns {string}
 */
function extrairIp(req) {
  const encaminhadoPor = req.headers['x-forwarded-for'];
  if (encaminhadoPor) {
    return encaminhadoPor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'desconhecido';
}

module.exports = {
  registrar,
  extrairIp,
};
