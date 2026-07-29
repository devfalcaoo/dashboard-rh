// ==========================================================================
// ARQUIVO: backend/controllers/cicloAvaliacaoController.js
// OBJETIVO: Receber as requisicoes das rotas de ciclos de avaliacao,
//           delegar para cicloAvaliacaoService e devolver a resposta no
//           padrao unico da API.
// ==========================================================================

const cicloAvaliacaoService = require('../services/cicloAvaliacaoService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarCiclo,
  validarAtualizarCiclo,
  validarEncerrarCiclo,
} = require('../validators/cicloAvaliacaoValidator');

async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarCiclo(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const ciclo = await cicloAvaliacaoService.criar({
      ...req.body,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Ciclo de avaliacao criado com sucesso.', { ciclo }, 201);
  } catch (erro) {
    return next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const { status } = req.query;

    const resultado = await cicloAvaliacaoService.listar({
      empresaId: req.empresaId,
      pagina,
      tamanhoPagina,
      status,
    });

    return respostaSucesso(res, 'Ciclos de avaliacao listados com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const ciclo = await cicloAvaliacaoService.buscarPorId({
      id: req.params.id,
      empresaId: req.empresaId,
    });
    return respostaSucesso(res, 'Ciclo de avaliacao encontrado.', { ciclo });
  } catch (erro) {
    return next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarCiclo(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const ciclo = await cicloAvaliacaoService.atualizar({
      id: req.params.id,
      empresaId: req.empresaId,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Ciclo de avaliacao atualizado com sucesso.', { ciclo });
  } catch (erro) {
    return next(erro);
  }
}

async function abrir(req, res, next) {
  try {
    const ip = auditoriaService.extrairIp(req);
    const resultado = await cicloAvaliacaoService.abrir({
      id: req.params.id,
      empresaId: req.empresaId,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(
      res,
      `Ciclo aberto com sucesso. ${resultado.totalAvaliacoesGeradas} avaliacao(oes) gerada(s).`,
      resultado
    );
  } catch (erro) {
    return next(erro);
  }
}

async function encerrar(req, res, next) {
  try {
    const { valido, erros } = validarEncerrarCiclo(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const ciclo = await cicloAvaliacaoService.encerrar({
      id: req.params.id,
      empresaId: req.empresaId,
      justificativa: req.body.justificativa,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Ciclo de avaliacao encerrado com sucesso.', { ciclo });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  abrir,
  encerrar,
};
