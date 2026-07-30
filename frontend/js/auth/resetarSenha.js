// ==========================================================================
// ARQUIVO: frontend/js/auth/resetarSenha.js
// ==========================================================================
//
// OBJETIVO
// --------------------------------------------------------------------------
// Este arquivo é responsável por controlar todo o fluxo de redefinição de
// senha do sistema.
//
// O usuário acessa esta página através do link enviado pelo Supabase após
// solicitar a recuperação da senha.
//
// RESPONSABILIDADES
// --------------------------------------------------------------------------
// ✓ Verificar se o usuário chegou através de um link válido.
// ✓ Validar a sessão temporária criada pelo Supabase.
// ✓ Validar a nova senha.
// ✓ Confirmar a senha.
// ✓ Atualizar a senha do usuário.
// ✓ Encerrar a sessão temporária.
// ✓ Redirecionar para a tela de login.
// ✓ Exibir mensagens amigáveis.
// ✓ Impedir múltiplos envios do formulário.
//
// OBSERVAÇÃO
// --------------------------------------------------------------------------
// Toda a lógica de redefinição de senha está concentrada neste arquivo.
// O HTML possui apenas a interface.
//
// ==========================================================================

/**
 * ========================================================================
 * ELEMENTOS DA TELA
 * ========================================================================
 */

const formulario = document.getElementById('form-resetar-senha');

const campoNovaSenha = document.getElementById('novaSenha');

const campoConfirmarSenha = document.getElementById('confirmarSenha');

const alerta = document.getElementById('alerta');

const botaoEnviar = formulario.querySelector('button');

/**
 * Controla se existe uma sessão de recuperação válida.
 */
let sessaoRecuperacaoValida = false;

/**
 * ========================================================================
 * EXIBE UMA MENSAGEM PARA O USUÁRIO
 * ========================================================================
 *
 * @param {string} tipo
 * @param {string} mensagem
 */

function exibirMensagem(tipo, mensagem) {

    alerta.className = `alert alert-${tipo}`;

    alerta.textContent = mensagem;

    alerta.classList.remove('d-none');

}

/**
 * ========================================================================
 * LIMPA A ÁREA DE MENSAGENS
 * ========================================================================
 */

function limparMensagem() {

    alerta.className = 'alert d-none';

    alerta.textContent = '';

}

/**
 * ========================================================================
 * ALTERA O ESTADO DO BOTÃO
 * ========================================================================
 *
 * Enquanto a senha está sendo atualizada impedimos múltiplos cliques.
 *
 * @param {boolean} carregando
 */

