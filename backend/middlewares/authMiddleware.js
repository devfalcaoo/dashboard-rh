// ==========================================================================
// ARQUIVO: backend/middlewares/authMiddleware.js
// OBJETIVO: Validar o token JWT (Supabase Auth) enviado no header
//           "Authorization: Bearer <token>", identificar o usuario
//           correspondente na tabela "usuarios" e anexar essas
//           informacoes em "req.usuarioLogado" para uso pelas camadas
//           seguintes (empresaMiddleware, permissaoMiddleware, Controllers,
//           Services).
//
// Este middleware NAO decide se o usuario pode ou nao acessar a rota
// (isso e responsabilidade do permissaoMiddleware) - ele apenas garante
// que sabemos QUEM esta fazendo a requisicao.
// ==========================================================================

const supabaseAuthClient = require('../config/supabaseAuthClient');
const usuarioModel = require('../models/usuarioModel');
const auditoriaService = require('./../services/auditoriaService');
const { respostaErro } = require('../utils/respostaPadrao');
const { OPERACOES_LOG } = require('../config/constantes');

async function authMiddleware(req, res, next) {
  try {
    const cabecalhoAuth = req.headers.authorization;

    if (!cabecalhoAuth || !cabecalhoAuth.startsWith('Bearer ')) {
      return respostaErro(res, 'Token de autenticacao nao informado.', {}, 401);
    }

    const token = cabecalhoAuth.replace('Bearer ', '').trim();

    // Valida o token diretamente com o Supabase Auth
    const { data, error } = await supabaseAuthClient.auth.getUser(token);

    if (error || !data?.user) {
      await auditoriaService.registrar({
        operacao: OPERACOES_LOG.FALHA,
        tabelaAfetada: 'usuarios',
        ip: auditoriaService.extrairIp(req),
        detalhes: { motivo: 'token invalido ou expirado' },
      });
      return respostaErro(res, 'Sessao invalida ou expirada. Faca login novamente.', {}, 401);
    }

    // Busca os dados de negocio do usuario (perfil, empresa, status)
    const usuario = await usuarioModel.buscarPorId(data.user.id);

    if (!usuario) {
      return respostaErro(
        res,
        'Usuario autenticado, porem sem cadastro valido no sistema.',
        {},
        403
      );
    }

    if (!usuario.ativo) {
      return respostaErro(res, 'Usuario inativo. Contate o administrador.', {}, 403);
    }

    // Anexa o usuario logado a requisicao, no formato usado pelo
    // restante da aplicacao (camelCase)
    req.usuarioLogado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresa_id,
    };

    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = authMiddleware;
