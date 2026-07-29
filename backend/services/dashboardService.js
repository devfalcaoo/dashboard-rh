// ==========================================================================
// ARQUIVO: backend/services/dashboardService.js
// OBJETIVO: Calcular os indicadores consolidados do Dashboard (SAD,
//           secao 12): quantidade de colaboradores, avaliacoes
//           pendentes/concluidas, media geral, media por lider, media
//           por departamento, ranking, competencias criticas e evolucao
//           mensal.
//
// ESTRATEGIA: como o volume de dados de uma empresa cliente e moderado
// (nao e big data), as agregacoes sao feitas em memoria, no Node, a
// partir de consultas simples ja filtradas por empresa_id - evitando
// depender de funcoes SQL adicionais no Supabase nesta fase.
//
// ESCOPO POR PERFIL: RH e Administrador da Empresa veem o dashboard
// completo da empresa. Gestor e Lider veem apenas os dados da sua
// propria equipe/area (colaboradores dentro do seu escopo hierarquico).
// ==========================================================================

const colaboradorModel = require('../models/colaboradorModel');
const avaliacaoModel = require('../models/avaliacaoModel');
const avaliacaoItemModel = require('../models/avaliacaoItemModel');
const competenciaModel = require('../models/competenciaModel');
const departamentoModel = require('../models/departamentoModel');
const ErroAplicacao = require('../utils/erroAplicacao');
const { estaNoEscopoHierarquico } = require('../utils/escopoHierarquico');
const { PERFIS } = require('../config/constantes');

const PERFIS_COM_VISAO_COMPLETA = [PERFIS.RH, PERFIS.ADMINISTRADOR_EMPRESA];

/**
 * Calcula a media aritmetica de uma lista de numeros, ignorando valores
 * nulos/indefinidos. Retorna null se a lista estiver vazia.
 */
function calcularMedia(numeros) {
  const validos = numeros.filter((numero) => numero !== null && numero !== undefined);
  if (validos.length === 0) return null;
  const soma = validos.reduce((acumulado, numero) => acumulado + Number(numero), 0);
  return Math.round((soma / validos.length) * 100) / 100;
}

/**
 * Restringe a lista de colaboradores ao escopo hierarquico do usuario
 * logado (RH/Administrador da Empresa veem todos; Gestor/Lider veem
 * somente sua equipe/area).
 */
async function obterColaboradoresNoEscopo(usuarioLogado, empresaId, todosColaboradores) {
  if (PERFIS_COM_VISAO_COMPLETA.includes(usuarioLogado.perfil)) {
    return todosColaboradores;
  }

  const colaboradorAtual = await colaboradorModel.buscarPorUsuarioId(usuarioLogado.id, empresaId);
  if (!colaboradorAtual) {
    throw new ErroAplicacao(
      'Seu usuario nao possui um cadastro de colaborador vinculado nesta empresa.',
      422
    );
  }

  return todosColaboradores.filter((colaborador) =>
    estaNoEscopoHierarquico({
      perfil: usuarioLogado.perfil,
      colaboradorAutorId: colaboradorAtual.id,
      colaboradorAlvo: colaborador,
    })
  );
}

/**
 * Monta o resumo geral do dashboard: contagens, medias, ranking e
 * competencias criticas.
 *
 * @param {{ empresaId: string, usuarioLogado: object, cicloId?: string }} parametros
 */
