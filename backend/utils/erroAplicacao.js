// ==========================================================================
// ARQUIVO: backend/utils/erroAplicacao.js
// OBJETIVO: Classe de erro customizada, usada pelas camadas de Service
//           para sinalizar falhas de regra de negocio (ex: credenciais
//           invalidas, permissao negada, registro nao encontrado) de
//           forma padronizada. O errorMiddleware sabe interpretar
//           "statusCode" e "mensagemPublica" desta classe para montar a
//           resposta HTTP correta.
// ==========================================================================

class ErroAplicacao extends Error {
  /**
   * @param {string} mensagemPublica - mensagem segura para exibir ao usuario final
   * @param {number} statusCode - codigo HTTP correspondente (ex: 400, 401, 403, 404)
   * @param {object|null} detalhes - detalhes adicionais opcionais (ex: erros de validacao)
   */
  constructor(mensagemPublica, statusCode = 400, detalhes = null) {
    super(mensagemPublica);
    this.name = 'ErroAplicacao';
    this.mensagemPublica = mensagemPublica;
    this.statusCode = statusCode;
    this.detalhes = detalhes;
  }
}

module.exports = ErroAplicacao;
