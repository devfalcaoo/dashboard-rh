// ==========================================================================
// ARQUIVO: backend/utils/logger.js
// OBJETIVO: Funcao utilitaria simples para registrar erros de execucao em
//           arquivo, dentro de backend/logs/. Este logger e diferente da
//           tabela "logs" do banco (que registra AUDITORIA de negocio:
//           quem fez o que, quando). Este arquivo registra erros tecnicos
//           de execucao do servidor (stack traces, falhas inesperadas).
// ==========================================================================

const fs = require('fs');
const path = require('path');

const CAMINHO_PASTA_LOGS = path.join(__dirname, '..', 'logs');
const CAMINHO_ARQUIVO_ERROS = path.join(CAMINHO_PASTA_LOGS, 'erros.log');

/**
 * Garante que a pasta de logs exista antes de tentar escrever nela.
 */
function garantirPastaLogs() {
  if (!fs.existsSync(CAMINHO_PASTA_LOGS)) {
    fs.mkdirSync(CAMINHO_PASTA_LOGS, { recursive: true });
  }
}

/**
 * Registra um erro tecnico no arquivo backend/logs/erros.log,
 * incluindo data/hora, rota e stack trace.
 *
 * @param {Error} erro - instancia do erro capturado
 * @param {import('express').Request} req - requisicao onde o erro ocorreu
 */
function registrarErroEmArquivo(erro, req) {
  try {
    garantirPastaLogs();

    const dataHora = new Date().toISOString();
    const rota = req ? `${req.method} ${req.originalUrl}` : 'N/A';
    const linhaDeLog = `[${dataHora}] ${rota}\n${erro.stack || erro.message}\n\n`;

    fs.appendFileSync(CAMINHO_ARQUIVO_ERROS, linhaDeLog, 'utf8');
  } catch (erroAoGravarLog) {
    // Se nem o log conseguir ser gravado, ao menos exibimos no console
    // para nao perder totalmente o rastro do problema.
    console.error('Falha ao gravar log de erro em arquivo:', erroAoGravarLog);
  }
}

module.exports = {
  registrarErroEmArquivo,
};
