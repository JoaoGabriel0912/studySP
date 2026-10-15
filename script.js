// ==========================================
// StudySP - Lógica de Cadastro e Login
// Integrado com a API do Backend para persistência entre navegadores
// ==========================================

// Inicializa o cache local no LocalStorage se não existir
if (!localStorage.getItem('bd_usuarios')) {
    localStorage.setItem('bd_usuarios', JSON.stringify([]));
}

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

                alert('Usuário cadastrado com sucesso no banco de dados!');
                formCadastro.reset();
                window.location.href = 'login.html';
                return;
            }

            // Se a API retornou erro específico (ex: RM duplicado)
            if (res && !res.networkError) {
                alert('Erro ao cadastrar: ' + (res.error || 'Não foi possível cadastrar'));
                return;
            }

            // Fallback caso o backend esteja temporariamente inacessível
            console.warn('Backend indisponível no momento. Salvando no cache local...');
            let usuariosLocais = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
            if (usuariosLocais.some(u => u.rm === rm)) {
                alert('Erro: Este RM já está cadastrado localmente!');
                return;
            }
            usuariosLocais.push(dadosNovoUsuario);
            localStorage.setItem('bd_usuarios', JSON.stringify(usuariosLocais));
            alert('Aviso: Servidor offline. Usuário cadastrado no armazenamento local deste navegador!');
            formCadastro.reset();
            window.location.href = 'login.html';

        } catch (err) {
            console.error('Erro no cadastro:', err);
            alert('Erro inesperado ao cadastrar usuário. Tente novamente.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        }
    });
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
                alert('Login efetuado com sucesso! Bem-vindo(a), ' + res.user.nome);
                
                // Salva o usuário logado para persistir a sessão neste navegador
                localStorage.setItem('usuarioLogado', JSON.stringify(res.user));

                // Manda para a tela principal
                window.location.href = 'aluno.html';
                return;
            }

            // Se a API respondeu que os dados estão incorretos
            if (res && !res.networkError) {
                alert(res.error || 'RM ou Senha incorretos. Tente novamente!');
                return;
            }

            // 2. Fallback: Se o servidor estiver indisponível, checa cache local
            console.warn('Backend indisponível no momento. Verificando cache local...');
            const usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
            const usuarioValido = usuarios.find(u => u.rm === rmLogin && u.senha === senhaLogin);

            if (usuarioValido) {
                alert('Login efetuado em modo offline! Bem-vindo(a), ' + usuarioValido.nome);
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioValido));
                window.location.href = 'aluno.html';
            } else {
                alert('RM ou Senha incorretos, ou servidor backend indisponível. Verifique suas credenciais!');
            }
        } catch (err) {
            console.error('Erro no login:', err);
            alert('Erro ao processar login. Tente novamente.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        }
    });
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