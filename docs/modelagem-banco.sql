-- ==========================================================================
-- ARQUIVO: docs/modelagem-banco.sql
-- OBJETIVO: Script completo de criacao das tabelas, relacionamentos,
--           indices e triggers do Sistema de Gestao de Desempenho
--           Corporativo (RH), conforme o Documento de Arquitetura de
--           Software (SAD), secao 5.
--
-- COMO EXECUTAR:
--   1. Acesse o painel do Supabase do seu projeto.
--   2. Vá em "SQL Editor" > "New query".
--   3. Cole todo o conteudo deste arquivo e execute (Run).
--   4. Confirme em "Table Editor" que todas as tabelas foram criadas.
--
-- IMPORTANTE:
--   Este script e idempotente para reexecucao segura durante o
--   desenvolvimento (usa "IF NOT EXISTS" e "DROP ... IF EXISTS" em pontos
--   criticos). Em produção, alteracoes futuras devem ser feitas via
--   scripts de migração incrementais, nunca reexecutando este arquivo
--   inteiro sobre uma base ja populada.
-- ==========================================================================

-- Extensao necessaria para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ==========================================================================
-- FUNCAO GENERICA: atualizar automaticamente a coluna updated_at
-- ==========================================================================
create or replace function fn_atualiza_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==========================================================================
-- TABELA: empresas
-- ==========================================================================
create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  razao_social varchar(200) not null,
  cnpj varchar(14) not null unique,
  plano varchar(50) not null default 'padrao',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_empresas_updated_at on empresas;
create trigger trg_empresas_updated_at
  before update on empresas
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: usuarios
-- id referencia auth.users(id) do Supabase Auth
-- ==========================================================================
create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid references empresas(id),
  nome varchar(150) not null,
  email varchar(150) not null unique,
  perfil varchar(30) not null check (
    perfil in (
      'administrador_geral',
      'administrador_empresa',
      'rh',
      'gestor',
      'lider',
      'colaborador'
    )
  ),
  ativo boolean not null default true,
  ultimo_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_usuarios_empresa_email on usuarios (empresa_id, email);

