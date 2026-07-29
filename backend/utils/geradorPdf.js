// ==========================================================================
// ARQUIVO: backend/utils/geradorPdf.js
// OBJETIVO: Funcao utilitaria reutilizavel para gerar relatorios em PDF
//           a partir de um titulo, colunas e linhas de dados tabulares.
// ==========================================================================

const PDFDocument = require('pdfkit');

/**
 * Gera um PDF tabular simples e retorna um Buffer.
 * @param {{ titulo: string, colunas: string[], linhas: any[][] }} dados
 * @returns {Promise<Buffer>}
 */
function gerarPdfTabular({ titulo, colunas, linhas }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const partes = [];

      doc.on('data', (parte) => partes.push(parte));
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);

      doc.fontSize(16).text(titulo, { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).fillColor('#666666').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      doc.moveDown(1.5);

      const larguraUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const larguraColuna = larguraUtil / colunas.length;

      function desenharLinha(valores, opcoes = {}) {
        const y = doc.y;
        valores.forEach((valor, indice) => {
          doc
            .fontSize(9)
            .fillColor(opcoes.negrito ? '#5b21b6' : '#1f2937')
            .text(String(valor ?? ''), doc.page.margins.left + indice * larguraColuna, y, {
              width: larguraColuna,
              ellipsis: true,
            });
        });
        doc.moveDown(0.8);
      }

      desenharLinha(colunas, { negrito: true });
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor('#5b21b6')
        .stroke();
      doc.moveDown(0.3);

      linhas.forEach((linha) => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
          doc.addPage();
        }
        desenharLinha(linha);
      });

      doc.end();
    } catch (erro) {
      reject(erro);
    }
  });
}

module.exports = { gerarPdfTabular };
