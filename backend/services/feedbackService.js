// ==========================================================================
// ARQUIVO: backend/services/feedbackService.js
// OBJETIVO: Regra de negocio de feedbacks. Uso: RH, Gestor e Lider podem
//           REGISTRAR feedback (Gestor/Lider restritos ao seu escopo
//           hierarquico - ver utils/escopoHierarquico.js). Qualquer
//           colaborador pode VISUALIZAR os feedbacks que recebeu.
// ==========================================================================

const feedbackModel = require('../models/feedbackModel');
const colaboradorModel = require('../models/colaboradorModel');
const auditoriaService = require('./auditoriaService');
const notificacaoService = require('./notificacaoService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { estaNoEscopoHierarquico } = require('../utils/escopoHierarquico');
const { OPERACOES_LOG, PERFIS } = require('../config/constantes');

const PERFIS_COM_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

/**
 * Localiza o colaborador vinculado ao usuario logado. Lanca erro se nao
 * existir (ex: um Administrador da Empresa sem cadastro de colaborador).
 */
async function obterColaboradorDoUsuario(usuarioLogado, empresaId) {
  const colaborador = await colaboradorModel.buscarPorUsuarioId(usuarioLogado.id, empresaId);
  if (!colaborador) {
    throw new ErroAplicacao(
      'Seu usuario nao possui um cadastro de colaborador vinculado nesta empresa.',
      422
    );
  }
  return colaborador;
}

/**
 * Lista feedbacks da empresa com filtros livres. Uso: RH / Administrador
 * da Empresa (visao geral) ou Gestor/Lider (dentro do proprio escopo,
 * validado a nivel de aplicacao ao filtrar por colaboradorId).
 */
async function listar({ empresaId, pagina, tamanhoPagina, colaboradorId, autorId, tipo, ativo }) {
  return feedbackModel.listarPorEmpresa({
    empresaId,
    pagina,
    tamanhoPagina,
    colaboradorId,
    autorId,
    tipo,
    ativo,
  });
}

/**
 * Lista os feedbacks recebidos pelo proprio usuario logado (qualquer
 * perfil com colaborador vinculado).
 */
async function listarMeus({ empresaId, usuarioLogado, pagina, tamanhoPagina, tipo }) {
  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
  return feedbackModel.listarPorEmpresa({
    empresaId,
    pagina,
    tamanhoPagina,
    colaboradorId: colaborador.id,
    tipo,
    ativo: true,
  });
}

/**
 * Busca um feedback pelo id. Regras de acesso: RH/Administrador da
 * Empresa tem acesso total; demais perfis somente se forem o autor ou o
 * colaborador destinatario do feedback.
 */
async function buscarPorId({ id, empresaId, usuarioLogado }) {
  const feedback = await feedbackModel.buscarPorId(id, empresaId);
  if (!feedback) {
    throw new ErroAplicacao('Feedback nao encontrado.', 404);
  }

  if (!PERFIS_COM_VISAO_GERAL.includes(usuarioLogado.perfil)) {
    const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    const podeVisualizar =
      colaborador.id === feedback.colaborador_id || colaborador.id === feedback.autor_id;

    if (!podeVisualizar) {
      throw new ErroAplicacao('Voce nao tem permissao para visualizar este feedback.', 403);
    }
  }

  return feedback;
}

/**
 * Cria um novo feedback. Gestor/Lider so podem registrar feedback para
 * colaboradores dentro do seu escopo hierarquico direto.
 */
async function criar({ empresaId, colaboradorId, tipo, mensagem, avaliacaoId, usuarioLogado, ip }) {
  const colaboradorAlvo = await colaboradorModel.buscarPorId(colaboradorId, empresaId);
  if (!colaboradorAlvo) {
    throw new ErroAplicacao('Colaborador informado nao foi encontrado nesta empresa.', 422);
  }

  const autor = await obterColaboradorDoUsuario(usuarioLogado, empresaId);

  const noEscopo = estaNoEscopoHierarquico({
    perfil: usuarioLogado.perfil,
    colaboradorAutorId: autor.id,
    colaboradorAlvo,
  });

  if (!noEscopo) {
    throw new ErroAplicacao(
      'Voce so pode registrar feedback para colaboradores dentro do seu escopo (sua equipe ou area).',
      403
    );
  }

  const feedbackCriado = await feedbackModel.criar({
    empresaId,
    colaboradorId,
    autorId: autor.id,
    tipo,
    mensagem,
    avaliacaoId,
  });

  await notificacaoService.notificarFeedbackRecebido({
    empresaId,
    usuarioIdDestinatario: colaboradorAlvo.usuario_id,
    feedbackId: feedbackCriado.id,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'feedbacks',
    registroId: feedbackCriado.id,
    ip,
    detalhes: { colaboradorId, tipo },
  });

  return feedbackCriado;
}

/**
 * Atualiza um feedback existente (mensagem/tipo/ativo). Somente o autor
 * original pode editar seu proprio feedback; RH pode inativar qualquer
 * feedback (ex: moderacao de conteudo inadequado).
 */
async function atualizar({ id, empresaId, tipo, mensagem, ativo, usuarioLogado, ip }) {
  const feedback = await feedbackModel.buscarPorId(id, empresaId);
  if (!feedback) {
    throw new ErroAplicacao('Feedback nao encontrado.', 404);
  }

  const ehRh = usuarioLogado.perfil === PERFIS.RH;

  if (!ehRh) {
    const autor = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    if (autor.id !== feedback.autor_id) {
      throw new ErroAplicacao('Voce so pode editar feedbacks que voce mesmo registrou.', 403);
    }
    if (ativo !== undefined) {
      throw new ErroAplicacao('Somente o RH pode inativar um feedback.', 403);
    }
  }

  const camposParaAtualizar = {};
  if (tipo !== undefined) camposParaAtualizar.tipo = tipo;
  if (mensagem !== undefined) camposParaAtualizar.mensagem = mensagem;
  if (ativo !== undefined) camposParaAtualizar.ativo = ativo;

  const feedbackAtualizado = await feedbackModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'feedbacks',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return feedbackAtualizado;
}

module.exports = {
  listar,
  listarMeus,
  buscarPorId,
  criar,
  atualizar,
};
