// ==========================================================================
// ARQUIVO: backend/middlewares/permissaoMiddleware.js
// OBJETIVO: Middleware de autorizacao (RBAC - Role Based Access Control).
//           Implementado como uma "fabrica de middlewares": recebe a lista
//           de perfis permitidos para uma rota e devolve o middleware
//           correspondente. Deve ser executado sempre apos authMiddleware
//           e empresaMiddleware.
//
// Este middleware trata apenas a pergunta generica:
//   "este PERFIL pode acessar esta ROTA?"
// Regras mais finas (ex: "este Lider so pode avaliar sua propria equipe")
// ficam na camada de Service, conforme definido no SAD (secao 14).
// ==========================================================================

const { respostaErro } = require('../utils/respostaPadrao');
const auditoriaService = require('../services/auditoriaService');
const { OPERACOES_LOG, LISTA_PERFIS } = require('../config/constantes');

/**
 * @param {string[]} perfisPermitidos - lista de perfis autorizados a acessar a rota
 * @returns {import('express').RequestHandler}
 */
function permissaoMiddleware(perfisPermitidos = []) {
  // Validacao defensiva feita uma unica vez, na montagem da rota,
  // garantindo que nenhum perfil invalido seja configurado por engano.
  const perfisInvalidos = perfisPermitidos.filter((perfil) => !LISTA_PERFIS.includes(perfil));
  if (perfisInvalidos.length > 0) {
    throw new Error(
      `permissaoMiddleware configurado com perfis invalidos: ${perfisInvalidos.join(', ')}`
    );
  }

  return async function verificarPermissao(req, res, next) {
    const usuarioLogado = req.usuarioLogado;

    if (!usuarioLogado) {
      return respostaErro(
        res,
        'Middleware de permissao executado sem usuario autenticado.',
        {},
        500
      );
    }

    if (!perfisPermitidos.includes(usuarioLogado.perfil)) {
      await auditoriaService.registrar({
        empresaId: usuarioLogado.empresaId,
        usuarioId: usuarioLogado.id,
        operacao: OPERACOES_LOG.FALHA,
        tabelaAfetada: null,
        ip: auditoriaService.extrairIp(req),
        detalhes: {
          motivo: 'acesso negado por perfil',
          rota: `${req.method} ${req.originalUrl}`,
          perfilDoUsuario: usuarioLogado.perfil,
          perfisPermitidos,
        },
      });

      return respostaErro(
        res,
        'Voce nao tem permissao para acessar este recurso.',
        {},
        403
      );
    }

    return next();
  };
}

module.exports = permissaoMiddleware;
