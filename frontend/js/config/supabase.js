// ==========================================================================
// ARQUIVO: frontend/js/config/supabase.js
// OBJETIVO: Criar uma única instância global do cliente Supabase.
// ==========================================================================

(() => {

    console.log('Inicializando cliente Supabase...');

    const SUPABASE_URL =
        'https://krpgimxnsnkqeihgmdzs.supabase.co';

    const SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycGdpbXhuc25rcWVpaGdtZHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTE0MzUsImV4cCI6MjEwMDcyNzQzNX0.IS_e9J7f_be5p2QYJqQeCOnjcQ98l197L-IBaLTKGHw';

    if (!window.supabase) {

        console.error('SDK do Supabase não foi carregado.');

        return;

    }

    if (window.supabaseClient) {

        console.log('Cliente Supabase já inicializado.');

        return;

    }

    const { createClient } = window.supabase;

    window.supabaseClient = createClient(

        SUPABASE_URL,

        SUPABASE_ANON_KEY,

        {

            auth: {

                persistSession: true,

                autoRefreshToken: true,

                detectSessionInUrl: true

            }

        }

    );

    console.log('Cliente criado com sucesso.');

})();