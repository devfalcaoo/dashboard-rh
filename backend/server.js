// ==========================================================================
// ARQUIVO: backend/server.js
// OBJETIVO: Ponto de entrada da aplicacao. Responsavel apenas por iniciar
//           o servidor HTTP na porta configurada. Toda a configuracao do
//           Express (middlewares, rotas) fica isolada em app.js, seguindo
//           o principio de separacao de responsabilidades.
// ==========================================================================

const app = require('./app');
const env = require('./config/env');

const servidor = app.listen(env.porta, () => {
  console.log('======================================================');
  console.log('  Sistema de Gestao de Desempenho Corporativo - RH');
  console.log('======================================================');
  console.log(`  Ambiente : ${env.ambiente}`);
  console.log(`  Porta    : ${env.porta}`);
  console.log(`  Health   : http://localhost:${env.porta}/api/health`);
  console.log('======================================================');
});

// Tratamento de encerramento gracioso do servidor (ex: Ctrl+C, deploy)
process.on('SIGINT', () => {
  console.log('\nEncerrando servidor...');
  servidor.close(() => {
    console.log('Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  servidor.close(() => {
    process.exit(0);
  });
});
