// Inicializa o 'Banco de Dados' no LocalStorage se não existir
if (!localStorage.getItem('bd_usuarios')) {
    localStorage.setItem('bd_usuarios', JSON.stringify([]));
}

// === LÓGICA DA TELA DE CADASTRO ===
const formCadastro = document.getElementById('formCadastro');

if (formCadastro) {
    formCadastro.addEventListener('submit', function(e) {
        e.preventDefault(); // Evita recarregar a página

        // Captura os dados do formulário
        const rm = document.getElementById('rmCad').value;
        const nome = document.getElementById('nomeCad').value;
        const email = document.getElementById('emailCad').value;
        const senha = document.getElementById('senhaCad').value;
        const perfil = document.getElementById('perfilCad').value;

        // Pega os usuários atuais do LocalStorage
        let usuarios = JSON.parse(localStorage.getItem('bd_usuarios'));

        // Verifica se o RM já existe
        const usuarioExiste = usuarios.find(user => user.rm === rm);
        if (usuarioExiste) {
            alert('Erro: Este RM já está cadastrado!');
            return;
        }

        // Cria o objeto do novo usuário
        const novoUsuario = {
            rm: rm,
            nome: nome,
            email: email,
            senha: senha,
            perfil: perfil
        };

        // Salva no banco local
        usuarios.push(novoUsuario);
        localStorage.setItem('bd_usuarios', JSON.stringify(usuarios));

        alert('Usuário cadastrado com sucesso!');
        formCadastro.reset(); // Limpa os campos
    });
}

// === LÓGICA DA TELA DE LOGIN ===
const formLogin = document.getElementById('formLogin');

if (formLogin) {
    formLogin.addEventListener('submit', function(e) {
        e.preventDefault();

        const rmLogin = document.getElementById('rmLogin').value;
        const senhaLogin = document.getElementById('senhaLogin').value;

        // Pega os usuários do LocalStorage (o "|| []" evita erros se o banco estiver vazio)
        const usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];

        // Procura o usuário correspondente
        const usuarioValido = usuarios.find(user => user.rm === rmLogin && user.senha === senhaLogin);

        if (usuarioValido) {
            alert('Login efetuado com sucesso! Bem-vindo(a), ' + usuarioValido.nome);
            
            // Salva o usuário logado para usarmos nas próximas telas
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioValido));

            // Manda TODO MUNDO para a tela principal
            window.location.href = 'aluno.html';
        } else {
            // Avisa o usuário caso ele digite algo errado
            alert('RM ou Senha incorretos. Tente novamente!');
        }
    });
}