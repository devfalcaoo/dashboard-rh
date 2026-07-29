// ==========================================================================
// ARQUIVO: frontend/js/components/shell.js
// OBJETIVO: Renderizar a sidebar de navegacao e a navbar superior
//           (notificacoes + usuario), reutilizadas em todas as paginas
//           internas. O menu exibido varia conforme o perfil do usuario
//           logado.
// ==========================================================================

const ITENS_MENU = [
  { rota: 'dashboard.html', icone: 'bi-speedometer2', rotulo: 'Dashboard', perfis: ['rh', 'administrador_empresa', 'gestor', 'lider'] },
  { rota: 'empresas.html', icone: 'bi-building', rotulo: 'Empresas', perfis: ['administrador_geral'] },
  { rota: 'usuarios.html', icone: 'bi-person-badge', rotulo: 'Usuários', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'colaboradores.html', icone: 'bi-people', rotulo: 'Colaboradores', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'departamentos.html', icone: 'bi-diagram-3', rotulo: 'Departamentos', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'cargos.html', icone: 'bi-briefcase', rotulo: 'Cargos', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'equipes.html', icone: 'bi-diagram-2', rotulo: 'Equipes', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'competencias.html', icone: 'bi-award', rotulo: 'Competências', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'ciclos.html', icone: 'bi-arrow-repeat', rotulo: 'Ciclos de Avaliação', perfis: ['rh', 'administrador_empresa', 'gestor'] },
  { rota: 'avaliacoes.html', icone: 'bi-clipboard-check', rotulo: 'Avaliações', perfis: 'todos' },
  { rota: 'feedbacks.html', icone: 'bi-chat-square-text', rotulo: 'Feedbacks', perfis: 'todos' },
  { rota: 'pdi.html', icone: 'bi-flag', rotulo: 'PDI', perfis: 'todos' },
  { rota: 'metas.html', icone: 'bi-graph-up-arrow', rotulo: 'Metas', perfis: 'todos' },
  { rota: 'relatorios.html', icone: 'bi-file-earmark-bar-graph', rotulo: 'Relatórios', perfis: ['administrador_empresa', 'rh'] },
  { rota: 'notificacoes.html', icone: 'bi-bell', rotulo: 'Notificações', perfis: 'todos' },
  { rota: 'configuracoes.html', icone: 'bi-gear', rotulo: 'Configurações', perfis: ['administrador_empresa', 'rh'] },
];

function iniciaisDoNome(nome) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

function renderizarShell(paginaAtiva) {
  const usuario = obterUsuarioLogado();
  if (!usuario) return;

  const itensPermitidos = ITENS_MENU.filter(
    (item) => item.perfis === 'todos' || item.perfis.includes(usuario.perfil)
  );

  const menuHtml = itensPermitidos
    .map(
      (item) => `
      <a class="item-menu ${item.rota === paginaAtiva ? 'ativo' : ''}" href="${item.rota}">
        <i class="bi ${item.icone}"></i> ${item.rotulo}
      </a>`
    )
    .join('');

  const sidebarHtml = `
    <aside class="sidebar">
      <div class="marca">
        Gestão de Desempenho
        <small>${usuario.perfil.replace('_', ' ')}</small>
      </div>
      ${menuHtml}
      <div class="rodape-sidebar">
        <a href="#" id="link-sair" class="item-menu"><i class="bi bi-box-arrow-left"></i> Sair</a>
      </div>
    </aside>`;

  document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

  const navbarHtml = `
    <div class="navbar-topo">
      <button class="botao-notificacao" id="botao-notificacoes" title="Notificações">
        <i class="bi bi-bell"></i>
        <span class="badge-contador d-none" id="contador-notificacoes">0</span>
      </button>
      <div class="chip-usuario">
        <div class="avatar-iniciais">${iniciaisDoNome(usuario.nome)}</div>
        <div>
          <div class="fw-semibold">${usuario.nome}</div>
          <div class="text-muted" style="font-size:0.78rem;">${usuario.email}</div>
        </div>
      </div>
    </div>`;

  const areaConteudo = document.querySelector('.conteudo-principal');
  if (areaConteudo) {
    areaConteudo.insertAdjacentHTML('afterbegin', navbarHtml);
  }

  document.getElementById('link-sair')?.addEventListener('click', async (evento) => {
    evento.preventDefault();
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (erro) {
      // Mesmo se o logout no servidor falhar, limpamos a sessao local.
    }
    limparSessao();
    window.location.href = 'login.html';
  });

  document.getElementById('botao-notificacoes')?.addEventListener('click', () => {
    window.location.href = 'notificacoes.html';
  });

  carregarContadorNotificacoes();
}

async function carregarContadorNotificacoes() {
  try {
    const dados = await apiFetch('/notificacoes/nao-lidas');
    const badge = document.getElementById('contador-notificacoes');
    if (!badge) return;
    if (dados.total > 0) {
      badge.textContent = dados.total > 9 ? '9+' : dados.total;
      badge.classList.remove('d-none');
    }
  } catch (erro) {
    // Falha ao carregar contador nao deve impedir o uso da pagina.
    console.warn('Nao foi possivel carregar notificacoes:', erro.message);
  }
}
