// ==========================================================================
// ARQUIVO: backend/services/pdiService.js
// OBJETIVO: Regra de negocio de Planos de Desenvolvimento Individual
//           (PDI). RH, Gestor e Lider criam e gerenciam PDIs (Gestor/Lider
//           restritos ao seu escopo hierarquico). O proprio colaborador
//           pode atualizar o PROGRESSO do seu PDI (fluxo descrito no SAD,
//           secao 11.2), mas nao pode criar, editar dados gerais ou
//           excluir um PDI.
// ==========================================================================

const pdiModel = require('../models/pdiModel');
const colaboradorModel = require('../models/colaboradorModel');
const competenciaModel = require('../models/competenciaModel');
const auditoriaService = require('./auditoriaService');
const notificacaoService = require('./notificacaoService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { estaNoEscopoHierarquico } = require('../utils/escopoHierarquico');
const { OPERACOES_LOG, PERFIS, STATUS_PDI } = require('../config/constantes');

const PERFIS_COM_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];
const PERFIS_QUE_CRIAM_PDI = [PERFIS.RH, PERFIS.GESTOR, PERFIS.LIDER];

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
 * Lista PDIs da empresa com filtros livres. Uso: RH / Administrador da
 * Empresa (visao geral) ou Gestor/Lider (dentro do proprio escopo).
 */
async function listar({ empresaId, pagina, tamanhoPagina, colaboradorId, competenciaId, status }) {
  return pdiModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, colaboradorId, competenciaId, status });
}

/**
 * Lista os PDIs do proprio usuario logado (qualquer perfil com
 * colaborador vinculado).
 */
async function listarMeus({ empresaId, usuarioLogado, pagina, tamanhoPagina, status }) {
  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
  return pdiModel.listarPorEmpresa({
    empresaId,
    pagina,
    tamanhoPagina,
    colaboradorId: colaborador.id,
    status,
  });
}

/**
 * Busca um PDI pelo id. Regras de acesso: RH/Administrador da Empresa tem
 * acesso total; demais perfis somente se forem o colaborador dono do PDI
 * ou quem o criou.
 */
async function buscarPorId({ id, empresaId, usuarioLogado }) {
  const pdi = await pdiModel.buscarPorId(id, empresaId);
  if (!pdi) {
    throw new ErroAplicacao('PDI nao encontrado.', 404);
  }

  if (!PERFIS_COM_VISAO_GERAL.includes(usuarioLogado.perfil)) {
    const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    const podeVisualizar = colaborador.id === pdi.colaborador_id || usuarioLogado.id === pdi.criado_por;

    if (!podeVisualizar) {
      throw new ErroAplicacao('Voce nao tem permissao para visualizar este PDI.', 403);
    }
  }

  return pdi;
}

/**
 * Cria um novo PDI. Gestor/Lider so podem criar PDI para colaboradores
 * dentro do seu escopo hierarquico direto.
 */
async function criar({ empresaId, colaboradorId, competenciaId, objetivo, prazo, usuarioLogado, ip }) {
  if (!PERFIS_QUE_CRIAM_PDI.includes(usuarioLogado.perfil)) {
    throw new ErroAplicacao('Seu perfil nao tem permissao para criar PDIs.', 403);
  }

  const colaboradorAlvo = await colaboradorModel.buscarPorId(colaboradorId, empresaId);
  if (!colaboradorAlvo) {
    throw new ErroAplicacao('Colaborador informado nao foi encontrado nesta empresa.', 422);
  }

  const competencia = await competenciaModel.buscarPorId(competenciaId, empresaId);
  if (!competencia || !competencia.ativo) {
    throw new ErroAplicacao('Competencia informada nao existe ou nao esta ativa nesta empresa.', 422);
  }

  if (usuarioLogado.perfil !== PERFIS.RH) {
    const autor = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    const noEscopo = estaNoEscopoHierarquico({
      perfil: usuarioLogado.perfil,
      colaboradorAutorId: autor.id,
      colaboradorAlvo,
    });

    if (!noEscopo) {
      throw new ErroAplicacao(
        'Voce so pode criar PDI para colaboradores dentro do seu escopo (sua equipe ou area).',
        403
      );
    }
  }

  const pdiCriado = await pdiModel.criar({
    empresaId,
    colaboradorId,
    criadoPor: usuarioLogado.id,
    objetivo,
    competenciaId,
    prazo,
  });

  await notificacaoService.notificarPdiCriado({
    empresaId,
    usuarioIdDestinatario: colaboradorAlvo.usuario_id,
    pdiId: pdiCriado.id,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'pdis',
    registroId: pdiCriado.id,
    ip,
    detalhes: { colaboradorId, competenciaId },
  });

  return pdiCriado;
}

