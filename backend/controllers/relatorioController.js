// ==========================================================================
// ARQUIVO: backend/controllers/relatorioController.js
// OBJETIVO: Receber as requisicoes das rotas de relatorios, delegar para
//           relatorioService e devolver o arquivo binario (PDF/Excel)
//           diretamente na resposta HTTP (nao segue o padrao JSON, pois
//           o conteudo e um arquivo para download).
// ==========================================================================

const relatorioService = require('../services/relatorioService');
const { respostaErro } = require('../utils/respostaPadrao');
const { validarParametrosRelatorio } = require('../validators/relatorioValidator');

function enviarArquivo(res, buffer, formato, nomeBase) {
  const tipoConteudo =
    formato === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const extensao = formato === 'pdf' ? 'pdf' : 'xlsx';

  res.setHeader('Content-Type', tipoConteudo);
  res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}.${extensao}"`);
  return res.send(buffer);
}

async function resumo(req, res, next) {
  try {
    const { valido, erros } = validarParametrosRelatorio(req.query);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const { formato, cicloId } = req.query;
    const buffer = await relatorioService.gerarRelatorioResumo({
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      cicloId,
      formato,
    });

    return enviarArquivo(res, buffer, formato, 'relatorio-resumo-gerencial');
  } catch (erro) {
    return next(erro);
  }
}

async function avaliacoes(req, res, next) {
  try {
    const { valido, erros } = validarParametrosRelatorio(req.query);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const { formato, cicloId } = req.query;
    const buffer = await relatorioService.gerarRelatorioAvaliacoes({
      empresaId: req.empresaId,
      cicloId,
      formato,
    });

    return enviarArquivo(res, buffer, formato, 'relatorio-avaliacoes');
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  resumo,
  avaliacoes,
};
