// ==========================================================================
// ARQUIVO: backend/services/avaliacaoService.js
// OBJETIVO: Motor de avaliacao de desempenho. Contem:
//   1) A geracao automatica das avaliacoes de um ciclo, ao ser aberto;
//   2) O registro de notas por competencia (respondendo uma avaliacao);
//   3) A conclusao de uma avaliacao.
//
// DECISAO DE ARQUITETURA (documentada por nao estar 100% explicita no
// SAD): os tipos de avaliacao representam a RELACAO entre avaliador e
// avaliado. Convencao adotada:
//   - "autoavaliacao": o colaborador avalia a si mesmo.
//   - "lider"        : o lider direto avalia o colaborador (descendente).
//   - "subordinado"  : um subordinado avalia o seu lider (ascendente).
//   - "pares"        : colegas que compartilham o mesmo lider avaliam-se
//                      mutuamente.
// Geracao por tipo de ciclo:
//   - "90"  -> apenas "lider" (avaliacao descendente pura).
//   - "180" -> "autoavaliacao" + "lider".
//   - "360" -> "autoavaliacao" + "lider" + "pares" + "subordinado".
// ==========================================================================

const avaliacaoModel = require('../models/avaliacaoModel');
const avaliacaoItemModel = require('../models/avaliacaoItemModel');
const cicloAvaliacaoModel = require('../models/cicloAvaliacaoModel');
const colaboradorModel = require('../models/colaboradorModel');
const competenciaModel = require('../models/competenciaModel');
const auditoriaService = require('./auditoriaService');
const notificacaoService = require('./notificacaoService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG, PERFIS, STATUS_AVALIACAO } = require('../config/constantes');

const PERFIS_COM_VISAO_GERAL = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

/**
 * Monta a lista de avaliacoes a serem criadas para um ciclo, evitando
 * duplicatas e respeitando o tipo do ciclo (90/180/360).
 *
 * @param {{ cicloId: string, empresaId: string, tipoCiclo: string, colaboradores: object[] }} parametros
 * @returns {Array<{ cicloId, empresaId, colaboradorId, avaliadorId, tipo }>}
 */
function montarAvaliacoesDoCiclo({ cicloId, empresaId, tipoCiclo, colaboradores }) {
  const avaliacoesParaCriar = [];
  const chavesJaAdicionadas = new Set();

  // Mapa auxiliar: liderId -> lista de colaboradores que o tem como lider
  // (usado tanto para "subordinado" quanto para calcular "pares").
  const mapaPorLider = new Map();
  colaboradores.forEach((colaborador) => {
    if (!colaborador.lider_id) return;
    if (!mapaPorLider.has(colaborador.lider_id)) {
      mapaPorLider.set(colaborador.lider_id, []);
    }
    mapaPorLider.get(colaborador.lider_id).push(colaborador);
  });

  function adicionar(colaboradorId, avaliadorId, tipo) {
    const chave = `${colaboradorId}|${avaliadorId}|${tipo}`;
    if (chavesJaAdicionadas.has(chave)) return;
    chavesJaAdicionadas.add(chave);
    avaliacoesParaCriar.push({ cicloId, empresaId, colaboradorId, avaliadorId, tipo });
  }

  colaboradores.forEach((colaborador) => {
    // 1) Autoavaliacao - presente em 180 e 360
    if (tipoCiclo === '180' || tipoCiclo === '360') {
      adicionar(colaborador.id, colaborador.id, 'autoavaliacao');
    }

    // 2) Lider avalia o colaborador - presente em 90, 180 e 360
    if (colaborador.lider_id) {
      adicionar(colaborador.id, colaborador.lider_id, 'lider');
    }

    // 3) Somente 360: pares e subordinados
    if (tipoCiclo === '360') {
      const colegas = mapaPorLider.get(colaborador.lider_id) || [];
      colegas
        .filter((colega) => colega.id !== colaborador.id)
        .forEach((colega) => adicionar(colaborador.id, colega.id, 'pares'));

      const subordinados = mapaPorLider.get(colaborador.id) || [];
      subordinados.forEach((subordinado) => adicionar(colaborador.id, subordinado.id, 'subordinado'));
    }
  });

  return avaliacoesParaCriar;
}

/**
 * Gera automaticamente todas as avaliacoes de um ciclo recem-aberto.
 * Chamado pelo cicloAvaliacaoService ao abrir um ciclo.
 *
 * @param {{ ciclo: object, empresaId: string, usuarioLogado: object, ip: string }} parametros
 * @returns {Promise<{ totalGerado: number }>}
 */
async function gerarAvaliacoesDoCiclo({ ciclo, empresaId, usuarioLogado, ip }) {
  const colaboradoresAtivos = await colaboradorModel.listarTodosPorFiltro({
    empresaId,
    ativo: true,
  });

  if (colaboradoresAtivos.length === 0) {
    throw new ErroAplicacao(
      'Nao e possivel abrir o ciclo: nao ha colaboradores ativos cadastrados nesta empresa.',
      422
    );
  }

  const listaParaCriar = montarAvaliacoesDoCiclo({
    cicloId: ciclo.id,
    empresaId,
    tipoCiclo: ciclo.tipo,
    colaboradores: colaboradoresAtivos,
  });

  if (listaParaCriar.length === 0) {
    throw new ErroAplicacao(
      'Nao foi possivel gerar nenhuma avaliacao para este ciclo (verifique se os colaboradores possuem lideres vinculados).',
      422
    );
  }

  const avaliacoesCriadas = await avaliacaoModel.criarEmLote(listaParaCriar);

  // Mapa colaborador_id -> usuario_id, para traduzir o avaliador (que e
  // um colaborador) no usuario que efetivamente recebe a notificacao.
  const mapaUsuarioPorColaborador = new Map(
    colaboradoresAtivos.map((colaborador) => [colaborador.id, colaborador.usuario_id])
  );

  const notificacoesParaEnviar = avaliacoesCriadas
    .map((avaliacao) => ({
      avaliadorUsuarioId: mapaUsuarioPorColaborador.get(avaliacao.avaliador_id),
      tipo: avaliacao.tipo,
      avaliacaoId: avaliacao.id,
    }))
    .filter((notificacao) => Boolean(notificacao.avaliadorUsuarioId));

  await notificacaoService.notificarAvaliacoesAtribuidas({
    empresaId,
    avaliacoes: notificacoesParaEnviar,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'avaliacoes',
    registroId: ciclo.id,
    ip,
    detalhes: { motivo: 'geracao automatica de avaliacoes ao abrir ciclo', total: avaliacoesCriadas.length },
  });

  return { totalGerado: avaliacoesCriadas.length };
}

/**
 * Localiza o colaborador vinculado ao usuario logado. Lanca erro se o
 * usuario nao possuir colaborador vinculado (ex: um Administrador da
 * Empresa que nunca foi cadastrado como colaborador).
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
 * Lista avaliacoes da empresa com filtros livres. Uso: RH / Administrador
 * da Empresa (visao geral).
 */
async function listar({ empresaId, pagina, tamanhoPagina, cicloId, colaboradorId, avaliadorId, tipo, status }) {
  return avaliacaoModel.listar({
    empresaId,
    pagina,
    tamanhoPagina,
    cicloId,
    colaboradorId,
    avaliadorId,
    tipo,
    status,
  });
}

/**
 * Lista as avaliacoes em que o usuario logado e o AVALIADOR (ou seja,
 * "minhas avaliacoes para responder"). Disponivel para qualquer perfil
 * que possua colaborador vinculado.
 */
async function listarMinhas({ empresaId, usuarioLogado, pagina, tamanhoPagina, cicloId, status }) {
  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);

  return avaliacaoModel.listar({
    empresaId,
    pagina,
    tamanhoPagina,
    cicloId,
    avaliadorId: colaborador.id,
    status,
  });
}

