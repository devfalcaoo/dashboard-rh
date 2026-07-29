// ==========================================================================
// ARQUIVO: backend/config/supabaseClient.js
// OBJETIVO: Inicializar o client oficial do Supabase que sera utilizado
//           EXCLUSIVAMENTE pela camada de Models para acesso ao banco.
//
// IMPORTANTE SOBRE SEGURANCA E ARQUITETURA:
// - Utilizamos a "service_role key" porque toda regra de autorizacao e o
//   isolamento multiempresa (empresa_id) sao controlados pela nossa propria
//   aplicacao (middlewares + services + utils/escopoEmpresa.js), e nao por
//   Row Level Security do Supabase.
// - Isso significa que e OBRIGATORIO que toda query feita pelos Models
//   passe pelo filtro de empresa_id. Nunca fazer consulta "solta" sem
//   esse escopo.
// - Este arquivo nunca deve ser importado fora da camada de Models.
// ==========================================================================

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: {
    // O backend nao mantem sessao de usuario final: cada requisicao
    // chega com o token do usuario, que e validado no authMiddleware.
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabase;
