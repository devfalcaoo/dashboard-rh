// ==========================================================================
// ARQUIVO: backend/services/metaService.js
// OBJETIVO: Regra de negocio de metas. Uso: RH e Gestor definem metas
//           (Gestor restrito ao seu escopo hierarquico - ver
//           utils/escopoHierarquico.js). O colaborador pode acompanhar e
//           atualizar o VALOR ATUAL da propria meta, mas nao pode criar,
//           editar dados gerais ou excluir.
// ==========================================================================

const metaModel = require('../models/metaModel');
const colaboradorModel = require('../models/colaboradorModel');
const indicadorModel = require('../models/indicadorModel');
const auditoriaService = require('./auditoriaService');
const notificacaoService = require('./notificacaoService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { estaNoEscopoHierarquico } = require('../utils/escopoHierarquico');
const { OPERACOES_LOG, PERFIS } = require('../config/constantes');

const PERFIS_COM_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];
const PERFIS_QUE_GERENCIAM_METAS = [PERFIS.RH, PERFIS.GESTOR];

/**
 * Localiza o colaborador vinculado ao usuario logado. Lanca erro se nao
 * existir.
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
 * Verifica se o usuario logado tem permissao de gerenciar (criar/editar)
 * metas do colaborador-alvo informado. RH sempre pode; Gestor somente
 * dentro do proprio escopo hierarquico.
 */
async function podeGerenciarMetaDoColaborador(usuarioLogado, empresaId, colaboradorAlvo) {
  if (usuarioLogado.perfil === PERFIS.RH) {
    return true;
  }

  if (usuarioLogado.perfil === PERFIS.GESTOR) {
    const gestor = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    return estaNoEscopoHierarquico({
      perfil: PERFIS.GESTOR,
      colaboradorAutorId: gestor.id,
      colaboradorAlvo,
    });
  }

  return false;
}

/**
 * Lista metas da empresa com filtros livres. Uso: RH / Administrador da
 * Empresa (visao geral) ou Gestor (dentro do proprio escopo).
 */
async function listar({ empresaId, pagina, tamanhoPagina, colaboradorId, indicadorId, status }) {
  return metaModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, colaboradorId, indicadorId, status });
}

/**
 * Lista as metas do proprio usuario logado (qualquer perfil com
 * colaborador vinculado).
 */
async function listarMinhas({ empresaId, usuarioLogado, pagina, tamanhoPagina, status }) {
  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
  return metaModel.listarPorEmpresa({
    empresaId,
    pagina,
    tamanhoPagina,
    colaboradorId: colaborador.id,
    status,
  });
}

/**
 * Busca uma meta pelo id. Regras de acesso: RH/Administrador da Empresa
 * tem acesso total; Gestor dentro do escopo; colaborador dono da meta.
 */
async function buscarPorId({ id, empresaId, usuarioLogado }) {
  const meta = await metaModel.buscarPorId(id, empresaId);
  if (!meta) {
    throw new ErroAplicacao('Meta nao encontrada.', 404);
  }

  if (!PERFIS_COM_VISAO_GERAL.includes(usuarioLogado.perfil)) {
    const colaboradorAlvo = await colaboradorModel.buscarPorId(meta.colaborador_id, empresaId);
    const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);

    const ehDono = colaborador.id === meta.colaborador_id;
    const noEscopoGestor =
      usuarioLogado.perfil === PERFIS.GESTOR &&
      estaNoEscopoHierarquico({
        perfil: PERFIS.GESTOR,
        colaboradorAutorId: colaborador.id,
        colaboradorAlvo,
      });

    if (!ehDono && !noEscopoGestor) {
      throw new ErroAplicacao('Voce nao tem permissao para visualizar esta meta.', 403);
    }
  }

  return meta;
}

/**
 * Cria uma nova meta. Gestor so pode criar meta para colaboradores dentro
 * do seu escopo hierarquico direto.
 */