async function obterResumo({ empresaId, usuarioLogado, cicloId }) {
  const [todosColaboradores, todasAvaliacoes] = await Promise.all([
    colaboradorModel.listarTodosPorFiltro({ empresaId, ativo: true }),
    avaliacaoModel.listarTodasPorEmpresa({ empresaId, cicloId }),
  ]);

  const colaboradoresNoEscopo = await obterColaboradoresNoEscopo(
    usuarioLogado,
    empresaId,
    todosColaboradores
  );
  const idsColaboradoresNoEscopo = new Set(colaboradoresNoEscopo.map((colaborador) => colaborador.id));

  // So consideramos avaliacoes cujo AVALIADO esta dentro do escopo do
  // usuario logado (ex: Lider ve apenas avaliacoes da sua propria equipe).
  const avaliacoesNoEscopo = todasAvaliacoes.filter((avaliacao) =>
    idsColaboradoresNoEscopo.has(avaliacao.colaborador_id)
  );

  const avaliacoesConcluidas = avaliacoesNoEscopo.filter((avaliacao) => avaliacao.status === 'concluida');
  const avaliacoesPendentes = avaliacoesNoEscopo.filter((avaliacao) => avaliacao.status !== 'concluida');

  const mediaGeral = calcularMedia(avaliacoesConcluidas.map((avaliacao) => avaliacao.nota_final));

  // --- Media por departamento ---
  const departamentos = await departamentoModel.listarPorEmpresa({
    empresaId,
    pagina: 1,
    tamanhoPagina: 1000,
    ativo: true,
  });
  const mapaDepartamentoPorColaborador = new Map(
    colaboradoresNoEscopo.map((colaborador) => [colaborador.id, colaborador.departamento_id])
  );
  const mediaPorDepartamento = departamentos.registros
    .map((departamento) => {
      const notasDoDepartamento = avaliacoesConcluidas
        .filter((avaliacao) => mapaDepartamentoPorColaborador.get(avaliacao.colaborador_id) === departamento.id)
        .map((avaliacao) => avaliacao.nota_final);
      return {
        departamentoId: departamento.id,
        departamentoNome: departamento.nome,
        media: calcularMedia(notasDoDepartamento),
        totalAvaliacoes: notasDoDepartamento.length,
      };
    })
    .filter((linha) => linha.media !== null);

  // --- Media por lider ---
  const mapaLiderPorColaborador = new Map(
    colaboradoresNoEscopo.map((colaborador) => [colaborador.id, colaborador.lider_id])
  );
  const idsLideres = [...new Set(colaboradoresNoEscopo.map((c) => c.lider_id).filter(Boolean))];
  const mediaPorLider = idsLideres
    .map((liderId) => {
      const notasDoLider = avaliacoesConcluidas
        .filter((avaliacao) => mapaLiderPorColaborador.get(avaliacao.colaborador_id) === liderId)
        .map((avaliacao) => avaliacao.nota_final);
      return {
        liderColaboradorId: liderId,
        media: calcularMedia(notasDoLider),
        totalAvaliacoes: notasDoLider.length,
      };
    })
    .filter((linha) => linha.media !== null);

  // --- Ranking (colaboradores por media de nota_final, desc) ---
  const notasPorColaborador = new Map();
  avaliacoesConcluidas.forEach((avaliacao) => {
    const lista = notasPorColaborador.get(avaliacao.colaborador_id) || [];
    lista.push(avaliacao.nota_final);
    notasPorColaborador.set(avaliacao.colaborador_id, lista);
  });
  const ranking = [...notasPorColaborador.entries()]
    .map(([colaboradorId, notas]) => ({
      colaboradorId,
      media: calcularMedia(notas),
      totalAvaliacoes: notas.length,
    }))
    .sort((a, b) => b.media - a.media)
    .slice(0, 20);

  // --- Competencias criticas (menor media entre as competencias) ---
  const idsAvaliacoesNoEscopo = avaliacoesConcluidas.map((avaliacao) => avaliacao.id);
  const itensDasAvaliacoes = await avaliacaoItemModel.listarPorAvaliacoes(idsAvaliacoesNoEscopo);
  const competenciasAtivas = await competenciaModel.listarTodasAtivas(empresaId);
  const mapaNomeCompetencia = new Map(competenciasAtivas.map((c) => [c.id, c.nome]));

  const notasPorCompetencia = new Map();
  itensDasAvaliacoes.forEach((item) => {
    const lista = notasPorCompetencia.get(item.competencia_id) || [];
    lista.push(item.nota);
    notasPorCompetencia.set(item.competencia_id, lista);
  });
  const competenciasCriticas = [...notasPorCompetencia.entries()]
    .map(([competenciaId, notas]) => ({
      competenciaId,
      competenciaNome: mapaNomeCompetencia.get(competenciaId) || 'Competencia removida',
      media: calcularMedia(notas),
      totalNotas: notas.length,
    }))
    .sort((a, b) => a.media - b.media)
    .slice(0, 5);

  return {
    totalColaboradores: colaboradoresNoEscopo.length,
    avaliacoesPendentes: avaliacoesPendentes.length,
    avaliacoesConcluidas: avaliacoesConcluidas.length,
    mediaGeral,
    mediaPorDepartamento,
    mediaPorLider,
    ranking,
    competenciasCriticas,
  };
}

/**
 * Calcula a evolucao mensal da media de nota_final (ultimos N meses),
 * com base na data_conclusao das avaliacoes concluidas.
 */
async function obterEvolucaoMensal({ empresaId, usuarioLogado, meses = 6 }) {
  const [todosColaboradores, todasAvaliacoes] = await Promise.all([
    colaboradorModel.listarTodosPorFiltro({ empresaId, ativo: true }),
    avaliacaoModel.listarTodasPorEmpresa({ empresaId }),
  ]);

  const colaboradoresNoEscopo = await obterColaboradoresNoEscopo(
    usuarioLogado,
    empresaId,
    todosColaboradores
  );
  const idsColaboradoresNoEscopo = new Set(colaboradoresNoEscopo.map((colaborador) => colaborador.id));

  const avaliacoesConcluidas = todasAvaliacoes.filter(
    (avaliacao) =>
      avaliacao.status === 'concluida' &&
      avaliacao.data_conclusao &&
      idsColaboradoresNoEscopo.has(avaliacao.colaborador_id)
  );

  const notasPorMes = new Map();
  avaliacoesConcluidas.forEach((avaliacao) => {
    const chaveDoMes = avaliacao.data_conclusao.substring(0, 7); // "AAAA-MM"
    const lista = notasPorMes.get(chaveDoMes) || [];
    lista.push(avaliacao.nota_final);
    notasPorMes.set(chaveDoMes, lista);
  });

  const mesesOrdenados = [...notasPorMes.keys()].sort().slice(-meses);

  return mesesOrdenados.map((mes) => ({
    mes,
    media: calcularMedia(notasPorMes.get(mes)),
    totalAvaliacoes: notasPorMes.get(mes).length,
  }));
}

module.exports = {
  obterResumo,
  obterEvolucaoMensal,
};
