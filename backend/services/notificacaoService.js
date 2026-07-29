// ==========================================================================
// ARQUIVO: backend/services/notificacaoService.js
// OBJETIVO: Camada central de notificacoes. Expoe:
//   1) Funcoes de CONSULTA (listar minhas notificacoes, contar nao lidas,
//      marcar como lida) - usadas pelas rotas de notificacoes.
//   2) Funcoes de DISPARO (notificar), chamadas pelos OUTROS Services
//      (avaliacaoService, cicloAvaliacaoService, feedbackService,
//      pdiService, metaService) nos eventos-chave do sistema. Nenhum
//      desses Services acessa notificacaoModel diretamente - sempre
//      passam por aqui, centralizando o formato das mensagens.
//
// IMPORTANTE: uma falha ao disparar notificacao NUNCA deve interromper o
// fluxo principal do sistema (ex: se notificar falhar, a avaliacao ja
// criada nao pode ser perdida). Por isso as funcoes de disparo capturam
// erros internamente e apenas registram no console, sem propagar.
// ==========================================================================

const notificacaoModel = require('../models/notificacaoModel');
const ErroAplicacao = require('../utils/erroAplicacao');

/**
 * Lista as notificacoes do usuario logado.
 */
async function listarMinhas({ empresaId, usuarioLogado, pagina, tamanhoPagina, lida }) {
  return notificacaoModel.listarPorUsuario({
    empresaId,
    usuarioId: usuarioLogado.id,
    pagina,
    tamanhoPagina,
    lida,
  });
}

/**
 * Conta as notificacoes nao lidas do usuario logado (uso: badge no menu).
 */
async function contarNaoLidas({ empresaId, usuarioLogado }) {
  const total = await notificacaoModel.contarNaoLidas(empresaId, usuarioLogado.id);
  return { total };
}

/**
 * Marca uma notificacao especifica como lida. Only o dono da notificacao
 * pode marca-la.
 */
async function marcarComoLida({ id, empresaId, usuarioLogado }) {
  const notificacao = await notificacaoModel.buscarPorId(id, empresaId);
  if (!notificacao) {
    throw new ErroAplicacao('Notificacao nao encontrada.', 404);
  }

  if (notificacao.usuario_id !== usuarioLogado.id) {
    throw new ErroAplicacao('Voce nao tem permissao para alterar esta notificacao.', 403);
  }

  return notificacaoModel.marcarComoLida(id, empresaId);
}

/**
 * Marca todas as notificacoes do usuario logado como lidas.
 */
async function marcarTodasComoLidas({ empresaId, usuarioLogado }) {
  const totalAtualizado = await notificacaoModel.marcarTodasComoLidas(empresaId, usuarioLogado.id);
  return { totalAtualizado };
}

// --------------------------------------------------------------------------
// FUNCOES DE DISPARO - chamadas pelos demais Services do sistema.
// Todas seguem o mesmo padrao defensivo: nunca lancam excecao para cima.
// --------------------------------------------------------------------------

/**
 * Envia uma unica notificacao. Uso interno pelas funcoes especificas
 * abaixo (nunca chamada diretamente pelos Controllers).
 */
async function notificar({ empresaId, usuarioId, titulo, mensagem, tipo, link }) {
  try {
    await notificacaoModel.criar({ empresaId, usuarioId, titulo, mensagem, tipo, link });
  } catch (erro) {
    console.error('Falha ao disparar notificacao:', erro.message);
  }
}

/**
 * Envia notificacoes em lote. Uso interno pelas funcoes especificas
 * abaixo.
 */
async function notificarEmLote(listaDeNotificacoes) {
  if (!listaDeNotificacoes || listaDeNotificacoes.length === 0) {
    return;
  }
  try {
    await notificacaoModel.criarEmLote(listaDeNotificacoes);
  } catch (erro) {
    console.error('Falha ao disparar notificacoes em lote:', erro.message);
  }
}

