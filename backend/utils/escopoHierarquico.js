// ==========================================================================
// ARQUIVO: backend/utils/escopoHierarquico.js
// OBJETIVO: Centralizar a regra de escopo hierarquico usada por multiplos
//           Services (feedbacks, PDIs, e futuramente metas/dashboard):
//           definir se um usuario com perfil Lider/Gestor tem permissao
//           de agir sobre um colaborador especifico, com base na relacao
//           lider_id/gestor_id. RH tem sempre acesso irrestrito dentro da
//           propria empresa (ja garantido pelo empresaMiddleware).
// ==========================================================================

const { PERFIS } = require('../config/constantes');

/**
 * Verifica se o usuario logado (dado seu perfil e o id do seu proprio
 * colaborador) tem permissao de agir sobre o colaborador-alvo.
 *
 * @param {{
 *   perfil: string,
 *   colaboradorAutorId: string,
 *   colaboradorAlvo: { id: string, lider_id: string|null, gestor_id: string|null }
 * }} parametros
 * @returns {boolean}
 */
function estaNoEscopoHierarquico({ perfil, colaboradorAutorId, colaboradorAlvo }) {
  if (perfil === PERFIS.RH) {
    // RH tem acesso irrestrito a qualquer colaborador da propria empresa.
    return true;
  }

  if (perfil === PERFIS.LIDER) {
    return colaboradorAlvo.lider_id === colaboradorAutorId;
  }

  if (perfil === PERFIS.GESTOR) {
    return colaboradorAlvo.gestor_id === colaboradorAutorId;
  }

  return false;
}

module.exports = {
  estaNoEscopoHierarquico,
};
