// ==========================================================================
// ARQUIVO: backend/services/usuarioService.js
// OBJETIVO: Toda a regra de negocio de gerenciamento de usuarios internos
//           de uma empresa. Uso: Administrador da Empresa e RH.
//
// REGRA DE SEGURANCA CRITICA:
//   Nenhum ator pode criar ou promover um usuario para um perfil de nivel
//   igual ou superior ao seu proprio, EXCETO o Administrador da Empresa,
//   que pode criar outros Administradores da Empresa. O perfil
//   "administrador_geral" NUNCA pode ser criado por esta rota (e
//   provisionado apenas via processo interno da Anthropic/software house,
//   fora do escopo desta API).
// ==========================================================================

const supabaseAdmin = require('../config/supabaseClient');
const usuarioModel = require('../models/usuarioModel');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG, PERFIS } = require('../config/constantes');

/**
 * Retorna a lista de perfis que o perfil informado tem permissao de
 * atribuir a outro usuario (na criacao ou na alteracao).
 * @param {string} perfilDoAtor
 * @returns {string[]}
 */
function obterPerfisAtribuiveis(perfilDoAtor) {
  if (perfilDoAtor === PERFIS.ADMINISTRADOR_EMPRESA) {
    return [
      PERFIS.ADMINISTRADOR_EMPRESA,
      PERFIS.RH,
      PERFIS.GESTOR,
      PERFIS.LIDER,
      PERFIS.COLABORADOR,
    ];
  }

  if (perfilDoAtor === PERFIS.RH) {
    return [PERFIS.RH, PERFIS.GESTOR, PERFIS.LIDER, PERFIS.COLABORADOR];
  }

  // Nenhum outro perfil tem acesso a esta rota (garantido tambem pelo
  // permissaoMiddleware nas rotas), mas mantemos a defesa em profundidade.
  return [];
}

/**
 * Lista os usuarios da empresa do usuario logado.
 */
async function listar({ empresaId, pagina, tamanhoPagina, perfil, ativo }) {
  return usuarioModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, perfil, ativo });
}

/**
 * Busca um usuario especifico, restrito a empresa do usuario logado.
 */
async function buscarPorId({ id, empresaId }) {
  const usuario = await usuarioModel.buscarPorIdNaEmpresa(id, empresaId);
  if (!usuario) {
    throw new ErroAplicacao('Usuario nao encontrado.', 404);
  }
  return usuario;
}

/**
 * Cria um novo usuario: primeiro no Supabase Auth (identidade de login),
 * depois na tabela "usuarios" (dados de negocio: perfil, empresa).
 */
async function criar({ nome, email, perfil, senhaTemporaria, empresaId, usuarioLogado, ip }) {
  const perfisPermitidos = obterPerfisAtribuiveis(usuarioLogado.perfil);

  if (!perfisPermitidos.includes(perfil)) {
    throw new ErroAplicacao(
      `Seu perfil nao tem permissao para cadastrar usuarios com o perfil "${perfil}".`,
      403
    );
  }

  const usuarioExistente = await usuarioModel.buscarPorEmail(email);
  if (usuarioExistente) {
    throw new ErroAplicacao('Ja existe um usuario cadastrado com este e-mail.', 409);
  }

  // 1) Cria a identidade de autenticacao no Supabase Auth
  const { data: dadosAuth, error: erroAuth } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senhaTemporaria,
    email_confirm: true,
  });

  if (erroAuth || !dadosAuth?.user) {
    throw new ErroAplicacao(
      `Nao foi possivel criar a credencial de acesso do usuario: ${erroAuth?.message || 'erro desconhecido'}`,
      400
    );
  }

  // 2) Cria o registro de negocio na tabela "usuarios", vinculado ao
  //    mesmo id gerado no Auth
  let usuarioCriado;
  try {
    usuarioCriado = await usuarioModel.criar({
      id: dadosAuth.user.id,
      empresaId,
      nome,
      email,
      perfil,
    });
  } catch (erroAoInserir) {
    // Rollback manual: se falhar ao gravar em "usuarios", remove a
    // identidade ja criada no Auth para nao deixar usuario orfao.
    await supabaseAdmin.auth.admin.deleteUser(dadosAuth.user.id);
    throw new ErroAplicacao(`Erro ao concluir o cadastro do usuario: ${erroAoInserir.message}`, 500);
  }

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'usuarios',
    registroId: usuarioCriado.id,
    ip,
    detalhes: { nome, email, perfil },
  });

  return usuarioCriado;
}

/**
 * Atualiza os dados de um usuario (nome e/ou perfil e/ou status).
 * Restricoes de seguranca:
 *  - Ninguem pode alterar o proprio perfil ou o proprio status (evita
 *    auto-promocao e auto-bloqueio acidental).
 *  - So e possivel atribuir perfis dentro do que o ator tem permissao.
 */
async function atualizar({ id, empresaId, nome, perfil, ativo, usuarioLogado, ip }) {
  const usuario = await usuarioModel.buscarPorIdNaEmpresa(id, empresaId);
  if (!usuario) {
    throw new ErroAplicacao('Usuario nao encontrado.', 404);
  }

  if (id === usuarioLogado.id && (perfil !== undefined || ativo !== undefined)) {
    throw new ErroAplicacao('Voce nao pode alterar seu proprio perfil ou status.', 403);
  }

  if (perfil !== undefined) {
    const perfisPermitidos = obterPerfisAtribuiveis(usuarioLogado.perfil);
    if (!perfisPermitidos.includes(perfil)) {
      throw new ErroAplicacao(
        `Seu perfil nao tem permissao para atribuir o perfil "${perfil}".`,
        403
      );
    }
  }

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (perfil !== undefined) camposParaAtualizar.perfil = perfil;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const usuarioAtualizado = await usuarioModel.atualizar(id, empresaId, camposParaAtualizar);

  // Se o usuario foi inativado, encerramos tambem a sessao dele no Auth
  if (ativo === false) {
    await supabaseAdmin.auth.admin.signOut(id, 'global').catch(() => {
      // Falha ao encerrar sessao nao deve impedir a inativacao do
      // cadastro; o empresaMiddleware/authMiddleware ja bloqueiam o
      // acesso de usuarios inativos em requisicoes futuras.
    });
  }

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'usuarios',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return usuarioAtualizado;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
};
