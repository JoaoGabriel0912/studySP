// ==========================================
// StudySP - Lógica de Cadastro e Login
// Integrado com a API do Backend para persistência entre navegadores
// ==========================================

// Inicializa o cache local no LocalStorage se não existir
if (!localStorage.getItem('bd_usuarios')) {
    localStorage.setItem('bd_usuarios', JSON.stringify([]));
}

// === VARIÁVEIS GLOBAIS DE CONTROLE DOS MODAIS ===
let dadosUsuarioCadastrado = null;
let timerRedirecionamentoLogin = null;

// === LÓGICA DA TELA DE CADASTRO ===
const formCadastro = document.getElementById('formCadastro');

if (formCadastro) {
    formCadastro.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btnSubmit = formCadastro.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit ? btnSubmit.textContent : 'Cadastrar Usuário';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Cadastrando...';
        }

        // Captura os dados do formulário
        const rm = document.getElementById('rmCad').value.trim();
        const nome = document.getElementById('nomeCad').value.trim();
        const email = document.getElementById('emailCad').value.trim();
        const senha = document.getElementById('senhaCad').value;
        const perfil = document.getElementById('perfilCad').value;

        const dadosNovoUsuario = {
            rm,
            nome,
            email,
            senha,
            perfil
        };

        try {
            // Tenta cadastrar via API no Servidor/Banco de Dados
            const res = await API.cadastrar(dadosNovoUsuario);

            if (res && res.success) {
                // Atualiza também o cache local (preservando a senha para fallback)
                let usuariosLocais = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
                const usuarioCriado = { ...dadosNovoUsuario, ...(res.user || {}), senha: dadosNovoUsuario.senha };
                usuariosLocais = usuariosLocais.filter(u => u.rm !== rm);
                usuariosLocais.push(usuarioCriado);
                localStorage.setItem('bd_usuarios', JSON.stringify(usuariosLocais));

                // Abre a janela flutuante com login, senha e botões de compartilhar/imprimir
                mostrarModalCadastroSucesso(usuarioCriado);
                formCadastro.reset();
                return;
            }

            // Se a API retornou erro específico (ex: RM duplicado)
            if (res && !res.networkError) {
                mostrarToastCadastroErro(res.error || 'Erro ao cadastrar usuário. Verifique os dados!');
                return;
            }

            // Fallback caso o backend esteja temporariamente inacessível
            console.warn('Backend indisponível no momento. Salvando no cache local...');
            let usuariosLocais = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
            if (usuariosLocais.some(u => u.rm === rm)) {
                mostrarToastCadastroErro('Este RM já está cadastrado no sistema local!');
                return;
            }
            usuariosLocais.push(dadosNovoUsuario);
            localStorage.setItem('bd_usuarios', JSON.stringify(usuariosLocais));
            
            // Abre a janela flutuante com as credenciais mesmo em modo offline
            mostrarModalCadastroSucesso(dadosNovoUsuario);
            formCadastro.reset();

        } catch (err) {
            console.error('Erro no cadastro:', err);
            mostrarToastCadastroErro('Erro inesperado ao cadastrar usuário. Tente novamente.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        }
    });
}

// JANELA FLUTUANTE DE SUCESSO NO CADASTRO ESCOLAR (COM LOGIN, SENHA E COMPARTILHAR/IMPRIMIR)
function mostrarModalCadastroSucesso(dados) {
    dadosUsuarioCadastrado = dados;
    const modal = document.getElementById('modal-cadastro-sucesso');
    if (!modal) return;

    const titulo = document.getElementById('modalCadTitulo');
    const badge = document.getElementById('credPerfilBadge');
    const nomeEl = document.getElementById('credNome');
    const rmEl = document.getElementById('credRM');
    const senhaEl = document.getElementById('credSenha');
    const emailEl = document.getElementById('credEmail');

    const tipoPerfil = dados.perfil === 'Professor' ? 'Professor' : 'Aluno';
    if (titulo) titulo.textContent = `${tipoPerfil} Cadastrado com Sucesso!`;
    if (badge) badge.textContent = tipoPerfil;
    if (nomeEl) nomeEl.textContent = dados.nome || '-';
    if (rmEl) rmEl.textContent = dados.rm || '-';
    if (senhaEl) senhaEl.textContent = dados.senha || '-';
    if (emailEl) emailEl.textContent = dados.email || '-';

    modal.classList.remove('hidden');
}

function cadastrarOutroUsuario() {
    const modal = document.getElementById('modal-cadastro-sucesso');
    if (modal) modal.classList.add('hidden');
    const rmInput = document.getElementById('rmCad');
    if (rmInput) rmInput.focus();
}

function irParaLogin() {
    window.location.href = 'login.html';
}

function compartilharCredenciais() {
    if (!dadosUsuarioCadastrado) return;
    const dados = dadosUsuarioCadastrado;
    const textoCompartilhar = `🎓 *StudySP - Ficha Oficial de Acesso*\n` +
        `👤 *Nome:* ${dados.nome}\n` +
        `🏷️ *Perfil:* ${dados.perfil || 'Aluno'}\n` +
        `🔑 *Login / RM:* ${dados.rm}\n` +
        `🔒 *Senha de Acesso:* ${dados.senha}\n` +
        `📧 *E-mail:* ${dados.email}\n` +
        `🌐 *Acesse a Plataforma:* ${window.location.origin || 'StudySP'}`;

    if (navigator.share) {
        navigator.share({
            title: `Dados de Acesso StudySP - ${dados.nome}`,
            text: textoCompartilhar
        }).catch(() => {
            copiarParaAreaTransferencia(textoCompartilhar);
        });
    } else {
        copiarParaAreaTransferencia(textoCompartilhar);
    }
}

