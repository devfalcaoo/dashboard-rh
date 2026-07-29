// ==========================================================================
// ARQUIVO: frontend/js/config/apiConfig.js
// OBJETIVO: Ponto unico de configuracao e chamada a API. Centraliza a URL
//           base, o envio do token de autenticacao e a interpretacao do
//           padrao de resposta { sucesso, mensagem, dados/erro }.
//
// Nenhuma pagina deve chamar fetch() diretamente contra a API - sempre
// passar por apiFetch() abaixo, garantindo tratamento consistente de
// erros e de sessao expirada em todo o sistema.
// ==========================================================================

const API_BASE_URL = 'http://localhost:3001/api';

const ChaveSessao = {
  TOKEN: 'rh_access_token',
  USUARIO: 'rh_usuario_logado',
};

function obterToken() {
  return localStorage.getItem(ChaveSessao.TOKEN);
}

function salvarSessao({ accessToken, usuario }) {
  localStorage.setItem(ChaveSessao.TOKEN, accessToken);
  localStorage.setItem(ChaveSessao.USUARIO, JSON.stringify(usuario));
}

function limparSessao() {
  localStorage.removeItem(ChaveSessao.TOKEN);
  localStorage.removeItem(ChaveSessao.USUARIO);
}

function obterUsuarioLogado() {
  const bruto = localStorage.getItem(ChaveSessao.USUARIO);
  return bruto ? JSON.parse(bruto) : null;
}

/**
 * Executa uma chamada a API, injetando o token de autenticacao e
 * interpretando o padrao de resposta unico do backend.
 *
 * @param {string} caminho - ex: '/colaboradores' ou '/auth/login'
 * @param {RequestInit} opcoes - opcoes padrao do fetch (method, body, etc)
 * @param {{ binario?: boolean }} extras - se binario=true, retorna um Blob (relatorios)
 * @returns {Promise<any>} os "dados" da resposta em caso de sucesso
 */
async function apiFetch(caminho, opcoes = {}, extras = {}) {
  const cabecalhos = { ...(opcoes.headers || {}) };
  const token = obterToken();

  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  if (opcoes.body && !(opcoes.body instanceof FormData)) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, { ...opcoes, headers: cabecalhos });

  if (resposta.status === 401) {
    limparSessao();
    window.location.href = '/pages/login.html';
    throw new Error('Sessao expirada. Faca login novamente.');
  }

  if (extras.binario) {
    if (!resposta.ok) {
      throw new Error('Nao foi possivel gerar o arquivo solicitado.');
    }
    return resposta.blob();
  }

  const corpo = await resposta.json().catch(() => null);

  if (!corpo || corpo.sucesso !== true) {
    const mensagem = corpo?.mensagem || 'Ocorreu um erro ao comunicar com o servidor.';
    const erro = new Error(mensagem);
    erro.detalhes = corpo?.erro;
    throw erro;
  }

  return corpo.dados;
}

/**
 * Faz o download de um Blob retornado pela API (relatorios PDF/Excel).
 */
function baixarArquivo(blob, nomeArquivo) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Redireciona para o login se nao houver sessao ativa. Chamada no topo
 * de toda pagina interna (protegida).
 */
function exigirSessao() {
  if (!obterToken()) {
    window.location.href = '/pages/login.html';
  }
}
