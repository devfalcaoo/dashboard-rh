// ==========================================================================
// ARQUIVO: backend/services/relatorioService.js
// OBJETIVO: Regra de negocio de geracao de relatorios. Reaproveita os
//           dados ja calculados pelo dashboardService e pelos Models de
//           negocio, formatando-os em tabelas e delegando a exportacao
//           (PDF/Excel) aos utilitarios geradorPdf/geradorExcel.
// ==========================================================================

const dashboardService = require('./dashboardService');
const avaliacaoModel = require('../models/avaliacaoModel');
const colaboradorModel = require('../models/colaboradorModel');
const { gerarPdfTabular } = require('../utils/geradorPdf');
const { gerarExcelTabular } = require('../utils/geradorExcel');
const ErroAplicacao = require('../utils/erroAplicacao');

/**
 * Gera o relatorio de RESUMO GERENCIAL (mesmos dados do dashboard),
 * exportado no formato solicitado.
 */
async function gerarRelatorioResumo({ empresaId, usuarioLogado, cicloId, formato }) {
  const resumo = await dashboardService.obterResumo({ empresaId, usuarioLogado, cicloId });

  const colunas = ['Departamento', 'Media', 'Total de Avaliacoes'];
  const linhas = resumo.mediaPorDepartamento.map((linha) => [
    linha.departamentoNome,
    linha.media,
    linha.totalAvaliacoes,
  ]);

  const cabecalho = [
    ['Total de colaboradores ativos', resumo.totalColaboradores],
    ['Avaliacoes pendentes', resumo.avaliacoesPendentes],
    ['Avaliacoes concluidas', resumo.avaliacoesConcluidas],
    ['Media geral', resumo.mediaGeral ?? '-'],
    [],
  ];

  const titulo = 'Relatorio Gerencial de Desempenho';

  if (formato === 'pdf') {
    return gerarPdfTabular({
      titulo,
      colunas,
      linhas: [...cabecalho.map((linha) => [linha[0] || '', linha[1] ?? '', '']), ...linhas],
    });
  }

  return gerarExcelTabular({
    titulo,
    colunas,
    linhas: [...cabecalho.map((linha) => [linha[0] || '', linha[1] ?? '', '']), ...linhas],
  });
}

/**
 * Gera o relatorio de AVALIACOES de um ciclo especifico, listando cada
 * avaliacao com seu status e nota final.
 */
async function gerarRelatorioAvaliacoes({ empresaId, cicloId, formato }) {
  if (!cicloId) {
    throw new ErroAplicacao('O parametro "cicloId" e obrigatorio para este relatorio.', 422);
  }

  const avaliacoes = await avaliacaoModel.listarTodasPorEmpresa({ empresaId, cicloId });
  const colaboradores = await colaboradorModel.listarTodosPorFiltro({ empresaId });
  const mapaColaborador = new Map(colaboradores.map((colaborador) => [colaborador.id, colaborador]));

  const colunas = ['Colaborador (ID)', 'Avaliador (ID)', 'Tipo', 'Status', 'Nota Final'];
  const linhas = avaliacoes.map((avaliacao) => [
    mapaColaborador.get(avaliacao.colaborador_id)?.id || avaliacao.colaborador_id,
    avaliacao.avaliador_id,
    avaliacao.tipo,
    avaliacao.status,
    avaliacao.nota_final ?? '-',
  ]);

  const titulo = 'Relatorio de Avaliacoes do Ciclo';

  if (formato === 'pdf') {
    return gerarPdfTabular({ titulo, colunas, linhas });
  }
  return gerarExcelTabular({ titulo, colunas, linhas });
}

module.exports = {
  gerarRelatorioResumo,
  gerarRelatorioAvaliacoes,
};
