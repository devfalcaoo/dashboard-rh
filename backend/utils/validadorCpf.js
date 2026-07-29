// ==========================================================================
// ARQUIVO: backend/utils/validadorCpf.js
// OBJETIVO: Funcao utilitaria e reutilizavel para validar CPF (formato e
//           digitos verificadores), usada pelo cadastro de colaboradores.
// ==========================================================================

/**
 * Remove qualquer caractere que nao seja digito.
 * @param {string} cpf
 * @returns {string}
 */
function limparCpf(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

/**
 * Calcula um digito verificador de CPF a partir dos pesos padrao.
 * @param {string} base
 * @returns {number}
 */
function calcularDigitoVerificador(base) {
  let soma = 0;
  let peso = base.length + 1;

  for (const digito of base) {
    soma += Number(digito) * peso;
    peso -= 1;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida um CPF (formato e digitos verificadores).
 * @param {string} cpf
 * @returns {boolean}
 */
function validarCpf(cpf) {
  const cpfLimpo = limparCpf(cpf);

  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Rejeita sequencias com todos os digitos iguais (ex: 00000000000)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  const base = cpfLimpo.substring(0, 9);
  const primeiroDigito = calcularDigitoVerificador(base);
  const segundoDigito = calcularDigitoVerificador(base + primeiroDigito);

  return cpfLimpo === base + String(primeiroDigito) + String(segundoDigito);
}

module.exports = {
  limparCpf,
  validarCpf,
};
