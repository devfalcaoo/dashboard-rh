// ==========================================================================
// ARQUIVO: backend/middlewares/errorMiddleware.js
// OBJETIVO: Middleware centralizado de tratamento de erros. Deve ser o
//           ULTIMO middleware registrado em app.js. Qualquer erro lancado
//           (via throw ou next(erro)) em Controllers/Services/Models cai
//           aqui, garantindo que a resposta ao cliente SEMPRE siga o
//           padrao definido em utils/respostaPadrao.js, mesmo em falhas
//           inesperadas.
// ==========================================================================

const { respostaErro } = require('../utils/respostaPadrao');
const { registrarErroEmArquivo } = require('../utils/logger');
const env = require('../config/env');

/**
 * Middleware de tratamento de erros do Express.
 * Assinatura com 4 parametros (err, req, res, next) e obrigatoria para
 * que o Express reconheca esta funcao como um "error handler".
 */
function errorMiddleware(erro, req, res, next) {
  // Registra o erro tecnico em arquivo para investigacao posterior
  registrarErroEmArquivo(erro, req);

  // Em ambiente de desenvolvimento, expomos mais detalhes do erro para
  // facilitar a depuracao. Em producao, escondemos detalhes internos
  // do sistema para nao expor informacoes sensiveis.
  const detalhesErro =
    env.ambiente === 'development'
      ? { mensagem: erro.message, stack: erro.stack, ...(erro.detalhes ? { detalhes: erro.detalhes } : {}) }
      : { mensagem: 'Erro interno no servidor', ...(erro.detalhes ? { detalhes: erro.detalhes } : {}) };

  const codigoStatus = erro.statusCode || 500;

  return respostaErro(
    res,
    erro.mensagemPublica || 'Ocorreu um erro ao processar sua solicitacao.',
    detalhesErro,
    codigoStatus
  );
}

module.exports = errorMiddleware;