/**
 * Evento: uma avaliacao foi atribuida a um avaliador (disparado em lote
 * ao abrir um ciclo). Recebe a lista de avaliacoes recem-criadas, cada
 * uma com { avaliadorUsuarioId, tipo }.
 */
async function notificarAvaliacoesAtribuidas({ empresaId, avaliacoes }) {
  const listaDeNotificacoes = avaliacoes.map((avaliacao) => ({
    empresaId,
    usuarioId: avaliacao.avaliadorUsuarioId,
    titulo: 'Nova avaliacao pendente',
    mensagem: `Voce tem uma nova avaliacao do tipo "${avaliacao.tipo}" para responder.`,
    tipo: 'avaliacao_atribuida',
    link: `/avaliacoes/${avaliacao.avaliacaoId}`,
  }));

  await notificarEmLote(listaDeNotificacoes);
}

/**
 * Evento: um feedback foi registrado para um colaborador.
 */
async function notificarFeedbackRecebido({ empresaId, usuarioIdDestinatario, feedbackId }) {
  await notificar({
    empresaId,
    usuarioId: usuarioIdDestinatario,
    titulo: 'Voce recebeu um novo feedback',
    mensagem: 'Um novo feedback foi registrado para voce. Confira os detalhes.',
    tipo: 'feedback_recebido',
    link: `/feedbacks/${feedbackId}`,
  });
}

/**
 * Evento: um PDI foi criado para um colaborador.
 */
async function notificarPdiCriado({ empresaId, usuarioIdDestinatario, pdiId }) {
  await notificar({
    empresaId,
    usuarioId: usuarioIdDestinatario,
    titulo: 'Novo Plano de Desenvolvimento Individual',
    mensagem: 'Um novo PDI foi criado para voce. Confira o objetivo e o prazo.',
    tipo: 'pdi_criado',
    link: `/pdis/${pdiId}`,
  });
}

/**
 * Evento: uma meta foi criada para um colaborador.
 */
async function notificarMetaCriada({ empresaId, usuarioIdDestinatario, metaId }) {
  await notificar({
    empresaId,
    usuarioId: usuarioIdDestinatario,
    titulo: 'Nova meta definida',
    mensagem: 'Uma nova meta foi definida para voce. Confira os detalhes.',
    tipo: 'meta_criada',
    link: `/metas/${metaId}`,
  });
}

/**
 * Evento: uma meta foi marcada como atingida.
 */
async function notificarMetaAtingida({ empresaId, usuarioIdDestinatario, metaId }) {
  await notificar({
    empresaId,
    usuarioId: usuarioIdDestinatario,
    titulo: 'Meta atingida!',
    mensagem: 'Parabens! Voce atingiu uma das suas metas.',
    tipo: 'meta_atingida',
    link: `/metas/${metaId}`,
  });
}

/**
 * Evento: um ciclo de avaliacao foi encerrado (notifica o RH que abriu/
 * acompanha, ou de forma mais simples, todos os usuarios RH da empresa -
 * a lista de destinatarios e responsabilidade de quem chama).
 */
async function notificarCicloEncerrado({ empresaId, usuarioIdsDestinatarios, cicloNome, cicloId }) {
  const listaDeNotificacoes = usuarioIdsDestinatarios.map((usuarioId) => ({
    empresaId,
    usuarioId,
    titulo: 'Ciclo de avaliacao encerrado',
    mensagem: `O ciclo "${cicloNome}" foi encerrado.`,
    tipo: 'ciclo_encerrado',
    link: `/ciclos-avaliacao/${cicloId}`,
  }));

  await notificarEmLote(listaDeNotificacoes);
}

module.exports = {
  listarMinhas,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  notificarAvaliacoesAtribuidas,
  notificarFeedbackRecebido,
  notificarPdiCriado,
  notificarMetaCriada,
  notificarMetaAtingida,
  notificarCicloEncerrado,
};
