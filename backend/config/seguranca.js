// ==========================================================================
// ARQUIVO: backend/config/seguranca.js
// OBJETIVO: Configuração de segurança da aplicação
// ==========================================================================

const rateLimit = require('express-rate-limit');
const env = require('./env');
const { respostaErro } = require('../utils/respostaPadrao');

// --------------------------------------------------------------------------
// HELMET
// --------------------------------------------------------------------------
const configuracaoHelmet = {
  contentSecurityPolicy: false,
};

// --------------------------------------------------------------------------
// CORS
// --------------------------------------------------------------------------
const origensPermitidas = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.0.11:3000',
];

const configuracaoCors = {
  origin(origin, callback) {
    console.log('Origem da requisição:', origin);

    if (!origin) {
      return callback(null, true);
    }

    if (origensPermitidas.includes(origin)) {
      return callback(null, true);
    }

    console.error('Origem bloqueada:', origin);

    return callback(null, false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// --------------------------------------------------------------------------
// RATE LIMIT
// --------------------------------------------------------------------------
const configuracaoRateLimit = rateLimit({
  windowMs: env.seguranca.rateLimitJanelaMs,
  max: env.seguranca.rateLimitMaximo,
  standardHeaders: true,
  legacyHeaders: false,

  handler(req, res) {
    respostaErro(
      res,
      'Número de requisições excedido. Tente novamente mais tarde.',
      {
        codigo: 'RATE_LIMIT_EXCEDIDO',
      },
      429
    );
  },
});

module.exports = {
  configuracaoHelmet,
  configuracaoCors,
  configuracaoRateLimit,
};