/**
 * Atualiza os dados gerais de um PDI (objetivo/competencia/prazo/status).
 * Restrito a quem criou o PDI ou ao RH.
 */
async function atualizar({ id, empresaId, objetivo, competenciaId, prazo, status, usuarioLogado, ip }) {
  const pdi = await pdiModel.buscarPorId(id, empresaId);
  if (!pdi) {
    throw new ErroAplicacao('PDI nao encontrado.', 404);
  }

  const ehRh = usuarioLogado.perfil === PERFIS.RH;
  if (!ehRh && usuarioLogado.id !== pdi.criado_por) {
    throw new ErroAplicacao('Voce so pode editar PDIs que voce mesmo criou.', 403);
  }

  if (competenciaId !== undefined) {
    const competencia = await competenciaModel.buscarPorId(competenciaId, empresaId);
    if (!competencia || !competencia.ativo) {
      throw new ErroAplicacao('Competencia informada nao existe ou nao esta ativa nesta empresa.', 422);
    }
  }

  const camposParaAtualizar = {};
  if (objetivo !== undefined) camposParaAtualizar.objetivo = objetivo;
  if (competenciaId !== undefined) camposParaAtualizar.competencia_id = competenciaId;
  if (prazo !== undefined) camposParaAtualizar.prazo = prazo;
  if (status !== undefined) camposParaAtualizar.status = status;

  const pdiAtualizado = await pdiModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'pdis',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return pdiAtualizado;
}

/**
 * Atualiza o progresso de um PDI. Permitido ao proprio colaborador dono
 * do PDI, a quem o criou, ou ao RH - conforme o fluxo descrito no SAD
 * (secao 11.2): "Colaborador acompanha e atualiza progresso".
 *
 * Regra de consistencia: progresso 100 forca status "concluido"; um
 * progresso entre 1 e 99 nunca deixa o status como "nao_iniciado".
 */
async function atualizarProgresso({ id, empresaId, progresso, usuarioLogado, ip }) {
  const pdi = await pdiModel.buscarPorId(id, empresaId);
  if (!pdi) {
    throw new ErroAplicacao('PDI nao encontrado.', 404);
  }

  if (pdi.status === STATUS_PDI.CONCLUIDO) {
    throw new ErroAplicacao('Este PDI ja foi concluido e seu progresso nao pode mais ser alterado.', 409);
  }

  const ehRh = usuarioLogado.perfil === PERFIS.RH;
  const ehCriador = usuarioLogado.id === pdi.criado_por;

  let ehDonoDoPdi = false;
  if (!ehRh && !ehCriador) {
    const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    ehDonoDoPdi = colaborador.id === pdi.colaborador_id;
  }

  if (!ehRh && !ehCriador && !ehDonoDoPdi) {
    throw new ErroAplicacao('Voce nao tem permissao para atualizar o progresso deste PDI.', 403);
  }

  const progressoNumerico = Number(progresso);
  let novoStatus = pdi.status;

  if (progressoNumerico === 100) {
    novoStatus = STATUS_PDI.CONCLUIDO;
  } else if (progressoNumerico > 0 && pdi.status === STATUS_PDI.NAO_INICIADO) {
    novoStatus = STATUS_PDI.EM_ANDAMENTO;
  }

  const pdiAtualizado = await pdiModel.atualizar(id, empresaId, {
    progresso: progressoNumerico,
    status: novoStatus,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'pdis',
    registroId: id,
    ip,
    detalhes: { progresso: progressoNumerico, status: novoStatus },
  });

  return pdiAtualizado;
}

module.exports = {
  listar,
  listarMeus,
  buscarPorId,
  criar,
  atualizar,
  atualizarProgresso,
};
