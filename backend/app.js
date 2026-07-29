// ==========================================================================
// ARQUIVO: backend/app.js
// OBJETIVO: Configurar a instancia do Express: middlewares globais de
//           seguranca (Helmet, CORS, Rate Limit), parser de JSON, logs de
//           requisicao (morgan), montagem das rotas e, por ultimo, o
//           middleware de tratamento de erros.
//
// Este arquivo NAO inicia o servidor (isso e feito em server.js), apenas
// monta e exporta a aplicacao Express configurada.
// ==========================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const {
  configuracaoHelmet,
  configuracaoCors,
  configuracaoRateLimit,
} = require('./config/seguranca');
const rotasPrincipais = require('./routes/index');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { respostaErro } = require('./utils/respostaPadrao');

const app = express();

// --------------------------------------------------------------------------
// MIDDLEWARES GLOBAIS DE SEGURANCA
// --------------------------------------------------------------------------
app.use(helmet(configuracaoHelmet));
app.use(cors(configuracaoCors));
app.use(configuracaoRateLimit);

// --------------------------------------------------------------------------
// PARSERS
// --------------------------------------------------------------------------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------------------------------
// LOG DE REQUISICOES HTTP
// Em desenvolvimento usamos o formato "dev" (colorido e resumido).
// Em producao usamos o formato "combined" (mais completo, adequado a
// ferramentas de monitoramento).
// --------------------------------------------------------------------------
app.use(morgan(env.ambiente === 'development' ? 'dev' : 'combined'));

// --------------------------------------------------------------------------
// ROTAS
// Todas as rotas da API ficam sob o prefixo /api
// --------------------------------------------------------------------------
app.use('/api', rotasPrincipais);

// --------------------------------------------------------------------------
// ROTA NAO ENCONTRADA (404)
// Qualquer requisicao que nao corresponda a nenhuma rota registrada
// cai aqui, mantendo o padrao de resposta da API.
// --------------------------------------------------------------------------
app.use((req, res) => {
  return respostaErro(
    res,
    'Rota nao encontrada.',
    { rota: `${req.method} ${req.originalUrl}` },
    404
  );
});

// --------------------------------------------------------------------------
// MIDDLEWARE DE TRATAMENTO DE ERROS
// DEVE ser o ultimo middleware registrado.
// --------------------------------------------------------------------------
app.use(errorMiddleware);

module.exports = app;
