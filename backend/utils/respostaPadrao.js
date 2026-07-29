// ==========================================================================
// ARQUIVO: backend/utils/respostaPadrao.js
// OBJETIVO: Padronizar TODAS as respostas da API, garantindo que todo
//           Controller retorne exatamente o mesmo formato de sucesso/erro
//           definido no Documento de Arquitetura de Software (SAD, secao 3.5).
//
// Nenhum Controller deve montar a resposta manualmente com res.json({...}).
// Todos devem utilizar as funcoes abaixo.
// ==========================================================================

/**
 * Monta e envia uma resposta de sucesso, no padrao:
 * { sucesso: true, mensagem: "", dados: {} }
 *
 * @param {import('express').Response} res - objeto de resposta do Express
 * @param {string} mensagem - mensagem descritiva do resultado
 * @param {any} dados - dados retornados pela operacao (objeto, array, etc)
 * @param {number} statusCode - codigo HTTP (padrao 200)
 */
function respostaSucesso(res, mensagem = '', dados = {}, statusCode = 200) {
  return res.status(statusCode).json({
    sucesso: true,
    mensagem,
    dados,
  });
}

/**
 * Monta e envia uma resposta de erro, no padrao:
 * { sucesso: false, mensagem: "", erro: {} }
 *
 * @param {import('express').Response} res - objeto de resposta do Express
 * @param {string} mensagem - mensagem descritiva do erro
 * @param {any} erro - detalhes do erro (objeto, string, validacao, etc)
 * @param {number} statusCode - codigo HTTP (padrao 400)
 */
function respostaErro(res, mensagem = '', erro = {}, statusCode = 400) {
  return res.status(statusCode).json({
    sucesso: false,
    mensagem,
    erro,
  });
}

module.exports = {
  respostaSucesso,
  respostaErro,
};