function alterarEstadoBotao(carregando) {

    if (carregando) {

        botaoEnviar.disabled = true;

        botaoEnviar.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Atualizando senha...
        `;

        return;

    }

    botaoEnviar.disabled = false;

    botaoEnviar.innerHTML = 'Alterar Senha';

}

/**
 * ========================================================================
 * VALIDA A NOVA SENHA
 * ========================================================================
 *
 * Esta função garante que:
 *
 * - A senha possua no mínimo 6 caracteres.
 * - As duas senhas sejam iguais.
 *
 * Caso futuramente seja necessário exigir:
 *
 * ✓ letra maiúscula
 * ✓ número
 * ✓ caractere especial
 *
 * basta alterar esta função.
 *
 * @returns {boolean}
 */

function validarFormulario() {

    limparMensagem();

    const senha = campoNovaSenha.value.trim();

    const confirmar = campoConfirmarSenha.value.trim();

    if (senha.length < 6) {

        exibirMensagem(

            'danger',

            'A senha deve possuir pelo menos 6 caracteres.'

        );

        campoNovaSenha.focus();

        return false;

    }

    if (senha !== confirmar) {

        exibirMensagem(

            'danger',

            'As senhas informadas não coincidem.'

        );

        campoConfirmarSenha.focus();

        return false;

    }

    return true;

}

/**
 * ========================================================================
 * VERIFICA SE O USUÁRIO ACESSOU A PÁGINA ATRAVÉS DO LINK ENVIADO
 * PELO SUPABASE.
 * ========================================================================
 *
 * Esta é uma das partes mais importantes do fluxo.
 *
 * Quando o usuário clica no e-mail o Supabase cria uma sessão temporária.
 *
 * Esta função verifica se essa sessão realmente existe.
 */

async function validarSessaoRecuperacao() {

    limparMensagem();

    try {

        const {

            data,

            error

        } = await window.supabaseClient.auth.getSession();

        if (error) {

            throw error;

        }

        if (!data.session) {

            sessaoRecuperacaoValida = false;

            formulario.style.display = 'none';

            exibirMensagem(

                'danger',

                'O link de recuperação é inválido ou expirou. Solicite uma nova recuperação de senha.'

            );

            return;

        }

        sessaoRecuperacaoValida = true;

    }

    catch (erro) {

        console.error(erro);

        sessaoRecuperacaoValida = false;

        formulario.style.display = 'none';

        exibirMensagem(

            'danger',

            'Não foi possível validar sua sessão de recuperação.'

        );

    }

}

/**
 * ==========================================================================
 * FUNÇÃO: redefinirSenha
 * ==========================================================================
 *
 * OBJETIVO
 * --------------------------------------------------------------------------
 * Atualiza a senha do usuário autenticado através da sessão temporária
 * criada pelo Supabase quando ele acessou o link enviado por e-mail.
 *
 * ETAPAS
 * --------------------------------------------------------------------------
 * 1 - Impede o envio padrão do formulário.
 * 2 - Verifica se existe uma sessão válida.
 * 3 - Valida os campos.
 * 4 - Atualiza a senha.
 * 5 - Encerra a sessão temporária.
 * 6 - Exibe mensagem de sucesso.
 * 7 - Redireciona para o login.
 * ==========================================================================
 */

async function redefinirSenha(evento) {

    evento.preventDefault();

    limparMensagem();

    /**
     * Verifica se realmente existe uma sessão válida.
     */

    if (!sessaoRecuperacaoValida) {

        exibirMensagem(

            'danger',

            'Sua sessão de recuperação expirou. Solicite um novo link.'

        );

        return;

    }

    /**
     * Valida os campos do formulário.
     */

    if (!validarFormulario()) {

        return;

    }

    alterarEstadoBotao(true);

    try {

        /**
         * Obtém a senha informada.
         */

        const novaSenha = campoNovaSenha.value.trim();

        /**
         * Atualiza a senha do usuário.
         */

        const {

            error

        } = await window.supabaseClient.auth.updateUser({

            password: novaSenha

        });

        /**
         * Caso ocorra erro.
         */

        if (error) {

            throw error;

        }

        /**
         * Faz logout da sessão temporária.
         *
         * Isso garante que o usuário precisará entrar novamente
         * utilizando a nova senha.
         */

        await window.supabaseClient.auth.signOut();

        /**
         * Limpa os campos.
         */

        formulario.reset();

        /**
         * Exibe mensagem de sucesso.
         */

        exibirMensagem(

            'success',

            'Senha alterada com sucesso! Você será redirecionado para a tela de login.'

        );

        /**
         * Aguarda alguns segundos antes de voltar ao login.
         */

        setTimeout(() => {

            window.location.href = 'login.html';

        }, 2500);

    }

    catch (erro) {

        console.error(erro);

        exibirMensagem(

            'danger',

            erro.message || 'Não foi possível alterar sua senha.'

        );

    }

    finally {

        alterarEstadoBotao(false);

    }

}

/**
 * ==========================================================================
 * INICIALIZAÇÃO DA PÁGINA
 * ==========================================================================
 *
 * Quando a página é aberta:
 *
 * 1 - Verifica se o link recebido por e-mail é válido.
 * 2 - Cria automaticamente a sessão temporária.
 * 3 - Caso o link tenha expirado, bloqueia o formulário.
 * ==========================================================================
 */

document.addEventListener(

    'DOMContentLoaded',

    async () => {

        await validarSessaoRecuperacao();

    }

);

/**
 * ==========================================================================
 * EVENTO DO FORMULÁRIO
 * ==========================================================================
 */

formulario.addEventListener(

    'submit',

    redefinirSenha

);