// ==========================================================================
// ARQUIVO: backend/controllers/authController.js
// OBJETIVO: Receber as requisicoes das rotas de autenticacao, delegar a
//           regra de negocio para authService e devolver a resposta no
//           padrao unico da API. Nenhuma regra de negocio ou acesso a
//           dados deve existir neste arquivo.
// ==========================================================================

const authService = require('../services/authService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const { validarLogin, validarRecuperarSenha, validarAlterarSenha } = require('../validators/authValidator');

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { valido, erros } = validarLogin(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados de login invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const resultado = await authService.login({ ...req.body, ip });

    return respostaSucesso(res, 'Login realizado com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * POST /api/auth/logout
 * Rota protegida - requer authMiddleware.
 */
async function logout(req, res, next) {
  try {
    const ip = auditoriaService.extrairIp(req);
    await authService.logout({ usuarioLogado: req.usuarioLogado, ip });

    return respostaSucesso(res, 'Logout realizado com sucesso.', {});
  } catch (erro) {
    return next(erro);
  }
}

/**
 * POST /api/auth/recuperar-senha
 */
async function recuperarSenha(req, res, next) {
  try {
    const { valido, erros } = validarRecuperarSenha(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    await authService.recuperarSenha({ email: req.body.email, ip });

    // Resposta sempre generica, por seguranca (evita enumeracao de e-mails)
    return respostaSucesso(
      res,
      'Se o e-mail informado estiver cadastrado, um link de recuperacao sera enviado.',
      {}
    );
  } catch (erro) {
    return next(erro);
  }
}

/**
 * POST /api/auth/alterar-senha
 * Rota protegida - requer authMiddleware.
 */
async function alterarSenha(req, res, next) {
  try {
    const { valido, erros } = validarAlterarSenha(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    await authService.alterarSenha({
      usuarioLogado: req.usuarioLogado,
      novaSenha: req.body.novaSenha,
      ip,
    });

    return respostaSucesso(res, 'Senha alterada com sucesso.', {});
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/auth/me
 * Rota protegida - retorna os dados do usuario autenticado (controle de sessao).
 */
async function me(req, res, next) {
  try {
    return respostaSucesso(res, 'Usuario autenticado.', { usuario: req.usuarioLogado });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  login,
  logout,
  recuperarSenha,
  alterarSenha,
  me,
};