async function criar({ empresaId, colaboradorId, indicadorId, titulo, valorMeta, prazo, usuarioLogado, ip }) {
  if (!PERFIS_QUE_GERENCIAM_METAS.includes(usuarioLogado.perfil)) {
    throw new ErroAplicacao('Seu perfil nao tem permissao para definir metas.', 403);
  }

  const colaboradorAlvo = await colaboradorModel.buscarPorId(colaboradorId, empresaId);
  if (!colaboradorAlvo) {
    throw new ErroAplicacao('Colaborador informado nao foi encontrado nesta empresa.', 422);
  }

  const indicador = await indicadorModel.buscarPorId(indicadorId, empresaId);
  if (!indicador) {
    throw new ErroAplicacao('Indicador informado nao foi encontrado nesta empresa.', 422);
  }

  const podeGerenciar = await podeGerenciarMetaDoColaborador(usuarioLogado, empresaId, colaboradorAlvo);
  if (!podeGerenciar) {
    throw new ErroAplicacao(
      'Voce so pode definir metas para colaboradores dentro do seu escopo (sua area).',
      403
    );
  }

  const metaCriada = await metaModel.criar({
    empresaId,
    colaboradorId,
    indicadorId,
    titulo,
    valorMeta: Number(valorMeta),
    prazo,
  });

  await notificacaoService.notificarMetaCriada({
    empresaId,
    usuarioIdDestinatario: colaboradorAlvo.usuario_id,
    metaId: metaCriada.id,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'metas',
    registroId: metaCriada.id,
    ip,
    detalhes: { colaboradorId, indicadorId, titulo },
  });

  return metaCriada;
}

/**
 * Atualiza os dados gerais de uma meta (titulo/valorMeta/prazo/status).
 */
async function atualizar({ id, empresaId, titulo, valorMeta, prazo, status, usuarioLogado, ip }) {
  const meta = await metaModel.buscarPorId(id, empresaId);
  if (!meta) {
    throw new ErroAplicacao('Meta nao encontrada.', 404);
  }

  const colaboradorAlvo = await colaboradorModel.buscarPorId(meta.colaborador_id, empresaId);
  const podeGerenciar = await podeGerenciarMetaDoColaborador(usuarioLogado, empresaId, colaboradorAlvo);
  if (!podeGerenciar) {
    throw new ErroAplicacao('Voce nao tem permissao para editar esta meta.', 403);
  }

  const camposParaAtualizar = {};
  if (titulo !== undefined) camposParaAtualizar.titulo = titulo;
  if (valorMeta !== undefined) camposParaAtualizar.valor_meta = Number(valorMeta);
  if (prazo !== undefined) camposParaAtualizar.prazo = prazo;
  if (status !== undefined) camposParaAtualizar.status = status;

  const metaAtualizada = await metaModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'metas',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return metaAtualizada;
}

/**
 * Atualiza o valor atual de uma meta (acompanhamento de progresso).
 * Permitido ao proprio colaborador dono da meta, ao RH, ou ao Gestor
 * dentro do escopo.
 *
 * Regra de consistencia: quando o valor atual atinge ou ultrapassa o
 * valor da meta, o status e automaticamente promovido para "atingida"
 * (a menos que a meta ja tenha sido marcada manualmente como
 * "cancelada").
 */
async function atualizarValorAtual({ id, empresaId, valorAtual, usuarioLogado, ip }) {
  const meta = await metaModel.buscarPorId(id, empresaId);
  if (!meta) {
    throw new ErroAplicacao('Meta nao encontrada.', 404);
  }

  if (meta.status === 'cancelada') {
    throw new ErroAplicacao('Esta meta foi cancelada e nao pode mais ser atualizada.', 409);
  }

  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
  const ehDono = colaborador.id === meta.colaborador_id;

  let podeAtualizar = ehDono;
  if (!podeAtualizar) {
    const colaboradorAlvo = await colaboradorModel.buscarPorId(meta.colaborador_id, empresaId);
    podeAtualizar = await podeGerenciarMetaDoColaborador(usuarioLogado, empresaId, colaboradorAlvo);
  }

  if (!podeAtualizar) {
    throw new ErroAplicacao('Voce nao tem permissao para atualizar o valor atual desta meta.', 403);
  }

  const valorAtualNumerico = Number(valorAtual);
  let novoStatus = meta.status;

  if (valorAtualNumerico >= meta.valor_meta) {
    novoStatus = 'atingida';
  } else if (meta.status === 'atingida') {
    // O valor atual regrediu abaixo da meta - volta para "em_andamento".
    novoStatus = 'em_andamento';
  }

  const metaAtualizada = await metaModel.atualizar(id, empresaId, {
    valor_atual: valorAtualNumerico,
    status: novoStatus,
  });

  if (novoStatus === 'atingida' && meta.status !== 'atingida') {
    const colaboradorDono = await colaboradorModel.buscarPorId(meta.colaborador_id, empresaId);
    if (colaboradorDono) {
      await notificacaoService.notificarMetaAtingida({
        empresaId,
        usuarioIdDestinatario: colaboradorDono.usuario_id,
        metaId: id,
      });
    }
  }

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'metas',
    registroId: id,
    ip,
    detalhes: { valorAtual: valorAtualNumerico, status: novoStatus },
  });

  return metaAtualizada;
}

module.exports = {
  listar,
  listarMinhas,
  buscarPorId,
  criar,
  atualizar,
  atualizarValorAtual,
};
