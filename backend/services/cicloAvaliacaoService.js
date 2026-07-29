// ==========================================================================
// ARQUIVO: backend/services/cicloAvaliacaoService.js
// OBJETIVO: Regra de negocio de gerenciamento de ciclos de avaliacao:
//           criacao, edicao (enquanto planejado), abertura (que dispara a
//           geracao automatica das avaliacoes) e encerramento (que exige
//           100% de conclusao ou uma justificativa registrada).
// ==========================================================================

const cicloAvaliacaoModel = require('../models/cicloAvaliacaoModel');
const avaliacaoModel = require('../models/avaliacaoModel');
const avaliacaoService = require('./avaliacaoService');
const auditoriaService = require('./auditoriaService');
const ErroAplicacao = require('../utils/erroAplicacao');
const { OPERACOES_LOG, STATUS_CICLO } = require('../config/constantes');

/**
 * Lista os ciclos de avaliacao da empresa.
 */
async function listar({ empresaId, pagina, tamanhoPagina, status }) {
  return cicloAvaliacaoModel.listarPorEmpresa({ empresaId, pagina, tamanhoPagina, status });
}

/**
 * Busca um ciclo especifico, restrito a empresa.
 */
async function buscarPorId({ id, empresaId }) {
  const ciclo = await cicloAvaliacaoModel.buscarPorId(id, empresaId);
  if (!ciclo) {
    throw new ErroAplicacao('Ciclo de avaliacao nao encontrado.', 404);
  }
  return ciclo;
}

/**
 * Cria um novo ciclo de avaliacao (sempre inicia como "planejado").
 */
async function criar({ empresaId, nome, dataInicio, dataFim, tipo, usuarioLogado, ip }) {
  const cicloCriado = await cicloAvaliacaoModel.criar({ empresaId, nome, dataInicio, dataFim, tipo });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.CRIACAO,
    tabelaAfetada: 'ciclos_avaliacao',
    registroId: cicloCriado.id,
    ip,
    detalhes: { nome, tipo },
  });

  return cicloCriado;
}

/**
 * Atualiza um ciclo de avaliacao. So e permitido enquanto o ciclo estiver
 * no status "planejado" - apos aberto, as avaliacoes ja foram geradas com
 * base nas datas/tipo originais, e alterar esses dados retroativamente
 * geraria inconsistencia.
 */
async function atualizar({ id, empresaId, nome, dataInicio, dataFim, usuarioLogado, ip }) {
  const ciclo = await cicloAvaliacaoModel.buscarPorId(id, empresaId);
  if (!ciclo) {
    throw new ErroAplicacao('Ciclo de avaliacao nao encontrado.', 404);
  }

  if (ciclo.status !== STATUS_CICLO.PLANEJADO) {
    throw new ErroAplicacao(
      'Este ciclo ja foi aberto e nao pode mais ter nome ou datas alterados.',
      409
    );
  }

  const camposParaAtualizar = {};
  if (nome !== undefined) camposParaAtualizar.nome = nome;
  if (dataInicio !== undefined) camposParaAtualizar.data_inicio = dataInicio;
  if (dataFim !== undefined) camposParaAtualizar.data_fim = dataFim;

  const cicloAtualizado = await cicloAvaliacaoModel.atualizar(id, empresaId, camposParaAtualizar);

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'ciclos_avaliacao',
    registroId: id,
    ip,
    detalhes: camposParaAtualizar,
  });

  return cicloAtualizado;
}

/**
 * Abre um ciclo de avaliacao: muda o status para "em_andamento" e dispara
 * a geracao automatica de todas as avaliacoes pendentes.
 */
async function abrir({ id, empresaId, usuarioLogado, ip }) {
  const ciclo = await cicloAvaliacaoModel.buscarPorId(id, empresaId);
  if (!ciclo) {
    throw new ErroAplicacao('Ciclo de avaliacao nao encontrado.', 404);
  }

  if (ciclo.status !== STATUS_CICLO.PLANEJADO) {
    throw new ErroAplicacao('Somente ciclos com status "planejado" podem ser abertos.', 409);
  }

  const { totalGerado } = await avaliacaoService.gerarAvaliacoesDoCiclo({
    ciclo,
    empresaId,
    usuarioLogado,
    ip,
  });

  const cicloAtualizado = await cicloAvaliacaoModel.atualizar(id, empresaId, {
    status: STATUS_CICLO.EM_ANDAMENTO,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'ciclos_avaliacao',
    registroId: id,
    ip,
    detalhes: { motivo: 'ciclo aberto', totalAvaliacoesGeradas: totalGerado },
  });

  return { ciclo: cicloAtualizado, totalAvaliacoesGeradas: totalGerado };
}

/**
 * Encerra um ciclo de avaliacao. So e permitido quando 100% das
 * avaliacoes estiverem concluidas, OU quando uma justificativa for
 * informada pelo RH (regra de negocio 5 do SAD).
 */
async function encerrar({ id, empresaId, justificativa, usuarioLogado, ip }) {
  const ciclo = await cicloAvaliacaoModel.buscarPorId(id, empresaId);
  if (!ciclo) {
    throw new ErroAplicacao('Ciclo de avaliacao nao encontrado.', 404);
  }

  if (ciclo.status !== STATUS_CICLO.EM_ANDAMENTO) {
    throw new ErroAplicacao('Somente ciclos com status "em_andamento" podem ser encerrados.', 409);
  }

  const totalPendentes = await avaliacaoModel.contarPendentesDoCiclo(id, empresaId);

  if (totalPendentes > 0 && !justificativa) {
    throw new ErroAplicacao(
      `Existem ${totalPendentes} avaliacao(oes) ainda nao concluida(s). ` +
        'Informe uma justificativa para encerrar o ciclo mesmo assim, ou aguarde a conclusao de todas.',
      409,
      { totalPendentes }
    );
  }

  const cicloEncerrado = await cicloAvaliacaoModel.atualizar(id, empresaId, {
    status: STATUS_CICLO.ENCERRADO,
  });

  await auditoriaService.registrar({
    empresaId,
    usuarioId: usuarioLogado.id,
    operacao: OPERACOES_LOG.ALTERACAO,
    tabelaAfetada: 'ciclos_avaliacao',
    registroId: id,
    ip,
    detalhes: {
      motivo: 'ciclo encerrado',
      totalPendentesNoEncerramento: totalPendentes,
      justificativa: justificativa || null,
    },
  });

  return cicloEncerrado;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  abrir,
  encerrar,
};