/**
 * Busca uma avaliacao pelo id, incluindo seus itens. Regras de acesso:
 *  - RH / Administrador da Empresa: acesso total (dentro da empresa).
 *  - Demais perfis: somente se forem o avaliador OU o avaliado.
 */
async function buscarPorId({ id, empresaId, usuarioLogado }) {
  const avaliacao = await avaliacaoModel.buscarPorId(id, empresaId);
  if (!avaliacao) {
    throw new ErroAplicacao('Avaliacao nao encontrada.', 404);
  }

  if (!PERFIS_COM_VISAO_GERAL.includes(usuarioLogado.perfil)) {
    const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
    const podeVisualizar =
      colaborador.id === avaliacao.avaliador_id || colaborador.id === avaliacao.colaborador_id;

    if (!podeVisualizar) {
      throw new ErroAplicacao('Voce nao tem permissao para visualizar esta avaliacao.', 403);
    }
  }

  const itens = await avaliacaoItemModel.listarPorAvaliacao(id);

  return { ...avaliacao, itens };
}

/**
 * Registra (cria ou atualiza) as notas por competencia de uma avaliacao.
 * Somente o avaliador designado pode responder sua propria avaliacao.
 */
async function registrarItens({ id, empresaId, itens, usuarioLogado, ip }) {
  const avaliacao = await avaliacaoModel.buscarPorId(id, empresaId);
  if (!avaliacao) {
    throw new ErroAplicacao('Avaliacao nao encontrada.', 404);
  }

  if (avaliacao.status === STATUS_AVALIACAO.CONCLUIDA) {
    throw new ErroAplicacao('Esta avaliacao ja foi concluida e nao pode mais ser alterada.', 409);
  }

  const ciclo = await cicloAvaliacaoModel.buscarPorId(avaliacao.ciclo_id, empresaId);
  if (!ciclo || ciclo.status !== 'em_andamento') {
    throw new ErroAplicacao('O ciclo desta avaliacao nao esta em andamento.', 409);
  }

  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
  if (colaborador.id !== avaliacao.avaliador_id) {
    throw new ErroAplicacao('Apenas o avaliador designado pode registrar notas nesta avaliacao.', 403);
  }

  const competenciasAtivas = await competenciaModel.listarTodasAtivas(empresaId);
  const idsCompetenciasAtivas = new Set(competenciasAtivas.map((competencia) => competencia.id));

  const competenciaInvalida = itens.find((item) => !idsCompetenciasAtivas.has(item.competenciaId));
  if (competenciaInvalida) {
    throw new ErroAplicacao(
      `A competencia informada (${competenciaInvalida.competenciaId}) nao existe ou nao esta ativa nesta empresa.`,
      422
    );
  }

  for (const item of itens) {
    await avaliacaoItemModel.salvarItem({
      avaliacaoId: id,
      competenciaId: item.competenciaId,
      nota: Number(item.nota),
      comentario: item.comentario,
    });
  }

  if (avaliacao.status === STATUS_AVALIACAO.PENDENTE) {
    await avaliacaoModel.atualizar(id, empresaId, { status: STATUS_AVALIACAO.EM_ANDAMENTO });
  }

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'avaliacao_itens',
    registroId: id,
    ip,
    detalhes: { totalItensEnviados: itens.length },
  });

  // Recarrega a avaliacao para retornar a nota_final ja recalculada pela
  // trigger do banco (trg_calcula_nota_final_avaliacao).
  const avaliacaoAtualizada = await avaliacaoModel.buscarPorId(id, empresaId);
  const itensAtualizados = await avaliacaoItemModel.listarPorAvaliacao(id);

  return { ...avaliacaoAtualizada, itens: itensAtualizados };
}

