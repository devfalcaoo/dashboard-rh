// ==========================================================================
// ARQUIVO: backend/controllers/empresaController.js
// OBJETIVO: Receber as requisicoes das rotas de empresas, delegar para
//           empresaService e devolver a resposta no padrao unico da API.
// ==========================================================================

const empresaService = require('../services/empresaService');
const auditoriaService = require('../services/auditoriaService');
const { respostaSucesso, respostaErro } = require('../utils/respostaPadrao');
const {
  validarCriarEmpresa,
  validarAtualizarEmpresa,
  validarAtualizarDadosProprios,
} = require('../validators/empresaValidator');

/**
 * POST /api/empresas - Administrador Geral
 */
async function criar(req, res, next) {
  try {
    const { valido, erros } = validarCriarEmpresa(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const empresa = await empresaService.criar({ ...req.body, usuarioLogado: req.usuarioLogado, ip });

    return respostaSucesso(res, 'Empresa criada com sucesso.', { empresa }, 201);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/empresas - Administrador Geral
 */
async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamanhoPagina = Number(req.query.tamanhoPagina) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

    const resultado = await empresaService.listar({ pagina, tamanhoPagina, ativo });

    return respostaSucesso(res, 'Empresas listadas com sucesso.', resultado);
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/empresas/:id - Administrador Geral
 */
async function buscarPorId(req, res, next) {
  try {
    const empresa = await empresaService.buscarPorId(req.params.id);
    return respostaSucesso(res, 'Empresa encontrada.', { empresa });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * PUT /api/empresas/:id - Administrador Geral
 */
async function atualizar(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarEmpresa(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const empresa = await empresaService.atualizar({
      id: req.params.id,
      ...req.body,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Empresa atualizada com sucesso.', { empresa });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * PATCH /api/empresas/:id/status - Administrador Geral (ativar/inativar)
 */
async function alterarStatus(req, res, next) {
  try {
    if (typeof req.body.ativo !== 'boolean') {
      return respostaErro(res, 'Dados invalidos.', { erros: ['O campo "ativo" e obrigatorio e deve ser booleano.'] }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const empresa = await empresaService.alterarStatus({
      id: req.params.id,
      ativo: req.body.ativo,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Status da empresa atualizado com sucesso.', { empresa });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * GET /api/empresas/minha - Administrador da Empresa / RH
 */
async function buscarMinhaEmpresa(req, res, next) {
  try {
    const empresa = await empresaService.buscarMinhaEmpresa(req.empresaId);
    return respostaSucesso(res, 'Dados da empresa carregados com sucesso.', { empresa });
  } catch (erro) {
    return next(erro);
  }
}

/**
 * PUT /api/empresas/minha - Administrador da Empresa / RH
 */
async function atualizarMinhaEmpresa(req, res, next) {
  try {
    const { valido, erros } = validarAtualizarDadosProprios(req.body);
    if (!valido) {
      return respostaErro(res, 'Dados invalidos.', { erros }, 422);
    }

    const ip = auditoriaService.extrairIp(req);
    const empresa = await empresaService.atualizarDadosProprios({
      empresaId: req.empresaId,
      razaoSocial: req.body.razaoSocial,
      usuarioLogado: req.usuarioLogado,
      ip,
    });

    return respostaSucesso(res, 'Dados da empresa atualizados com sucesso.', { empresa });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  alterarStatus,
  buscarMinhaEmpresa,
  atualizarMinhaEmpresa,
};
