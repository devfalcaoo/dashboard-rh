// ==========================================================================
// ARQUIVO: backend/middlewares/empresaMiddleware.js
// OBJETIVO: Garantir o isolamento multiempresa (multi-tenant) a nivel de
//           aplicacao. Deve ser executado SEMPRE apos o authMiddleware.
//
// Responsabilidades:
//  - Confirmar que a empresa do usuario logado existe e esta ativa
//    (exceto para o perfil "administrador_geral", que opera fora do
//    escopo de uma unica empresa).
//  - Disponibilizar "req.empresaId" para que Controllers/Services/Models
//    utilizem esse valor como filtro obrigatorio em toda consulta,
//    atraves do utilitario utils/escopoEmpresa.js (introduzido na Fase 3,
//    junto aos primeiros CRUDs de negocio).
// ==========================================================================

const empresaModel = require('../models/empresaModel');
const { respostaErro } = require('../utils/respostaPadrao');
const { PERFIS } = require('../config/constantes');

async function empresaMiddleware(req, res, next) {
  try {
    const usuarioLogado = req.usuarioLogado;

    if (!usuarioLogado) {
      // Este middleware pressupoe que authMiddleware ja rodou antes.
      return respostaErro(
        res,
        'Middleware de empresa executado sem usuario autenticado.',
        {},
        500
      );
    }

    // Administrador Geral opera acima do escopo de uma unica empresa
    // (gerencia todas as empresas clientes do SaaS).
    if (usuarioLogado.perfil === PERFIS.ADMINISTRADOR_GERAL) {
      req.empresaId = null;
      return next();
    }

    if (!usuarioLogado.empresaId) {
      return respostaErro(
        res,
        'Usuario nao possui empresa vinculada.',
        {},
        403
      );
    }

    const empresa = await empresaModel.buscarPorId(usuarioLogado.empresaId);

    if (!empresa) {
      return respostaErro(res, 'Empresa vinculada ao usuario nao foi encontrada.', {}, 403);
    }

    if (!empresa.ativo) {
      return respostaErro(
        res,
        'A empresa vinculada a este usuario esta inativa. Contate o suporte.',
        {},
        403
      );
    }

    req.empresaId = empresa.id;
    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = empresaMiddleware;
