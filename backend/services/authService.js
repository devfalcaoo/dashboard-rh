// ==========================================================================
// ARQUIVO: backend/services/authService.js
// OBJETIVO: Toda a regra de negocio de autenticacao: login, logout,
//           recuperacao de senha e alteracao de senha. Esta camada
//           orquestra o Supabase Auth (via supabaseAuthClient e o client
//           administrativo de service_role) e a tabela "usuarios"
//           (via usuarioModel), alem de registrar auditoria de cada
//           operacao sensivel.
// ==========================================================================

const supabaseAuthClient = require('../config/supabaseAuthClient');
const supabaseAdmin = require('../config/supabaseClient');
const usuarioModel = require('../models/usuarioModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG } = require('../config/constantes');

/**
 * Realiza o login do usuario: autentica no Supabase Auth, valida se o
 * usuario existe e esta ativo na tabela "usuarios", atualiza o
 * ultimo_login e registra auditoria.
 *
 * @param {{ email: string, senha: string, ip: string }} parametros
 * @returns {Promise<{ usuario: object, sessao: object }>}
 */
async function login({ email, senha, ip }) {
  const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data?.session) {
    await auditoriaService.registrar({
      operacao: OPERACOES_LOG.FALHA,
      tabelaAfetada: 'usuarios',
      ip,
      detalhes: { motivo: 'credenciais invalidas', email },
    });
    throw new ErroAplicacao('E-mail ou senha invalidos.', 401);
  }

  const usuario = await usuarioModel.buscarPorId(data.user.id);

  if (!usuario) {
    await auditoriaService.registrar({
      operacao: OPERACOES_LOG.FALHA,
      tabelaAfetada: 'usuarios',
      ip,
      detalhes: { motivo: 'usuario autenticado no Auth mas sem registro em usuarios', email },
    });
    throw new ErroAplicacao(
      'Usuario autenticado, porem sem cadastro valido no sistema. Contate o administrador.',
      403
    );
  }

  if (!usuario.ativo) {
    await auditoriaService.registrar({
      empresaId: usuario.empresa_id,
      usuarioId: usuario.id,
      operacao: OPERACOES_LOG.FALHA,
      tabelaAfetada: 'usuarios',
      ip,
      detalhes: { motivo: 'usuario inativo' },
    });
    throw new ErroAplicacao('Usuario inativo. Contate o administrador da sua empresa.', 403);
  }

  await usuarioModel.atualizarUltimoLogin(usuario.id);

  await auditoriaService.registrar({
    empresaId: usuario.empresa_id,
    usuarioId: usuario.id,
    operacao: OPERACOES_LOG.LOGIN,
    tabelaAfetada: 'usuarios',
    registroId: usuario.id,
    ip,
  });

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresa_id,
    },
    sessao: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiraEm: data.session.expires_at,
    },
  };
}

/**
 * Realiza o logout do usuario, invalidando a sessao correspondente ao
 * token informado.
 *
 * @param {{ usuarioLogado: object, ip: string }} parametros
 */
async function logout({ usuarioLogado, ip }) {
  // auth.admin.signOut requer privilegios de service_role e invalida as
  // sessoes ativas do usuario no Supabase Auth.
  const { error } = await supabaseAdmin.auth.admin.signOut(usuarioLogado.id, 'global');

  if (error) {
    throw new ErroAplicacao('Nao foi possivel encerrar a sessao. Tente novamente.', 500);
  }

  await auditoriaService.registrar({
    empresaId: usuarioLogado.empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.LOGOUT,
    tabelaAfetada: 'usuarios',
    registroId: usuarioLogado.id,
    ip,
  });
}

/**
 * Dispara o fluxo de recuperacao de senha (envio de e-mail pelo Supabase
 * Auth). Por seguranca, a resposta ao cliente e sempre generica,
 * independente de o e-mail existir ou nao na base (evita enumeracao de
 * usuarios validos).
 *
 * @param {{ email: string, ip: string }} parametros
 */
async function recuperarSenha({ email, ip }) {
  const { error } = await supabaseAuthClient.auth.resetPasswordForEmail(email);

  // Mesmo em caso de erro, nao revelamos ao cliente se o e-mail existe.
  // Registramos internamente para fins de auditoria/depuracao.
  if (error) {
    await auditoriaService.registrar({
      operacao: OPERACOES_LOG.FALHA,
      tabelaAfetada: 'usuarios',
      ip,
      detalhes: { motivo: 'falha ao solicitar recuperacao de senha', email, erro: error.message },
    });
  } else {
    await auditoriaService.registrar({
      operacao: OPERACOES_LOG.ALTERACAO,
      tabelaAfetada: 'usuarios',
      ip,
      detalhes: { motivo: 'solicitacao de recuperacao de senha', email },
    });
  }
}

/**
 * Altera a senha do usuario autenticado.
 *
 * @param {{ usuarioLogado: object, novaSenha: string, ip: string }} parametros
 */
async function alterarSenha({ usuarioLogado, novaSenha, ip }) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(usuarioLogado.id, {
    password: novaSenha,
  });

  if (error) {
    throw new ErroAplicacao('Nao foi possivel alterar a senha. Tente novamente.', 500);
  }

  await auditoriaService.registrar({
    empresaId: usuarioLogado.empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'usuarios',
    registroId: usuarioLogado.id,
    ip,
    detalhes: { motivo: 'alteracao de senha' },
  });
}

module.exports = {
  login,
  logout,
  recuperarSenha,
  alterarSenha,
};
