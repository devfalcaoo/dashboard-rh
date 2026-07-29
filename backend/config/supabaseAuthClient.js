// ==========================================================================
// ARQUIVO: backend/config/supabaseAuthClient.js
// OBJETIVO: Client do Supabase dedicado EXCLUSIVAMENTE a operacoes de
//           autenticacao (login, logout, recuperacao/alteracao de senha e
//           validacao de token). Usa a "anon key", diferente do client de
//           config/supabaseClient.js (que usa a "service_role key" e e
//           usado apenas pela camada de Models para acesso as tabelas de
//           negocio).
//
// POR QUE DOIS CLIENTS DIFERENTES:
// - As acoes de autenticacao (login, resetPasswordForEmail, getUser) sao
//   feitas "em nome do usuario final" e devem usar a chave publica (anon),
//   que e a mesma que o frontend usaria.
// - Acoes administrativas de auth (logout forcado de uma sessao, alteracao
//   de senha via admin) exigem privilegios elevados e usam o client de
//   service_role (config/supabaseClient.js), atraves de supabase.auth.admin.
// ==========================================================================

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabaseAuthClient = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabaseAuthClient;
