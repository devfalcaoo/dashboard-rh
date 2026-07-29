// ==========================================================================
// ARQUIVO: backend/utils/geradorExcel.js
// OBJETIVO: Funcao utilitaria reutilizavel para gerar relatorios em Excel
//           (.xlsx) a partir de um titulo, colunas e linhas de dados.
// ==========================================================================

const ExcelJS = require('exceljs');

/**
 * Gera uma planilha .xlsx simples e retorna um Buffer.
 * @param {{ titulo: string, colunas: string[], linhas: any[][] }} dados
 * @returns {Promise<Buffer>}
 */
async function gerarExcelTabular({ titulo, colunas, linhas }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Gestao de Desempenho Corporativo';
  workbook.created = new Date();

  const planilha = workbook.addWorksheet(titulo.substring(0, 31) || 'Relatorio');

  planilha.addRow(colunas);
  planilha.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  planilha.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF5B21B6' },
  };

  linhas.forEach((linha) => planilha.addRow(linha));

  planilha.columns.forEach((coluna) => {
    coluna.width = 22;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { gerarExcelTabular };
