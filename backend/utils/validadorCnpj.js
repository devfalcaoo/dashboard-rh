// ==========================================================================
// ARQUIVO: backend/utils/validadorCnpj.js
// OBJETIVO: Funcao utilitaria e reutilizavel para validar CNPJ (formato e
//           digitos verificadores), usada pelo cadastro de empresas.
// ==========================================================================

/**
 * Remove qualquer caractere que nao seja digito.
 * @param {string} cnpj
 * @returns {string}
 */
function limparCnpj(cnpj) {
  return String(cnpj || '').replace(/\D/g, '');
}

/**
 * Calcula um digito verificador de CNPJ a partir dos pesos padrao.
 * @param {string} base
 * @param {number[]} pesos
 * @returns {number}
 */
function calcularDigitoVerificador(base, pesos) {
  const soma = base
    .split('')
    .reduce((acumulado, digito, indice) => acumulado + Number(digito) * pesos[indice], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida um CNPJ (formato e digitos verificadores).
 * @param {string} cnpj
 * @returns {boolean}
 */
function validarCnpj(cnpj) {
  const cnpjLimpo = limparCnpj(cnpj);

  if (cnpjLimpo.length !== 14) {
    return false;
  }

  // Rejeita sequencias com todos os digitos iguais (ex: 00000000000000)
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return false;
  }

  const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const base = cnpjLimpo.substring(0, 12);
  const primeiroDigito = calcularDigitoVerificador(base, pesosPrimeiroDigito);
  const segundoDigito = calcularDigitoVerificador(base + primeiroDigito, pesosSegundoDigito);

  return cnpjLimpo === base + String(primeiroDigito) + String(segundoDigito);
}

module.exports = {
  limparCnpj,
  validarCnpj,
};
