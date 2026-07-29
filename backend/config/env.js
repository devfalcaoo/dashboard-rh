// ==========================================================================
// ARQUIVO: backend/config/env.js
// OBJETIVO: Carregar as variaveis de ambiente (.env) e validar se todas
//           as variaveis obrigatorias foram informadas antes de o servidor
//           subir. Centraliza o acesso a configuracao em um unico objeto,
//           evitando o uso espalhado de "process.env" pelo projeto.
// ==========================================================================

require('dotenv').config();

// Lista de variaveis que sao obrigatorias para o sistema funcionar
const VARIAVEIS_OBRIGATORIAS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
];

/**
 * Valida se todas as variaveis de ambiente obrigatorias estao presentes.
 * Caso alguma esteja faltando, encerra a aplicacao imediatamente,
 * evitando que o sistema suba em um estado inconsistente.
 */
function validarVariaveisObrigatorias() {
  const variaveisFaltando = VARIAVEIS_OBRIGATORIAS.filter(
    (nomeVariavel) => !process.env[nomeVariavel]
  );

  if (variaveisFaltando.length > 0) {
    console.error('======================================================');
    console.error('ERRO FATAL: variaveis de ambiente obrigatorias ausentes');
    console.error('======================================================');
    variaveisFaltando.forEach((nomeVariavel) => {
      console.error(`  - ${nomeVariavel}`);
    });
    console.error('Verifique o arquivo .env (baseie-se em .env.example).');
    process.exit(1);
  }
}

validarVariaveisObrigatorias();

// Objeto central de configuracao, usado em todo o restante do backend
const env = {
  ambiente: process.env.NODE_ENV || 'development',
  porta: Number(process.env.PORT) || 3000,

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },

  seguranca: {
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5500')
      .split(',')
      .map((origem) => origem.trim()),
    rateLimitJanelaMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaximo: Number(process.env.RATE_LIMIT_MAX) || 300,
  },
};

module.exports = env;
