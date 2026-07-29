// ==========================================================================
// ARQUIVO: backend/config/constantes.js
// OBJETIVO: Centralizar todos os enums/constantes do sistema em um unico
//           lugar, evitando "strings magicas" espalhadas pelo codigo e
//           garantindo que Controllers, Services, Validators e Middlewares
//           utilizem sempre os mesmos valores.
// ==========================================================================

// Perfis de usuario suportados pelo sistema (ver SAD, secao 7)
const PERFIS = {
  ADMINISTRADOR_GERAL: 'administrador_geral',
  ADMINISTRADOR_EMPRESA: 'administrador_empresa',
  RH: 'rh',
  GESTOR: 'gestor',
  LIDER: 'lider',
  COLABORADOR: 'colaborador',
};

// Lista de todos os perfis validos, util para validacoes genericas
const LISTA_PERFIS = Object.values(PERFIS);

// Status possiveis de um ciclo de avaliacao
const STATUS_CICLO = {
  PLANEJADO: 'planejado',
  EM_ANDAMENTO: 'em_andamento',
  ENCERRADO: 'encerrado',
};

// Tipos de ciclo/avaliacao suportados
const TIPOS_CICLO = {
  NOVENTA: '90',
  CENTO_E_OITENTA: '180',
  TRESCENTOS_E_SESSENTA: '360',
};

// Tipos de avaliacao dentro de um ciclo
const TIPOS_AVALIACAO = {
  AUTOAVALIACAO: 'autoavaliacao',
  LIDER: 'lider',
  PARES: 'pares',
  SUBORDINADO: 'subordinado',
};

// Status possiveis de uma avaliacao individual
const STATUS_AVALIACAO = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
};

// Tipos de feedback
const TIPOS_FEEDBACK = {
  POSITIVO: 'positivo',
  CONSTRUTIVO: 'construtivo',
};

// Status possiveis de um PDI
const STATUS_PDI = {
  NAO_INICIADO: 'nao_iniciado',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
};

// Operacoes registradas na tabela de auditoria (logs)
const OPERACOES_LOG = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CRIACAO: 'create',
  ALTERACAO: 'update',
  EXCLUSAO: 'delete',
  FALHA: 'falha',
};

module.exports = {
  PERFIS,
  LISTA_PERFIS,
  STATUS_CICLO,
  TIPOS_CICLO,
  TIPOS_AVALIACAO,
  STATUS_AVALIACAO,
  TIPOS_FEEDBACK,
  STATUS_PDI,
  OPERACOES_LOG,
};