/**
 * Conclui uma avaliacao, exigindo que todas as competencias ativas da
 * empresa tenham sido avaliadas.
 */
async function concluir({ id, empresaId, usuarioLogado, ip }) {
  const avaliacao = await avaliacaoModel.buscarPorId(id, empresaId);
  if (!avaliacao) {
    throw new ErroAplicacao('Avaliacao nao encontrada.', 404);
  }

  if (avaliacao.status === STATUS_AVALIACAO.CONCLUIDA) {
    throw new ErroAplicacao('Esta avaliacao ja foi concluida.', 409);
  }

  const colaborador = await obterColaboradorDoUsuario(usuarioLogado, empresaId);
  if (colaborador.id !== avaliacao.avaliador_id) {
    throw new ErroAplicacao('Apenas o avaliador designado pode concluir esta avaliacao.', 403);
  }

  const competenciasAtivas = await competenciaModel.listarTodasAtivas(empresaId);
  const itensExistentes = await avaliacaoItemModel.listarPorAvaliacao(id);
  const idsComNota = new Set(itensExistentes.map((item) => item.competencia_id));

  const competenciasFaltando = competenciasAtivas.filter((competencia) => !idsComNota.has(competencia.id));
  if (competenciasFaltando.length > 0) {
    throw new ErroAplicacao(
      'Existem competencias sem nota atribuida. Preencha todas antes de concluir a avaliacao.',
      422,
      { competenciasFaltando: competenciasFaltando.map((competencia) => competencia.nome) }
    );
  }

  const avaliacaoConcluida = await avaliacaoModel.atualizar(id, empresaId, {
    status: STATUS_AVALIACAO.CONCLUIDA,
    data_conclusao: new Date().toISOString(),
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'avaliacoes',
    registroId: id,
    ip,
    detalhes: { motivo: 'avaliacao concluida' },
  });

  return avaliacaoConcluida;
}

module.exports = {
  gerarAvaliacoesDoCiclo,
  listar,
  listarMinhas,
  buscarPorId,
  registrarItens,
  concluir,
};