drop trigger if exists trg_usuarios_updated_at on usuarios;
create trigger trg_usuarios_updated_at
  before update on usuarios
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: departamentos
-- ==========================================================================
create table if not exists departamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome varchar(150) not null,
  descricao text,
  responsavel_id uuid references usuarios(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_departamentos_empresa_ativo on departamentos (empresa_id, ativo);

drop trigger if exists trg_departamentos_updated_at on departamentos;
create trigger trg_departamentos_updated_at
  before update on departamentos
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: cargos
-- ==========================================================================
create table if not exists cargos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome varchar(150) not null,
  nivel varchar(30) check (nivel in ('junior', 'pleno', 'senior')),
  departamento_id uuid references departamentos(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cargos_empresa_ativo on cargos (empresa_id, ativo);

drop trigger if exists trg_cargos_updated_at on cargos;
create trigger trg_cargos_updated_at
  before update on cargos
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: colaboradores
-- ==========================================================================
create table if not exists colaboradores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references usuarios(id),
  empresa_id uuid not null references empresas(id),
  cpf varchar(11) not null unique,
  telefone varchar(20),
  data_admissao date,
  departamento_id uuid references departamentos(id),
  cargo_id uuid references cargos(id),
  lider_id uuid references colaboradores(id),
  gestor_id uuid references colaboradores(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_colaboradores_empresa_cpf on colaboradores (empresa_id, cpf);
create index if not exists idx_colaboradores_lider on colaboradores (lider_id);
create index if not exists idx_colaboradores_gestor on colaboradores (gestor_id);

drop trigger if exists trg_colaboradores_updated_at on colaboradores;
create trigger trg_colaboradores_updated_at
  before update on colaboradores
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: equipes
-- ==========================================================================
create table if not exists equipes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome varchar(150) not null,
  lider_id uuid references colaboradores(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_equipes_updated_at on equipes;
create trigger trg_equipes_updated_at
  before update on equipes
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: equipe_membros (associativa N:N)
-- ==========================================================================
create table if not exists equipe_membros (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (equipe_id, colaborador_id)
);

-- ==========================================================================
-- TABELA: categorias_competencias
-- ==========================================================================
create table if not exists categorias_competencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome varchar(100) not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_categorias_competencias_updated_at on categorias_competencias;
create trigger trg_categorias_competencias_updated_at
  before update on categorias_competencias
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: competencias
-- ==========================================================================
create table if not exists competencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  categoria_id uuid references categorias_competencias(id),
  nome varchar(150) not null,
  descricao text,
  peso numeric(5,2) not null default 1.0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competencias_empresa_ativo on competencias (empresa_id, ativo);

drop trigger if exists trg_competencias_updated_at on competencias;
create trigger trg_competencias_updated_at
  before update on competencias
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: ciclos_avaliacao
-- ==========================================================================
create table if not exists ciclos_avaliacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome varchar(150) not null,
  data_inicio date not null,
  data_fim date not null,
  status varchar(20) not null default 'planejado' check (
    status in ('planejado', 'em_andamento', 'encerrado')
  ),
  tipo varchar(10) not null check (tipo in ('90', '180', '360')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ciclos_empresa_status on ciclos_avaliacao (empresa_id, status);

drop trigger if exists trg_ciclos_updated_at on ciclos_avaliacao;
create trigger trg_ciclos_updated_at
  before update on ciclos_avaliacao
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: avaliacoes
-- ==========================================================================
create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references ciclos_avaliacao(id),
  empresa_id uuid not null references empresas(id),
  colaborador_id uuid not null references colaboradores(id),
  avaliador_id uuid not null references colaboradores(id),
  tipo varchar(20) not null check (
    tipo in ('autoavaliacao', 'lider', 'pares', 'subordinado')
  ),
  status varchar(20) not null default 'pendente' check (
    status in ('pendente', 'em_andamento', 'concluida')
  ),
  nota_final numeric(4,2),
  data_conclusao timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_avaliacoes_empresa_ciclo_colab
  on avaliacoes (empresa_id, ciclo_id, colaborador_id);

drop trigger if exists trg_avaliacoes_updated_at on avaliacoes;
create trigger trg_avaliacoes_updated_at
  before update on avaliacoes
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: avaliacao_itens
-- ==========================================================================
create table if not exists avaliacao_itens (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references avaliacoes(id) on delete cascade,
  competencia_id uuid not null references competencias(id),
  nota numeric(4,2) not null check (nota >= 0 and nota <= 10),
  comentario text,
  created_at timestamptz not null default now()
);

create index if not exists idx_avaliacao_itens_avaliacao on avaliacao_itens (avaliacao_id);

-- --------------------------------------------------------------------------
-- TRIGGER: recalcula automaticamente a nota_final da avaliacao sempre que
-- um item de avaliacao (avaliacao_itens) e inserido, atualizado ou excluido.
-- A nota final e a media ponderada das notas por competencia (peso).
-- --------------------------------------------------------------------------
create or replace function fn_calcula_nota_final_avaliacao()
returns trigger as $$
declare
  v_avaliacao_id uuid;
  v_nota_final numeric(4,2);
begin
  v_avaliacao_id := coalesce(new.avaliacao_id, old.avaliacao_id);

  select
    case
      when sum(c.peso) > 0 then round(sum(ai.nota * c.peso) / sum(c.peso), 2)
      else null
    end
  into v_nota_final
  from avaliacao_itens ai
  join competencias c on c.id = ai.competencia_id
  where ai.avaliacao_id = v_avaliacao_id;

  update avaliacoes
  set nota_final = v_nota_final
  where id = v_avaliacao_id;

  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_calcula_nota_final_avaliacao on avaliacao_itens;
create trigger trg_calcula_nota_final_avaliacao
  after insert or update or delete on avaliacao_itens
  for each row execute function fn_calcula_nota_final_avaliacao();

-- --------------------------------------------------------------------------
-- TRIGGER: valida que a competencia do item pertence a mesma empresa da
-- avaliacao (segunda camada de protecao do isolamento multiempresa).
-- --------------------------------------------------------------------------
create or replace function fn_valida_mesma_empresa_avaliacao_item()
returns trigger as $$
declare
  v_empresa_avaliacao uuid;
  v_empresa_competencia uuid;
begin
  select empresa_id into v_empresa_avaliacao from avaliacoes where id = new.avaliacao_id;
  select empresa_id into v_empresa_competencia from competencias where id = new.competencia_id;

  if v_empresa_avaliacao is distinct from v_empresa_competencia then
    raise exception 'Competencia e avaliacao pertencem a empresas diferentes';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_valida_mesma_empresa_avaliacao_item on avaliacao_itens;
create trigger trg_valida_mesma_empresa_avaliacao_item
  before insert or update on avaliacao_itens
  for each row execute function fn_valida_mesma_empresa_avaliacao_item();

-- ==========================================================================
-- TABELA: feedbacks
-- ==========================================================================
create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  colaborador_id uuid not null references colaboradores(id),
  autor_id uuid not null references colaboradores(id),
  tipo varchar(20) not null check (tipo in ('positivo', 'construtivo')),
  mensagem text not null,
  avaliacao_id uuid references avaliacoes(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feedbacks_empresa_colab on feedbacks (empresa_id, colaborador_id);

drop trigger if exists trg_feedbacks_updated_at on feedbacks;
create trigger trg_feedbacks_updated_at
  before update on feedbacks
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: pdis
-- ==========================================================================
create table if not exists pdis (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  colaborador_id uuid not null references colaboradores(id),
  criado_por uuid not null references usuarios(id),
  objetivo text not null,
  competencia_id uuid not null references competencias(id),
  prazo date,
  status varchar(20) not null default 'nao_iniciado' check (
    status in ('nao_iniciado', 'em_andamento', 'concluido')
  ),
  progresso int not null default 0 check (progresso >= 0 and progresso <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdis_empresa_colab on pdis (empresa_id, colaborador_id);

drop trigger if exists trg_pdis_updated_at on pdis;
create trigger trg_pdis_updated_at
  before update on pdis
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: indicadores
-- ==========================================================================
create table if not exists indicadores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome varchar(150) not null,
  descricao text,
  unidade_medida varchar(30),
  created_at timestamptz not null default now()
);

create index if not exists idx_indicadores_empresa on indicadores (empresa_id);

-- ==========================================================================
-- TABELA: metas
-- ==========================================================================
create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  colaborador_id uuid not null references colaboradores(id),
  indicador_id uuid not null references indicadores(id),
  titulo varchar(150) not null,
  valor_meta numeric(12,2) not null,
  valor_atual numeric(12,2) not null default 0,
  prazo date,
  status varchar(20) not null default 'em_andamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_metas_empresa_colab on metas (empresa_id, colaborador_id);

drop trigger if exists trg_metas_updated_at on metas;
create trigger trg_metas_updated_at
  before update on metas
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- TABELA: notificacoes
-- ==========================================================================
create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  usuario_id uuid not null references usuarios(id),
  titulo varchar(150) not null,
  mensagem text not null,
  lida boolean not null default false,
  tipo varchar(50),
  link varchar(255),
  created_at timestamptz not null default now()
);

create index if not exists idx_notificacoes_usuario_lida on notificacoes (usuario_id, lida);

-- ==========================================================================
-- TABELA: logs (auditoria de negocio)
-- ==========================================================================
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id),
  usuario_id uuid references usuarios(id),
  operacao varchar(20) not null check (
    operacao in ('login', 'logout', 'create', 'update', 'delete', 'falha')
  ),
  tabela_afetada varchar(100),
  registro_id uuid,
  ip varchar(45),
  data_hora timestamptz not null default now(),
  detalhes jsonb
);

create index if not exists idx_logs_empresa_data on logs (empresa_id, data_hora);

-- ==========================================================================
-- TABELA: configuracoes
-- ==========================================================================
create table if not exists configuracoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  chave varchar(100) not null,
  valor jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, chave)
);

drop trigger if exists trg_configuracoes_updated_at on configuracoes;
create trigger trg_configuracoes_updated_at
  before update on configuracoes
  for each row execute function fn_atualiza_updated_at();

-- ==========================================================================
-- FIM DO SCRIPT
-- ==========================================================================