function copiarParaAreaTransferencia(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToastCadastroErro('📋 Dados de acesso copiados! Pronto para colar e enviar ao aluno/professor.', '#10b981');
        }).catch(() => {
            copiarFallback(texto);
        });
    } else {
        copiarFallback(texto);
    }
}

function copiarFallback(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        mostrarToastCadastroErro('📋 Dados copiados com sucesso!', '#10b981');
    } catch (e) {
        mostrarToastCadastroErro('Selecione os dados na tela para copiar.');
    }
    document.body.removeChild(textarea);
}

function imprimirFichaAcesso() {
    window.print();
}

function mostrarToastCadastroErro(msg, corBg) {
    const toast = document.getElementById('cadastroToast');
    const texto = document.getElementById('cadastroToastTexto');
    if (toast && texto) {
        texto.textContent = msg;
        if (corBg) toast.style.background = corBg;
        else toast.style.background = '#ef4444';
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
}

// === LÓGICA DA TELA DE LOGIN ===
const formLogin = document.getElementById('formLogin');

if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btnSubmit = formLogin.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit ? btnSubmit.textContent : 'Entrar';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Entrando...';
        }

        const rmLogin = document.getElementById('rmLogin').value.trim();
        const senhaLogin = document.getElementById('senhaLogin').value;

        try {
            // 1. Tenta autenticar na API do Servidor (persistência global)
            const res = await API.login(rmLogin, senhaLogin);

            if (res && res.success && res.user) {
                // Salva o usuário logado para persistir a sessão neste navegador
                localStorage.setItem('usuarioLogado', JSON.stringify(res.user));

                // Exibe a janela flutuante com a mensagem personalizada de boas-vindas
                mostrarModalLoginSucesso(res.user);
                return;
            }

            // Se a API respondeu que os dados estão incorretos
            if (res && !res.networkError) {
                mostrarToastLoginErro(res.error || 'RM ou Senha incorretos. Tente novamente!');
                return;
            }

            // 2. Fallback: Se o servidor estiver indisponível, checa cache local
            console.warn('Backend indisponível no momento. Verificando cache local...');
            const usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
            const usuarioValido = usuarios.find(u => u.rm === rmLogin && u.senha === senhaLogin);

            if (usuarioValido) {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioValido));
                mostrarModalLoginSucesso(usuarioValido);
            } else {
                mostrarToastLoginErro('RM ou Senha incorretos. Verifique suas credenciais!');
            }
        } catch (err) {
            console.error('Erro no login:', err);
            mostrarToastLoginErro('Erro ao processar login. Tente novamente.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        }
    });
}

// JANELA FLUTUANTE DE LOGIN BEM-SUCEDIDO COM BOAS-VINDAS PERSONALIZADAS
function mostrarModalLoginSucesso(user) {
    const modal = document.getElementById('modal-login-sucesso');
    if (!modal) {
        window.location.href = 'aluno.html';
        return;
    }

    const mensagemEl = document.getElementById('loginSucessoMensagem');
    const progressBar = document.getElementById('loginProgressBar');
    
    const perfil = user.perfil || 'Aluno';
    if (mensagemEl) {
        mensagemEl.innerHTML = `Seja bem-vindo(a), ${perfil}: <strong>${user.nome}</strong>!`;
    }

    modal.classList.remove('hidden');

    // Anima a barra de carregamento e redireciona automaticamente
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 50);
    }

    timerRedirecionamentoLogin = setTimeout(() => {
        window.location.href = 'aluno.html';
    }, 1500);
}

function redirecionarAlunoAgora() {
    if (timerRedirecionamentoLogin) clearTimeout(timerRedirecionamentoLogin);
    window.location.href = 'aluno.html';
}

function mostrarToastLoginErro(msg) {
    const toast = document.getElementById('loginToastErro');
    const texto = document.getElementById('loginToastTexto');
    if (toast && texto) {
        texto.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
}

// ==========================================
// GERENCIADOR DE TEMA (CLARO / ESCURO)
// ==========================================
function aplicarTema(tema) {
    const isLight = (tema === 'light');
    if (isLight) {
        document.body.classList.remove('dark-theme');
        document.documentElement.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.documentElement.classList.add('dark-theme');
    }

    const icon = document.getElementById('themeToggleIcon');
    const text = document.getElementById('themeToggleText');
    if (icon) icon.textContent = isLight ? '🌙' : '☀️';
    if (text) text.textContent = isLight ? 'Modo Escuro' : 'Modo Claro';
}

function alternarTema() {
    const isDark = document.body.classList.contains('dark-theme');
    const novoTema = isDark ? 'light' : 'dark';
    localStorage.setItem('tema', novoTema);
    aplicarTema(novoTema);
}

// Inicializa o tema conforme preferência salva no LocalStorage (padrão StudySP: escuro)
document.addEventListener('DOMContentLoaded', function() {
    const temaSalvo = localStorage.getItem('tema');
    aplicarTema(temaSalvo === 'light' ? 'light' : 'dark');
});