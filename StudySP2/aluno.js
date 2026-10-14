// ==========================================
// AUTENTICAÇÃO E INICIALIZAÇÃO
// ==========================================
const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

if (!usuarioLogado) {
    window.location.href = 'login.html';
} else {
    // 1. Libera os painéis secretos se for Professor
    if (usuarioLogado.perfil === 'Professor') {
        const pConteudo = document.getElementById('painelProfessorConteudo');
        const pSimulado = document.getElementById('painelProfessorSimulado');
        if(pConteudo) pConteudo.style.display = 'block';
        if(pSimulado) {
            pSimulado.style.display = 'block';
            if (typeof renderizarListaQuestoesProfessor === 'function') {
                renderizarListaQuestoesProfessor();
            }
        }
    }

    // 2. Coloca o nome e email na tela (Isso que estava faltando!)
    if(document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').textContent = usuarioLogado.nome;
    }
    if(document.getElementById('userEmailDisplay')) {
        document.getElementById('userEmailDisplay').textContent = usuarioLogado.email;
    }
    if(document.getElementById('sidebarUserName')) {
        document.getElementById('sidebarUserName').textContent = usuarioLogado.nome || 'Aluno';
    }
    if(document.getElementById('sidebarUserRole')) {
        document.getElementById('sidebarUserRole').textContent = (usuarioLogado.perfil === 'Professor') ? 'Professor' : 'Estudante';
    }
    
    // 3. Garante que as variáveis existem para não dar erro
    if (!usuarioLogado.pontos) usuarioLogado.pontos = 0;
    if (!usuarioLogado.sequencia) usuarioLogado.sequencia = 0;
    if (!usuarioLogado.tempoEstudadoSegundos) usuarioLogado.tempoEstudadoSegundos = 0;
    if (!usuarioLogado.multiplicador) usuarioLogado.multiplicador = 1.0;
    if (!usuarioLogado.totalQuestoes) usuarioLogado.totalQuestoes = 0;
    if (!usuarioLogado.totalAcertos) usuarioLogado.totalAcertos = 0;
    
    // Variáveis do TCC e Conquistas
    if (!usuarioLogado.mensagensTCC) usuarioLogado.mensagensTCC = 0;
    if (!usuarioLogado.mensagensTCCHoje) usuarioLogado.mensagensTCCHoje = 0;
    if (!usuarioLogado.ultimaDataChat) usuarioLogado.ultimaDataChat = new Date().toLocaleDateString();
    if (!usuarioLogado.conquistas) usuarioLogado.conquistas = [];
    if (!usuarioLogado.onboardingTCC) usuarioLogado.onboardingTCC = 0;
    
    // Reseta limite diário do chat
    if (usuarioLogado.ultimaDataChat !== new Date().toLocaleDateString()) {
        usuarioLogado.ultimaDataChat = new Date().toLocaleDateString();
        usuarioLogado.mensagensTCCHoje = 0;
        atualizarBanco(usuarioLogado);
    }

    // --- LÓGICA DE OFENSIVA (STREAK) DIÁRIA ---
    const hoje = new Date().toLocaleDateString();
    
    if (!usuarioLogado.ultimaDataAcesso) {
        usuarioLogado.sequencia = 1;
        usuarioLogado.ultimaDataAcesso = hoje;
        atualizarBanco(usuarioLogado);
    } else if (usuarioLogado.ultimaDataAcesso !== hoje) {
        let partesUltimo = usuarioLogado.ultimaDataAcesso.split('/');
        let partesHoje = hoje.split('/');
        
        let dataUltimo = new Date(`${partesUltimo[2]}-${partesUltimo[1]}-${partesUltimo[0]}`);
        let dataHoje = new Date(`${partesHoje[2]}-${partesHoje[1]}-${partesHoje[0]}`);
        let diferencaDias = Math.floor((dataHoje - dataUltimo) / (1000 * 60 * 60 * 24));

        if (diferencaDias === 1) {
            usuarioLogado.sequencia++;
        } else if (diferencaDias > 1) {
            usuarioLogado.sequencia = 1;
        }
        
        usuarioLogado.ultimaDataAcesso = hoje;
        atualizarBanco(usuarioLogado);
    }
    // ------------------------------------------
    
    // 4. Atualiza os textos de pontos na tela
    if(document.getElementById('pontosDisplay')) {
        document.getElementById('pontosDisplay').textContent = `${Math.floor(usuarioLogado.pontos)} pts`;
    }
    if(document.getElementById('userStreak')) {
        document.getElementById('userStreak').textContent = `${usuarioLogado.sequencia} Dias de Ofensiva`;
    }
    if(document.getElementById('sequenciaStats')) {
        document.getElementById('sequenciaStats').innerHTML = `🔥 Sequência: <strong>${usuarioLogado.sequencia} Dias</strong>`;
    }
}

// ==========================================
// NOTIFICAÇÕES PASSAGEIRAS NO CANTO (TOAST)
// ==========================================
function mostrarToastCanto(titulo, mensagem, tipo = 'warning', duracaoMs = 4500) {
    const container = document.getElementById('toast-canto-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-card toast-${tipo}`;

    let icone = '⏱️';
    let rotulo = 'AVISO DE TEMPO';
    if (tipo === 'info') {
        icone = '🎯';
        rotulo = 'SIMULADO';
    } else if (tipo === 'success') {
        icone = '✅';
        rotulo = 'SUCESSO';
    }

    toast.innerHTML = `
        <div class="toast-card-glow"></div>
        <div class="toast-card-icon">${icone}</div>
        <div class="toast-card-content">
            <div class="toast-card-header">
                <span class="toast-card-badge">${rotulo}</span>
                <button type="button" class="toast-card-close" aria-label="Fechar">&times;</button>
            </div>
            <h4 class="toast-card-title">${titulo}</h4>
            <p class="toast-card-text">${mensagem}</p>
        </div>
        <div class="toast-card-progress">
            <div class="toast-card-progress-bar" style="animation-duration: ${duracaoMs}ms;"></div>
        </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    const fechar = () => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-leaving');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 380);
    };

    const btnClose = toast.querySelector('.toast-card-close');
    if (btnClose) {
        btnClose.onclick = (e) => {
            e.stopPropagation();
            fechar();
        };
    }

    let timer = setTimeout(fechar, duracaoMs);

    toast.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        const progressBar = toast.querySelector('.toast-card-progress-bar');
        if (progressBar) progressBar.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
        const progressBar = toast.querySelector('.toast-card-progress-bar');
        if (progressBar) progressBar.style.animationPlayState = 'running';
        timer = setTimeout(fechar, 2000);
    });
}

// O resto do seu código (DESEMPENHO DINÂMICO, etc) continua a partir daqui...

// ==========================================
// DESEMPENHO DINÂMICO (INSTRUMENTO DE PONTEIRO / GAUGE)
// ==========================================
function atualizarDesempenho() {
    let porcentagem = 0;
    if (usuarioLogado && usuarioLogado.totalQuestoes > 0) {
        porcentagem = Math.round((usuarioLogado.totalAcertos / usuarioLogado.totalQuestoes) * 100);
    }
    porcentagem = Math.max(0, Math.min(100, porcentagem));

    // Atualiza texto digital do progresso
    const progressText = document.querySelector('.progress-value');
    if (progressText) {
        progressText.textContent = `${porcentagem}%`;
    }

    // Calcula a rotação angular do ponteiro (-90deg para 0% até +90deg para 100%)
    const angulo = -90 + (porcentagem * 1.8);
    const needle = document.getElementById('gaugeNeedle');
    const needleBody = document.getElementById('needleBody');
    const statusBadge = document.getElementById('gaugeStatus');

    if (needle) {
        needle.style.transform = `translateX(-50%) rotate(${angulo}deg)`;
    }

    // Critérios de classificação:
    // 0 a 40: Ruim (Vermelho)
    // 41 a 70: Médio (Amarelo)
    // 71 a 100: Bom (Verde)
    let statusClass = 'status-ruim';
    let statusTexto = 'Ruim';
    let needleColor = 'linear-gradient(to top, #1e293b 0%, #dc2626 100%)';

    if (porcentagem <= 40) {
        statusClass = 'status-ruim';
        statusTexto = 'Ruim';
        needleColor = 'linear-gradient(to top, #1e293b 0%, #dc2626 100%)';
    } else if (porcentagem <= 70) {
        statusClass = 'status-medio';
        statusTexto = 'Médio';
        needleColor = 'linear-gradient(to top, #1e293b 0%, #f59e0b 100%)';
    } else {
        statusClass = 'status-bom';
        statusTexto = 'Bom';
        needleColor = 'linear-gradient(to top, #1e293b 0%, #10b981 100%)';
    }

    if (statusBadge) {
        statusBadge.className = `gauge-status-badge ${statusClass}`;
        statusBadge.textContent = statusTexto;
    }

    if (needleBody) {
        needleBody.style.background = needleColor;
    }

    // Compatibilidade com elemento legado
    const circularProgress = document.querySelector('.circular-progress');
    if (circularProgress) {
        let graus = (porcentagem / 100) * 360;
        circularProgress.style.background = `conic-gradient(var(--primary-color) ${graus}deg, var(--border-color) 0deg)`;
    }
}

// ==========================================
// NAVEGAÇÃO E TEMA
// ==========================================
function toggleMenuConfig() { 
    document.getElementById('configDropdown').classList.toggle('hidden'); 
    document.getElementById('conquistasDropdown').classList.add('hidden'); 
}
function toggleConquistas() { 
    document.getElementById('conquistasDropdown').classList.toggle('hidden'); 
    document.getElementById('configDropdown').classList.add('hidden'); 
    renderizarConquistas(); 
}
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('tema', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}
// Sempre inicia no tema escuro (padrão StudySP)
if (localStorage.getItem('tema') !== 'light') {
    document.body.classList.add('dark-theme');
}

// Se for professor, renomeia o item "Estudar" para "Publicar" na barra lateral
if (usuarioLogado && usuarioLogado.perfil === 'Professor') {
    const menuEstudar = document.getElementById('menu-estudar');
    if (menuEstudar) {
        menuEstudar.innerHTML = '<span class="nav-icon">📤</span><span class="nav-label">Publicar</span>';
    }
}

document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
        this.classList.add('active'); 

        document.getElementById('secao-inicio').classList.add('hidden');
        document.getElementById('secao-estudar').classList.add('hidden');
        document.getElementById('secao-pomodoro').classList.add('hidden');
        document.getElementById('secao-simulados').classList.add('hidden');
        document.getElementById('secao-tcc').classList.add('hidden'); 
        
        document.getElementById('btnChatIA').style.display = 'none';
        document.getElementById('chatIAModal').classList.add('hidden');

        if (this.id === 'menu-inicio') {
            const secaoInicio = document.getElementById('secao-inicio');
            secaoInicio.classList.remove('hidden');
            secaoInicio.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (this.id === 'menu-estudar') {
            document.getElementById('secao-estudar').classList.remove('hidden');
            // Atualiza o título da seção com base no perfil
            const tituloSecao = document.getElementById('titulo-secao-estudar');
            const subtituloSecao = document.getElementById('subtitulo-secao-estudar');
            if (usuarioLogado && usuarioLogado.perfil === 'Professor') {
                if(tituloSecao) tituloSecao.innerHTML = '📤 Publicar Conteúdo';
                if(subtituloSecao) subtituloSecao.textContent = 'Publique aulas, vídeos e materiais organizados por disciplina para os alunos';
            } else {
                if(tituloSecao) tituloSecao.innerHTML = '📚 Material de Estudos';
                if(subtituloSecao) subtituloSecao.textContent = 'Acesse as aulas e conteúdos organizados por disciplina';
            }
            document.getElementById('btnChatIA').style.display = 'block';
            carregarMateria('Português'); 
        } else if (this.id === 'menu-pomodoro') {
            document.getElementById('secao-pomodoro').classList.remove('hidden');
            atualizarVisorPomodoro();
        } else if (this.id === 'menu-simulados') {
            document.getElementById('secao-simulados').classList.remove('hidden');
            cancelarSimulado();
            if (usuarioLogado && usuarioLogado.perfil === 'Professor' && typeof renderizarListaQuestoesProfessor === 'function') {
                renderizarListaQuestoesProfessor();
            }
        } else if (this.id === 'menu-tcc') {
            document.getElementById('secao-tcc').classList.remove('hidden');
            iniciarChatTCC();
        }
    });
});
if(document.getElementById('btnChatIA')) document.getElementById('btnChatIA').style.display = 'none';

// ==========================================
// PERFIL E GRAVAÇÃO DE DADOS
// ==========================================
function atualizarBanco(usuarioAtualizado) {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));
    let usuariosBD = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let index = usuariosBD.findIndex(u => u.rm === usuarioAtualizado.rm);
    if(index !== -1) {
        usuariosBD[index] = usuarioAtualizado;
        localStorage.setItem('bd_usuarios', JSON.stringify(usuariosBD));
    }
}

function salvarPerfil() {
    usuarioLogado.endereco = document.getElementById('perfilEndereco').value;
    usuarioLogado.cidade = document.getElementById('perfilCidade').value;
    usuarioLogado.telefone = document.getElementById('perfilTelefone').value;
    usuarioLogado.idade = document.getElementById('perfilIdade').value;
    usuarioLogado.bio = document.getElementById('perfilBio').value;
    atualizarBanco(usuarioLogado);
    mostrarToastCanto('Perfil Atualizado', 'Suas informações foram salvas com sucesso!', 'success');
}

function carregarDadosPerfil() {
    if(usuarioLogado.endereco) document.getElementById('perfilEndereco').value = usuarioLogado.endereco;
    if(usuarioLogado.cidade) document.getElementById('perfilCidade').value = usuarioLogado.cidade;
    if(usuarioLogado.telefone) document.getElementById('perfilTelefone').value = usuarioLogado.telefone;
    if(usuarioLogado.idade) document.getElementById('perfilIdade').value = usuarioLogado.idade;
    if(usuarioLogado.bio) document.getElementById('perfilBio').value = usuarioLogado.bio;
    if(usuarioLogado.foto) {
        document.getElementById('userAvatarDisplay').style.backgroundImage = `url(${usuarioLogado.foto})`;
        document.getElementById('userAvatarDisplay').innerText = '';
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarAvatar) {
            sidebarAvatar.style.backgroundImage = `url(${usuarioLogado.foto})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.innerText = '';
        }
    }
}

document.getElementById('inputFoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            usuarioLogado.foto = event.target.result; 
            atualizarBanco(usuarioLogado); 
            document.getElementById('userAvatarDisplay').style.backgroundImage = `url(${usuarioLogado.foto})`;
            document.getElementById('userAvatarDisplay').innerText = '';
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            if (sidebarAvatar) {
                sidebarAvatar.style.backgroundImage = `url(${usuarioLogado.foto})`;
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
                sidebarAvatar.innerText = '';
            }
            carregarRank(); 
            mostrarToastCanto('Foto Atualizada', 'Sua foto de perfil foi atualizada com sucesso!', 'success');
        };
        reader.readAsDataURL(file);
    }
});

function sairDaConta() { localStorage.removeItem('usuarioLogado'); window.location.href = 'login.html'; }


// RANK REAL DOS ALUNOS E PÓDIO
// ==========================================
function carregarRank() {
    const rankList = document.getElementById('rankList');
    let usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let alunos = usuarios.filter(user => user.perfil === 'Aluno');
    
    alunos.forEach(aluno => {
        if (!aluno.pontos) aluno.pontos = 0;
        if (!aluno.sequencia) aluno.sequencia = 0;
    });
    
    // Ordena do maior para o menor ponto
    alunos.sort((a, b) => b.pontos - a.pontos);
    
    // ----------------------------------------------------
    // 1. RENDERIZAR O PÓDIO (TOP 3 NA TELA INÍCIO)
    // ----------------------------------------------------
    const podioContainer = document.getElementById('podio-container');
    if (podioContainer) {
        let top3 = alunos.slice(0, 3);
        let htmlPodio = '';
        
       
           // Estrutura a ordem visual da tela: Esquerda(2º), Centro(1º), Direita(3º)
        const posicoes = [
            { rank: 2, aluno: top3[1], class: 'podio-prata', height: '240px' },
            { rank: 1, aluno: top3[0], class: 'podio-ouro', height: '290px' },
            { rank: 3, aluno: top3[2], class: 'podio-bronze', height: '200px' }
        ];
        
    

        posicoes.forEach(pos => {
            if (pos.aluno) {
                // Se o aluno tiver foto de perfil, usa a foto. Se não, fica o emoji padrão
                let avatarStyle = pos.aluno.foto ? `background-image: url(${pos.aluno.foto}); color: transparent; background-size: cover; background-position: center;` : ``;
                
                // O .split(' ')[0] pega apenas o primeiro nome do aluno para não quebrar a tela
                htmlPodio += `
                    <div class="degrau-podio ${pos.class}" style="height: ${pos.height};">
                        <div class="podio-avatar" style="${avatarStyle}">👤</div>
                        <div class="podio-posicao">${pos.rank}º</div>
                        <div class="podio-nome">${pos.aluno.nome.split(' ')[0]}</div>
                        <div class="podio-pontos">${Math.floor(pos.aluno.pontos)} pts</div>
                        <button class="btn-ver-perfil" onclick="mostrarPerfilRank('${pos.aluno.rm}')">Ver Perfil</button>
                    </div>
                `;
            } else {
                // Caso ainda não existam 3 alunos cadastrados no sistema
                htmlPodio += `
                    <div class="degrau-podio ${pos.class}" style="height: ${pos.height}; opacity: 0.3;">
                        <div class="podio-posicao">${pos.rank}º</div>
                        <div class="podio-nome">Vazio</div>
                    </div>
                `;
            }
        });
        podioContainer.innerHTML = htmlPodio;
    }

    // ----------------------------------------------------
    // 2. RENDERIZAR A LISTA LATERAL COMPLETA
    // ----------------------------------------------------
    if (rankList) {
        rankList.innerHTML = ''; 
        let htmlRank = '';
        alunos.forEach((aluno, index) => {
            let isVoce = aluno.rm === usuarioLogado.rm ? " (Você)" : "";
            let bgStyle = isVoce ? 'background-color: rgba(0, 123, 255, 0.1); border-radius: 5px;' : '';
            let avatarStyle = aluno.foto ? `background-image: url(${aluno.foto}); color: transparent; background-size: cover; background-position: center;` : ``;
            htmlRank += `
                <div class="rank-item" style="${bgStyle}">
                    <span class="posicao">#${index + 1}</span>
                    <div class="avatar-circle" style="width:30px; height:30px; font-size:14px; ${avatarStyle}">👤</div>
                    <div class="rank-info">
                        <span class="rank-nome">${aluno.nome}${isVoce}</span>
                        <span class="rank-stats">🔥 ${aluno.sequencia} Dias | ⭐ ${Math.floor(aluno.pontos)} pts</span>
                    </div>
                    <button onclick="mostrarPerfilRank('${aluno.rm}')" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-weight:bold;">Ver</button>
                </div>
            `;
        });
        rankList.innerHTML = htmlRank;
    }
}
function mostrarPerfilRank(rmDestino) {
    let usuarios = JSON.parse(localStorage.getItem('bd_usuarios'));
    let alunoAlvo = usuarios.find(u => u.rm === rmDestino);
    if(alunoAlvo) {
        alert(`🎓 Perfil de ${alunoAlvo.nome}\n📍 Cidade: ${alunoAlvo.cidade || 'Não informada'}\n⭐ Pontos: ${Math.floor(alunoAlvo.pontos || 0)}\n📝 Biografia: "${alunoAlvo.bio || 'Sem biografia.'}"`);
    }
}

// ==========================================
// ESTUDAR (CONTEÚDO) - ATUALIZADO PARA LER O BANCO DO PROFESSOR
// ==========================================
function carregarMateria(materiaNome) {
    // 1. Atualiza os botões visuais da matéria selecionada
    document.querySelectorAll('.materia-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === materiaNome) btn.classList.add('active');
    });

    // 2. Puxa os conteúdos salvos no banco de dados
    let conteudos = JSON.parse(localStorage.getItem('bd_conteudos')) || [];
    
    // 3. Filtra apenas as aulas da matéria que o aluno clicou
    let filtrados = conteudos.filter(c => c.materia.toLowerCase() === materiaNome.toLowerCase());

    const container = document.getElementById('conteudo-materia');

    // 4. Se o professor não publicou nada ainda:
    if (filtrados.length === 0) {
        container.innerHTML = `
            <div class="tema-card">
                <h3 style="color:var(--primary-color);">${materiaNome}</h3>
                <p style="margin-top:10px; color:var(--text-muted); line-height: 1.6;">Nenhum conteúdo publicado pelo professor para esta matéria ainda.</p>
            </div>
        `;
        return;
    }

    const isProfessor = usuarioLogado && usuarioLogado.perfil === 'Professor';

    // 5. Se tem aula, monta a tela com Textos, Links, Anexos e Vídeos:
    container.innerHTML = filtrados.map(item => {
        const safeId = String(item.id || '');
        const safeMateria = (item.materia || materiaNome || '').replace(/'/g, "\\'");

        // Monta o título e o texto (usando white-space para respeitar as quebras de linha do professor)
        let htmlCard = `<div class="tema-card" style="margin-bottom: 25px; position: relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
                <h3 style="color:var(--primary-color); font-size: 20px; margin: 0;">${item.titulo}</h3>
                ${isProfessor ? `
                    <button type="button" 
                            class="btn-excluir-publicacao" 
                            onclick="excluirConteudo('${safeId}', '${safeMateria}')" 
                            title="Excluir esta publicação">
                        <span>🗑️</span> Excluir Publicação
                    </button>
                ` : ''}
            </div>
            <p style="margin: 15px 0; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${item.texto}</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
        `;

        // Se o professor colocou um link externo
        if (item.link) {
            htmlCard += `<a href="${item.link}" target="_blank" style="padding: 8px 15px; background: rgba(0, 123, 255, 0.1); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 13px;">🔗 Acessar Link Externo</a>`;
        }

        // Se o professor enviou um arquivo (PDF ou Imagem)
        if (item.arquivo) {
            htmlCard += `<a href="${item.arquivo}" download="${item.nomeArquivo}" style="padding: 8px 15px; background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; color: #4CAF50; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 13px;">📎 Baixar ${item.nomeArquivo}</a>`;
        }
        
        htmlCard += `</div>`; // Fecha a div dos botões

        // Se o professor colocou um ID de vídeo do YouTube
        if (item.video) {
            htmlCard += `
                <div style="margin-top:20px; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:10px; border: 1px solid var(--border-color);">
                    <iframe src="https://www.youtube.com/embed/${item.video}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
                </div>
            `;
        }

        htmlCard += `</div>`; // Fecha o cartão inteiro
        return htmlCard;
    }).reverse().join(''); // .reverse() faz a aula mais nova aparecer primeiro no topo
}

function toggleChatIA() { document.getElementById('chatIAModal').classList.toggle('hidden'); }

// ==========================================
// POMODORO E MULTIPLICADOR
// ==========================================
let pomodoroTimer = null;
let tempoRestante = 0;
let tempoTotalSessao = 0;
let modoEstudo = true; 
let rodando = false;

function atualizarVisorPomodoro() {
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;
    if(document.getElementById('timerDisplay')){
        document.getElementById('timerDisplay').textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    }
    if (tempoTotalSessao > 0 && document.getElementById('clockHand')) {
        let graus = (1 - (tempoRestante / tempoTotalSessao)) * 360;
        document.getElementById('clockHand').style.transform = `rotate(${graus}deg)`;
    }
}
function calcularMultiplicador() {
    let horasEstudadas = usuarioLogado.tempoEstudadoSegundos / 3600;
    let novoMultiplicador = 1.0;
    if (horasEstudadas >= 3) novoMultiplicador = 1.5;
    else if (horasEstudadas >= 2) novoMultiplicador = 1.4;
    else if (horasEstudadas >= 1) novoMultiplicador = 1.2;

    usuarioLogado.multiplicador = novoMultiplicador;
    atualizarBanco(usuarioLogado);
    
    if(document.getElementById('multiplicadorDisplay')) document.getElementById('multiplicadorDisplay').textContent = `${novoMultiplicador.toFixed(1)}x`;
    let h = Math.floor(horasEstudadas);
    let m = Math.floor((usuarioLogado.tempoEstudadoSegundos % 3600) / 60);
    if(document.getElementById('totalEstudadoDisplay')) document.getElementById('totalEstudadoDisplay').textContent = `${h}h ${m}m`;
}
function iniciarPomodoro() {
    if (rodando) return;
    if (tempoRestante === 0) {
        let inputId = modoEstudo ? 'tempoEstudo' : 'tempoDescanso';
        tempoTotalSessao = parseInt(document.getElementById(inputId).value) * 60;
        tempoRestante = tempoTotalSessao;
    }
    document.getElementById('estadoPomodoro').textContent = modoEstudo ? "A estudar..." : "Em descanso...";
    document.getElementById('estadoPomodoro').style.color = modoEstudo ? "var(--primary-color)" : "#4CAF50";
    rodando = true;
    pomodoroTimer = setInterval(() => {
        if (tempoRestante > 0) {
            tempoRestante--;
            if (modoEstudo) {
                usuarioLogado.tempoEstudadoSegundos++;
                if (usuarioLogado.tempoEstudadoSegundos % 60 === 0) calcularMultiplicador(); 
            }
            atualizarVisorPomodoro();
        } else {
            clearInterval(pomodoroTimer);
            rodando = false;
            modoEstudo = !modoEstudo; 
            tempoRestante = 0;
            alert(modoEstudo ? "O descanso acabou! Hora de voltar ao foco." : "Ciclo concluído! Hora de descansar.");
            iniciarPomodoro(); 
        }
    }, 1000);
}
function pausarPomodoro() { clearInterval(pomodoroTimer); rodando = false; document.getElementById('estadoPomodoro').textContent = "Em pausa"; }
function resetarPomodoro() {
    clearInterval(pomodoroTimer); rodando = false; modoEstudo = true;
    tempoRestante = parseInt(document.getElementById('tempoEstudo').value) * 60;
    tempoTotalSessao = tempoRestante; atualizarVisorPomodoro();
    document.getElementById('estadoPomodoro').textContent = "A aguardar";
    if(document.getElementById('clockHand')) document.getElementById('clockHand').style.transform = `rotate(0deg)`;
}

// ==========================================
// ==========================================
// BANCO DE QUESTÕES PROVÃO PAULISTA (ORGANIZADO POR EDIÇÃO)
// ==========================================
let questoesProfessor = JSON.parse(localStorage.getItem('bd_simulados')) || [];

// BANCO OFICIAL — questões baseadas nos conteúdos cobrados nas edições 2023 e 2024
const bancoQuestoes = {
    '1º Ano - 2023': [
        { pergunta: "Na obra 'Os Lusíadas', de Camões, o episódio do 'Velho do Restelo' representa principalmente:", opcoes: ["A glorificação das navegações portuguesas","A crítica ao espírito expansionista e seus custos humanos","A homenagem ao rei Dom Manuel I","O elogio à bravura dos marinheiros lusitanos"], correta: 1, tema: "Literatura Portuguesa / Camões" },
        { pergunta: "Qual a fórmula química do Ácido Sulfúrico?", opcoes: ["HCl", "H₂SO₄", "NaCl", "CO₂"], correta: 1, tema: "Química Inorgânica: Ácidos" },
        { pergunta: "Um ciclista percorre 30 km em 2 horas. Qual a sua velocidade média?", opcoes: ["10 km/h", "15 km/h", "20 km/h", "30 km/h"], correta: 1, tema: "Física: Cinemática" },
        { pergunta: "O Modernismo brasileiro teve início com a Semana de Arte Moderna de 1922. Qual cidade a sediou?", opcoes: ["Rio de Janeiro", "Salvador", "São Paulo", "Recife"], correta: 2, tema: "Literatura Brasileira: Modernismo" },
        { pergunta: "Na matemática, a soma dos ângulos internos de um triângulo é sempre:", opcoes: ["90°", "180°", "270°", "360°"], correta: 1, tema: "Matemática: Geometria Plana" },
        { pergunta: "O processo de fotossíntese ocorre nas células que possuem:", opcoes: ["Mitocôndrias", "Ribossomos", "Cloroplastos", "Lisossomos"], correta: 2, tema: "Biologia: Célula Vegetal" },
        { pergunta: "A Revolução Industrial teve início no século XVIII em qual país?", opcoes: ["França", "Estados Unidos", "Alemanha", "Inglaterra"], correta: 3, tema: "História: Revolução Industrial" },
        { pergunta: "Em Inglês, qual é a tradução correta de 'She is studying for the exam'?", opcoes: ["Ela estudou para a prova","Ela está estudando para a prova","Ela vai estudar para a prova","Ela estudará para a prova"], correta: 1, tema: "Inglês: Present Continuous" },
        { pergunta: "O Brasil possui a maior floresta tropical do mundo. Como ela é chamada?", opcoes: ["Floresta do Pacífico", "Amazônia", "Cerrado", "Mata Atlântica"], correta: 1, tema: "Geografia: Biomas Brasileiros" },
        { pergunta: "Qual filósofo grego é considerado o 'pai da filosofia ocidental'?", opcoes: ["Aristóteles", "Platão", "Sócrates", "Epicuro"], correta: 2, tema: "Filosofia: Origens do Pensamento Grego" }
    ],
    '1º Ano - 2024': [
        { pergunta: "Leia: 'O jogador, que estava cansado, saiu do campo.' A oração sublinhada é:", opcoes: ["Oração coordenada sindética","Oração subordinada adverbial","Oração subordinada adjetiva explicativa","Oração subordinada substantiva"], correta: 2, tema: "Português: Sintaxe / Orações Subordinadas" },
        { pergunta: "Na tabela periódica, os elementos do Grupo 18 são chamados de:", opcoes: ["Metais alcalinos", "Halogênios", "Gases nobres", "Metais de transição"], correta: 2, tema: "Química: Tabela Periódica" },
        { pergunta: "Segundo a 1ª Lei de Newton (Inércia), um corpo em repouso permanece em repouso a não ser que:", opcoes: ["Seja aquecido","Uma força resultante não nula atue sobre ele","Seja colocado em movimento por si mesmo","A gravidade deixe de agir"], correta: 1, tema: "Física: Leis de Newton" },
        { pergunta: "A progressão aritmética (PA) de razão 3 que começa em 2 é: 2, 5, 8, ___, ___. Quais são os próximos termos?", opcoes: ["10 e 12", "11 e 14", "14 e 17", "11 e 13"], correta: 1, tema: "Matemática: Progressão Aritmética" },
        { pergunta: "Na genética mendeliana, quando dois alelos de um gene são diferentes, o indivíduo é chamado de:", opcoes: ["Homozigoto dominante", "Homozigoto recessivo", "Heterozigoto", "Haplóide"], correta: 2, tema: "Biologia: Genética Mendeliana" },
        { pergunta: "O período do Brasil Colônia durou aproximadamente de 1500 até:", opcoes: ["1808", "1822", "1889", "1930"], correta: 1, tema: "História: Brasil Colonial" },
        { pergunta: "Qual fenômeno geográfico explica as diferentes estações do ano na Terra?", opcoes: ["Rotação da Terra","Translação da Terra com eixo inclinado","Atração gravitacional da Lua","Variações na distância Terra-Sol"], correta: 1, tema: "Geografia: Movimentos da Terra" },
        { pergunta: "O existencialismo de Jean-Paul Sartre é sintetizado na frase:", opcoes: ["'Penso, logo existo'","'A existência precede a essência'","'O homem é a medida de todas as coisas'","'Só sei que nada sei'"], correta: 1, tema: "Filosofia: Existencialismo" },
        { pergunta: "Em Inglês, complete: 'I ___ to school every day.' (ir - rotina)", opcoes: ["am going", "go", "went", "will go"], correta: 1, tema: "Inglês: Simple Present" },
        { pergunta: "O processo de globalização intensificado no final do século XX é caracterizado principalmente pela:", opcoes: ["Redução do comércio internacional","Integração econômica, cultural e tecnológica mundial","Fortalecimento das fronteiras nacionais","Diminuição da circulação de pessoas"], correta: 1, tema: "Sociologia: Globalização" }
    ],
    '2º Ano - 2023': [
        { pergunta: "O Naturalismo brasileiro tem como obra mais representativa:", opcoes: ["Dom Casmurro","O Cortiço","Iracema","Memórias de um Sargento de Milícias"], correta: 1, tema: "Literatura: Naturalismo Brasileiro" },
        { pergunta: "Em química orgânica, os hidrocarbonetos são compostos formados essencialmente por:", opcoes: ["Carbono e Nitrogênio", "Carbono e Hidrogênio", "Oxigênio e Hidrogênio", "Carbono e Oxigênio"], correta: 1, tema: "Química Orgânica: Hidrocarbonetos" },
        { pergunta: "A fórmula para calcular a energia elétrica consumida é E = P × t. Se uma lâmpada de 100W fica ligada por 5 horas, a energia consumida em Wh é:", opcoes: ["20 Wh", "500 Wh", "100 Wh", "105 Wh"], correta: 1, tema: "Física: Energia Elétrica" },
        { pergunta: "Qual é o valor de log₁₀(1000)?", opcoes: ["2", "3", "4", "10"], correta: 1, tema: "Matemática: Logaritmos" },
        { pergunta: "Na cadeia alimentar, os seres que produzem matéria orgânica a partir de luz solar são os:", opcoes: ["Consumidores primários", "Decompositores", "Produtores (Autótrofos)", "Consumidores secundários"], correta: 2, tema: "Biologia: Ecologia / Cadeia Alimentar" },
        { pergunta: "A Proclamação da República no Brasil ocorreu em:", opcoes: ["7 de setembro de 1822", "15 de novembro de 1889", "13 de maio de 1888", "22 de abril de 1500"], correta: 1, tema: "História: República Velha" },
        { pergunta: "O fenômeno do El Niño é causado pelo:", opcoes: ["Aquecimento das águas do Oceano Atlântico","Aquecimento anormal das águas do Oceano Pacífico Equatorial","Resfriamento do Oceano Índico","Variação dos ventos alísios no Atlântico"], correta: 1, tema: "Geografia: Climatologia" },
        { pergunta: "Para Karl Marx, a principal contradição do capitalismo está entre:", opcoes: ["Estado e mercado","Burguesia e proletariado","Cidade e campo","Indústria e comércio"], correta: 1, tema: "Sociologia: Marxismo" },
        { pergunta: "Em Inglês, 'She has lived in São Paulo since 2010' usa qual tempo verbal?", opcoes: ["Simple Past", "Present Perfect", "Past Perfect", "Present Continuous"], correta: 1, tema: "Inglês: Present Perfect" },
        { pergunta: "Em uma função do 2º grau f(x) = ax² + bx + c, o gráfico (parábola) abre para cima quando:", opcoes: ["a < 0", "a = 0", "a > 0", "b > 0"], correta: 2, tema: "Matemática: Função Quadrática" }
    ],
    '2º Ano - 2024': [
        { pergunta: "O Pré-Modernismo brasileiro é marcado por autores como Euclides da Cunha, Lima Barreto e Monteiro Lobato. A obra 'Os Sertões' de Euclides trata sobre:", opcoes: ["A escravidão no Nordeste","A Guerra de Canudos e o sertanejo","A vida na capital Rio de Janeiro","A imigração europeia no Sul"], correta: 1, tema: "Literatura: Pré-Modernismo" },
        { pergunta: "Na isomeria óptica, moléculas que são imagens especulares não sobreponíveis são chamadas de:", opcoes: ["Isômeros de posição", "Isômeros de função", "Enantiômeros", "Diastereoisômeros"], correta: 2, tema: "Química Orgânica: Isomeria Óptica" },
        { pergunta: "O Teorema de Pitágoras afirma que em todo triângulo retângulo: a² = b² + c². Para um triângulo com catetos 3 e 4, a hipotenusa é:", opcoes: ["5", "6", "7", "8"], correta: 0, tema: "Matemática: Geometria / Pitágoras" },
        { pergunta: "A 2ª Lei de Termodinâmica está relacionada com o conceito de:", opcoes: ["Conservação de energia", "Entropia", "Força elétrica", "Pressão dos gases"], correta: 1, tema: "Física: Termodinâmica" },
        { pergunta: "O Sistema Nervoso Central (SNC) é composto por:", opcoes: ["Nervos e gânglios","Encéfalo e medula espinhal","Coração e pulmões","Rins e bexiga"], correta: 1, tema: "Biologia: Sistema Nervoso" },
        { pergunta: "O período conhecido como 'Era Vargas' no Brasil compreende os anos de:", opcoes: ["1922 - 1945", "1930 - 1954", "1889 - 1930", "1945 - 1964"], correta: 1, tema: "História: Era Vargas" },
        { pergunta: "A teoria da Deriva Continental foi proposta por:", opcoes: ["Charles Darwin", "Alfred Wegener", "Isaac Newton", "Albert Einstein"], correta: 1, tema: "Geografia: Tectônica de Placas" },
        { pergunta: "Max Weber conceituou 'ação social' como aquela que:", opcoes: ["Beneficia toda a sociedade","É orientada pela conduta de outros","É imposta pelo Estado","Visa apenas o lucro econômico"], correta: 1, tema: "Sociologia: Weber" },
        { pergunta: "Em Inglês, qual opção usa corretamente o Past Perfect? 'By the time she arrived, he ___ already left.'", opcoes: ["has", "had", "have", "was"], correta: 1, tema: "Inglês: Past Perfect" },
        { pergunta: "Qual é o resultado de √(144) + 5²?", opcoes: ["29", "37", "41", "35"], correta: 1, tema: "Matemática: Operações com Radicais" }
    ],
    '3º Ano - 2023': [
        { pergunta: "O Concretismo foi um movimento literário brasileiro da década de 1950 que valorizava principalmente:", opcoes: ["A narrativa romanesca e sentimental","A forma visual do poema na página e o jogo com palavras","A poesia épica de exaltação nacional","O verso livre sem nenhuma estrutura"], correta: 1, tema: "Literatura: Vanguardas Brasileiras" },
        { pergunta: "A reação de saponificação produz sabão a partir de:", opcoes: ["Ácido + Água","Éster (gordura) + Base forte (NaOH)","Álcool + Ácido","Sal + Ácido"], correta: 1, tema: "Química Orgânica: Saponificação" },
        { pergunta: "Uma partícula com carga elétrica q = 2C move-se com velocidade v em um campo magnético B. A força magnética sobre ela é calculada por:", opcoes: ["F = q/v", "F = qvB", "F = q + vB", "F = v/B"], correta: 1, tema: "Física: Eletromagnetismo" },
        { pergunta: "Em Matemática Financeira, o Montante no sistema de Juros Compostos é calculado por:", opcoes: ["M = C + i.n", "M = C(1+i)ⁿ", "M = C × i", "M = C - i.n"], correta: 1, tema: "Matemática: Juros Compostos" },
        { pergunta: "A mutação gênica é uma alteração na sequência de bases do:", opcoes: ["RNA Ribossômico", "DNA", "Proteína", "Lipídio"], correta: 1, tema: "Biologia: Mutações e Evolução" },
        { pergunta: "A Guerra Fria (1947-1991) foi um conflito ideológico entre:", opcoes: ["EUA e China","URSS e China","EUA e URSS (Capitalismo vs. Socialismo)","Europa Ocidental e Ásia"], correta: 2, tema: "História: Guerra Fria" },
        { pergunta: "O Brasil, como maior produtor de café do mundo no início do século XX, adotava a política econômica do 'café com leite'. Quais estados se alternavam no poder?", opcoes: ["SP e MG", "SP e RJ", "MG e RS", "BA e PE"], correta: 0, tema: "História: República Velha / Café com Leite" },
        { pergunta: "Émile Durkheim definiu o conceito de 'fato social' como aquele que é:", opcoes: ["Individual e subjetivo","Exterior, coercitivo e geral","Econômico e mensurável","Político e estatal"], correta: 1, tema: "Sociologia: Durkheim" },
        { pergunta: "Em Inglês, 'If I had studied harder, I ___ the exam.' Qual é a forma correta no 3rd Conditional?", opcoes: ["will pass", "would pass", "would have passed", "had passed"], correta: 2, tema: "Inglês: Conditionals (3rd)" },
        { pergunta: "Um número complexo z = 3 + 4i. Qual é o módulo |z|?", opcoes: ["3", "4", "5", "7"], correta: 2, tema: "Matemática: Números Complexos" }
    ],
    '3º Ano - 2024': [
        { pergunta: "A crônica literária brasileira se consolidou como gênero com autores como Machado de Assis e Rubem Braga. A crônica se caracteriza por:", opcoes: ["Longa narrativa épica com heróis","Texto curto e reflexivo sobre o cotidiano, publicado em jornais","Poema épico de exaltação histórica","Conto de terror sobrenatural"], correta: 1, tema: "Literatura: Gêneros Textuais / Crônica" },
        { pergunta: "Na Química, a lei da conservação das massas (Lei de Lavoisier) afirma que:", opcoes: ["A massa dos produtos é maior que a dos reagentes","A massa total dos reagentes igual à dos produtos","A massa desaparece durante a reação","Apenas a massa dos gases se conserva"], correta: 1, tema: "Química: Estequiometria / Lavoisier" },
        { pergunta: "Em Física Moderna, a equação de Einstein E = mc² relaciona:", opcoes: ["Energia com força e aceleração","Massa com velocidade da luz ao quadrado (energia)","Pressão com volume","Temperatura com calor"], correta: 1, tema: "Física: Relatividade / Einstein" },
        { pergunta: "Calcule a derivada de f(x) = 3x² + 2x - 5:", opcoes: ["6x + 2", "3x + 2", "6x - 5", "2x + 2"], correta: 0, tema: "Matemática: Cálculo Diferencial / Derivadas" },
        { pergunta: "O processo de respiração celular aeróbia produz como subprodutos:", opcoes: ["Glicose e O₂","CO₂, H₂O e ATP (energia)","Apenas ATP","Apenas CO₂"], correta: 1, tema: "Biologia: Respiração Celular" },
        { pergunta: "A Ditadura Militar no Brasil durou de 1964 até:", opcoes: ["1978", "1982", "1985", "1988"], correta: 2, tema: "História: Ditadura Militar Brasileira" },
        { pergunta: "O processo de urbanização acelerada no Brasil nas décadas de 1950-1980 gerou como consequência direta:", opcoes: ["Redução da desigualdade social","Crescimento das favelas e periferias nas grandes cidades","Melhora geral da qualidade de vida","Fortalecimento da agricultura familiar"], correta: 1, tema: "Geografia: Urbanização Brasileira" },
        { pergunta: "O Iluminismo do século XVIII defendia princípios como:", opcoes: ["Fé religiosa acima da razão","Razão, liberdade e igualdade entre os homens","Poder absoluto dos reis","Manutenção da sociedade feudal"], correta: 1, tema: "Filosofia / História: Iluminismo" },
        { pergunta: "Em Inglês, complete com a voz passiva correta: 'The book ___ written by Machado de Assis.'", opcoes: ["is", "was", "has", "were"], correta: 1, tema: "Inglês: Passive Voice" },
        { pergunta: "Um vetor da amostra tem média 8 e desvio padrão 2. O coeficiente de variação (CV = σ/μ × 100%) é:", opcoes: ["16%", "25%", "4%", "20%"], correta: 1, tema: "Matemática: Estatística" }
    ],
    'Simulado Geral': [
        { pergunta: "O texto narrativo é caracterizado por elementos como narrador, personagens, enredo, espaço e tempo. A instância que conta a história é chamada de:", opcoes: ["Autor real", "Narrador", "Personagem principal", "Leitor implícito"], correta: 1, tema: "Português: Teoria da Narrativa" },
        { pergunta: "A Lei de Hess afirma que a variação de entalpia de uma reação é:", opcoes: ["Sempre positiva","Independente do caminho seguido","Dependente da velocidade da reação","Sempre negativa"], correta: 1, tema: "Química: Termoquímica / Lei de Hess" },
        { pergunta: "Quando a soma dos ângulos internos de um polígono regular é 1080°, quantos lados ele possui?", opcoes: ["6", "7", "8", "9"], correta: 2, tema: "Matemática: Polígonos" },
        { pergunta: "A ondas de rádio, micro-ondas, infravermelho, luz visível, ultravioleta, raios X e gama fazem parte do:", opcoes: ["Espectro sonoro","Espectro eletromagnético","Espectro de emissão atômica","Campo magnético terrestre"], correta: 1, tema: "Física: Ondas Eletromagnéticas" },
        { pergunta: "O aquecimento global é intensificado pelo 'efeito estufa' causado principalmente pela emissão de:", opcoes: ["Oxigênio (O₂)","Gás carbônico (CO₂) e metano (CH₄)","Nitrogênio (N₂)","Argônio (Ar)"], correta: 1, tema: "Biologia / Geografia: Meio Ambiente" },
        { pergunta: "A Constituição Federal do Brasil de 1988 ficou conhecida como a 'Constituição Cidadã' por ter sido promulgada após:", opcoes: ["A Proclamação da República","A Era Vargas","O fim da Ditadura Militar e a redemocratização","A Revolução de 1930"], correta: 2, tema: "História: Redemocratização / CF 1988" },
        { pergunta: "O conceito de 'identidade cultural' na sociologia contemporânea se refere a:", opcoes: ["A uniformização de costumes pelo mundo","O conjunto de características que definem um grupo e o distingue de outros","A perda das tradições locais com a modernidade","A identidade biológica e genética dos povos"], correta: 1, tema: "Sociologia: Identidade e Cultura" },
        { pergunta: "Em Inglês, qual frase está correta no futuro com 'going to' (plano/intenção)?", opcoes: ["She will going to travel","She is go to travel","She is going to travel","She going travel"], correta: 2, tema: "Inglês: Future (going to)" },
        { pergunta: "O Brasil ocupa qual posição em área territorial no ranking mundial?", opcoes: ["3º maior", "4º maior", "5º maior", "6º maior"], correta: 2, tema: "Geografia: Território Brasileiro" },
        { pergunta: "O filósofo Immanuel Kant, em sua obra 'Crítica da Razão Pura', defende que o conhecimento resulta da combinação de:", opcoes: ["Sensações puras sem razão","Experiência sensível e categorias a priori do entendimento","Apenas a experiência empírica","Apenas a razão pura inata"], correta: 1, tema: "Filosofia: Kant / Teoria do Conhecimento" }
    ]
};

// Questão padrão para edições sem banco específico
const questoesPadrao = [
    { pergunta: "Na obra 'Os Lusíadas', de Camões, qual divindade foi principal apoiadora dos navegadores portugueses?", opcoes: ["Baco", "Marte", "Vénus", "Júpiter"], correta: 2, tema: "Literatura Portuguesa / Camões" },
    { pergunta: "Qual a fórmula química do Ácido Sulfúrico?", opcoes: ["HCl", "H₂SO₄", "NaCl", "CO₂"], correta: 1, tema: "Química Inorgânica: Ácidos" },
    { pergunta: "Um ciclista percorre 30 km em 2 horas. Qual a sua velocidade média?", opcoes: ["10 km/h", "15 km/h", "20 km/h", "30 km/h"], correta: 1, tema: "Física: Cinemática" },
    ...questoesProfessor
];

let dadosProvaSimulada = [...questoesPadrao];
let indiceQuestaoAtual = 0; let acertosProva = 0; let errosProva = []; let tempoInicioQuestao = 0; let respostasUsuario = [];

function iniciarSimulado(nomeProva) {
    // Seleciona o conjunto de questões correto para a prova escolhida
    const questoesDaProva = bancoQuestoes[nomeProva];
    if (questoesDaProva) {
        dadosProvaSimulada = [...questoesDaProva, ...questoesProfessor];
    } else {
        dadosProvaSimulada = [...questoesPadrao];
    }

    document.getElementById('lista-provas').classList.add('hidden');
    document.getElementById('area-resultados').classList.add('hidden');
    document.getElementById('area-resolucao').classList.remove('hidden');
    document.getElementById('titulo-prova-atual').textContent = `Provão Paulista — ${nomeProva}`;
    indiceQuestaoAtual = 0; acertosProva = 0; errosProva = []; respostasUsuario = [];
    carregarQuestaoNoEcra();

    // Notificação passageira no canto informando o início
    mostrarToastCanto(
        "Simulado Iniciado",
        `Prova: ${nomeProva}. Boa sorte e administre seu tempo com calma!`,
        "info",
        3500
    );
}
function cancelarSimulado() { 
    document.getElementById('area-resolucao').classList.add('hidden'); 
    document.getElementById('area-resultados').classList.add('hidden'); 
    document.getElementById('lista-provas').classList.remove('hidden'); 
}
function carregarQuestaoNoEcra() {
    let questao = dadosProvaSimulada[indiceQuestaoAtual];
    document.getElementById('texto-questao').textContent = `${indiceQuestaoAtual + 1}. ${questao.pergunta}`;
    document.getElementById('progresso-simulado').textContent = `Questão ${indiceQuestaoAtual + 1} de ${dadosProvaSimulada.length}`;
    let opcoesContainer = document.getElementById('opcoes-questao');
    opcoesContainer.innerHTML = '';
    questao.opcoes.forEach((opcao, index) => {
        let btn = document.createElement('button');
        btn.className = 'btn-opcao'; btn.textContent = opcao;
        btn.onclick = () => responderQuestao(index);
        opcoesContainer.appendChild(btn);
    });
    tempoInicioQuestao = Date.now();
}
function responderQuestao(indiceSelecionado) {
    if (((Date.now() - tempoInicioQuestao) / 1000) < 60) {
        mostrarToastCanto(
            "Atenção ao Tempo",
            "Você respondeu em menos de 1 minuto! Na prova real, use o tempo para pensar bem.",
            "warning",
            4500
        );
    }
    respostasUsuario.push(indiceSelecionado);
    if (indiceSelecionado === dadosProvaSimulada[indiceQuestaoAtual].correta) acertosProva++;
    else errosProva.push(dadosProvaSimulada[indiceQuestaoAtual].tema);
    indiceQuestaoAtual++;
    if (indiceQuestaoAtual < dadosProvaSimulada.length) carregarQuestaoNoEcra();
    else finalizarSimulado();
}
function finalizarSimulado() {
    document.getElementById('area-resolucao').classList.add('hidden');
    document.getElementById('area-resultados').classList.remove('hidden');
    let multiplicadorAtual = usuarioLogado.multiplicador || 1.0;
    let pontosFinais = Math.round((acertosProva * 2) * multiplicadorAtual);

    usuarioLogado.pontos += pontosFinais;
    usuarioLogado.totalAcertos += acertosProva;
    usuarioLogado.totalQuestoes += dadosProvaSimulada.length;
    atualizarBanco(usuarioLogado);
    
    document.getElementById('pontosDisplay').textContent = `${Math.floor(usuarioLogado.pontos)} pts`;
    carregarRank(); atualizarDesempenho(); 

    document.getElementById('res-acertos').textContent = acertosProva;
    document.getElementById('res-erros').textContent = dadosProvaSimulada.length - acertosProva;
    document.getElementById('res-pontos').textContent = `+${pontosFinais}`;
    document.getElementById('res-multiplicador').textContent = `(x${multiplicadorAtual.toFixed(1)})`;

    let htmlGabarito = '';
    dadosProvaSimulada.forEach((q, i) => {
        let acertou = respostasUsuario[i] === q.correta;
        htmlGabarito += `<div class="gabarito-item" style="border-left: 4px solid ${acertou ? '#4CAF50' : '#F44336'};"><strong>Questão ${i + 1}</strong>: ${acertou ? '✅' : '❌'} <br><span style="font-size: 14px;">Sua resposta: ${q.opcoes[respostasUsuario[i]]}</span><br><span style="font-size: 14px; color: var(--primary-color);">Gabarito: <strong>${q.opcoes[q.correta]}</strong></span></div>`;
    });
    document.getElementById('lista-gabarito').innerHTML = htmlGabarito;
    
    let listaTemas = document.getElementById('lista-temas-sugeridos');
    listaTemas.innerHTML = '';
    if (errosProva.length === 0) {
        listaTemas.innerHTML = '<li>Parabéns! Nenhuma lacuna detectada.</li>';
    } else {
        let temasUnicos = [...new Set(errosProva)];
        temasUnicos.forEach(tema => listaTemas.innerHTML += `<li>🔍 <strong>Estudar:</strong> ${tema}</li>`);
    }
}
function voltarParaListaProvas() { 
    document.getElementById('area-resultados').classList.add('hidden'); 
    document.getElementById('lista-provas').classList.remove('hidden'); 
}

// ==========================================
// IAs SIMULADAS (OFFLINE) - ESTUDOS E TCC
// ==========================================

// --- IA DE ESTUDOS (Provão) ---
const GEMINI_API_KEY = "AQ.Ab8RN6KRVw_lx0p9oQsFv-YhJlFnOqscPc1IQIVO5-7AqoT4lA"; // Substitua pela sua chave de API do Gemini

// Função auxiliar: espera N milissegundos
function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Função auxiliar: chama a API Gemini com retry automático
async function chamarGemini(prompt, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();

        // Erro de sobrecarga (503) → tenta de novo após espera
        if (data.error && data.error.message && data.error.message.includes("high demand")) {
            if (i < tentativas - 1) {
                await esperar(3000 * (i + 1)); // espera 3s, 6s, 9s...
                continue;
            }
        }
        return { response, data };
    }
}

async function enviarMensagemIA() {
    const input = document.getElementById('inputChatIA');
    const msgTexto = input.value.trim();
    const chatMessages = document.getElementById('chatMessagesIA');
    
    if (!msgTexto) return;
    chatMessages.innerHTML += `<div class="msg user">${input.value}</div>`;
    input.value = ''; 
    
    const idLoading = "load-" + Date.now();
    chatMessages.innerHTML += `<div id="${idLoading}" class="msg ia"><i>Pensando...</i></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        if (GEMINI_API_KEY === "SUA_API_KEY_AQUI") {
            if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
            chatMessages.innerHTML += `<div class="msg ia">Por favor, configure sua API Key do Gemini no código para usar a IA.</div>`;
            return;
        }

        const prompt = `Você é um tutor de estudos para o Provão Paulista. 
Regra 1: Você NUNCA deve dar a resposta direta de uma questão.
Regra 2: Você deve apenas auxiliar, dar dicas, explicar conceitos e guiar o aluno para encontrar a resposta.
Mensagem do aluno: ${msgTexto}`;

        if(document.getElementById(idLoading)) document.getElementById(idLoading).innerHTML = '<i>Pensando... (tentando conectar)</i>';
        const resultado = await chamarGemini(prompt);
        const { response, data } = resultado;

        if (!response.ok || data.error) {
            const msgErro = data.error ? data.error.message : `HTTP ${response.status}`;
            if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
            chatMessages.innerHTML += `<div class="msg ia">❌ Erro da API Gemini: ${msgErro}</div>`;
            console.error('Erro da API:', data);
            return;
        }

        const resposta = data.candidates[0].content.parts[0].text;
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatMessages.innerHTML += `<div class="msg ia">${resposta.replace(/\n/g, "<br>")}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatMessages.innerHTML += `<div class="msg ia">❌ Erro de conexão: ${error.message}. Verifique se está rodando em um servidor local (não pelo arquivo direto).</div>`;
        console.error(error);
    }
}

if(document.getElementById('inputChatIA')){
    document.getElementById('inputChatIA').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') enviarMensagemIA();
    });
}

// --- IA DE TCC (Direta, Sem Loop de Perguntas e com Conquistas) ---
const conquistasConfig = [
    { id: 'caminho', nome: 'Caminho Inicial', meta: 10, pts: 10, icone: '🏅' },
    { id: 'bronze', nome: 'Medalha de Bronze', meta: 100, pts: 70, icone: '🥉' },
    { id: 'prata', nome: 'Medalha de Prata', meta: 150, pts: 105, icone: '🥈' },
    { id: 'ouro', nome: 'Medalha de Ouro', meta: 200, pts: 180, icone: '🥇' },
    { id: 'diamantina', nome: 'Medalha de Diamantina', meta: 300, pts: 270, icone: '💎' }
];

function iniciarChatTCC() {
    if(document.getElementById('msgHojeTCC')) {
        document.getElementById('msgHojeTCC').textContent = usuarioLogado.mensagensTCCHoje;
    }
    const chatBox = document.getElementById('chatBoxTCC');
    if (chatBox.innerHTML.trim() === '') {
        if (!usuarioLogado.curso) {
            chatBox.innerHTML += `<div class="msg ia">Olá! Sou sua IA orientadora de TCC. Para começarmos, qual é o seu curso?</div>`;
        } else if (!usuarioLogado.temaTCC) {
            chatBox.innerHTML += `<div class="msg ia">Olá! Sou sua IA orientadora de TCC. Já sei que você cursa ${usuarioLogado.curso}. O que você planeja fazer para o seu TCC?</div>`;
        } else {
            chatBox.innerHTML += `<div class="msg ia">Olá! Sou sua IA orientadora de TCC. Posso te ajudar com ideias de temas, estruturação de capítulos, formatação ABNT e orientações de pesquisa para o seu TCC em ${usuarioLogado.curso} sobre "${usuarioLogado.temaTCC}". Como posso ajudar hoje?</div>`;
        }
    }
}

async function enviarMensagemTCC() {
    const input = document.getElementById('inputChatTCC');
    const msgTexto = input.value.trim();
    const chatBox = document.getElementById('chatBoxTCC');
    
    if (!msgTexto) return;

    if (usuarioLogado.mensagensTCCHoje >= 10) {
        alert("Você atingiu o limite de 10 mensagens de TCC por dia. Volte amanhã para continuar!");
        return;
    }

    chatBox.innerHTML += `<div class="msg user">${input.value}</div>`;
    input.value = ''; 
    chatBox.scrollTop = chatBox.scrollHeight;

    // Etapa 1: Perguntar o curso se não tiver
    if (!usuarioLogado.curso) {
        usuarioLogado.curso = msgTexto;
        atualizarBanco(usuarioLogado);
        chatBox.innerHTML += `<div class="msg ia">Perfeito, anotado que seu curso é ${usuarioLogado.curso}! E o que você planeja fazer para o seu TCC? (Pode ser uma ideia geral)</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    // Etapa 2: Perguntar o tema do TCC se não tiver
    if (!usuarioLogado.temaTCC) {
        usuarioLogado.temaTCC = msgTexto;
        atualizarBanco(usuarioLogado);
        chatBox.innerHTML += `<div class="msg ia">Excelente! Agora que sei que você faz ${usuarioLogado.curso} e quer focar em "${usuarioLogado.temaTCC}", como posso te ajudar com o seu projeto hoje?</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    const idLoading = "loadTCC-" + Date.now();
    chatBox.innerHTML += `<div id="${idLoading}" class="msg ia"><i>Analisando e buscando orientações...</i></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        if (GEMINI_API_KEY === "SUA_API_KEY_AQUI") {
            if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
            chatBox.innerHTML += `<div class="msg ia">Por favor, configure sua API Key do Gemini no código para usar a IA.</div>`;
            return;
        }

        const prompt = `Você é um orientador de TCC.
Regra 1: Você NUNCA deve fazer o trabalho pelo aluno (nada de escrever os textos do TCC para ele), apenas orientar, dar dicas e tirar dúvidas.
Regra 2: Você deve apenas auxiliar nos estudos.
Regra 3: O curso do aluno é: ${usuarioLogado.curso}
Regra 4: O aluno planeja fazer o TCC sobre: ${usuarioLogado.temaTCC}
Regra 5: Use as informações do curso e a ideia do TCC como referência para responder e dar exemplos, sempre focando em ajudar com o TCC.
Mensagem do aluno: ${msgTexto}`;

        if(document.getElementById(idLoading)) document.getElementById(idLoading).innerHTML = '<i>Analisando... (tentando conectar)</i>';
        const resultado = await chamarGemini(prompt);
        const { response, data } = resultado;

        if (!response.ok || data.error) {
            const msgErro = data.error ? data.error.message : `HTTP ${response.status}`;
            if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
            chatBox.innerHTML += `<div class="msg ia">❌ Erro da API Gemini: ${msgErro}</div>`;
            console.error('Erro da API:', data);
            return;
        }

        const resposta = data.candidates[0].content.parts[0].text;
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatBox.innerHTML += `<div class="msg ia">${resposta.replace(/\n/g, "<br>")}</div>`;
        concluirEnvioTCC();
    } catch (error) {
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatBox.innerHTML += `<div class="msg ia">❌ Erro de conexão: ${error.message}. Verifique se está rodando em um servidor local (não pelo arquivo direto).</div>`;
        console.error(error);
    }
}

if(document.getElementById('inputChatTCC')){
    document.getElementById('inputChatTCC').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') enviarMensagemTCC();
    });
}

function concluirEnvioTCC() {
    const chatBox = document.getElementById('chatBoxTCC');
    chatBox.scrollTop = chatBox.scrollHeight;
    
    usuarioLogado.mensagensTCC++;
    usuarioLogado.mensagensTCCHoje++;
    if(document.getElementById('msgHojeTCC')) {
        document.getElementById('msgHojeTCC').textContent = usuarioLogado.mensagensTCCHoje;
    }
    
    // Bônus Diamantina (300+ msgs)
    if (usuarioLogado.mensagensTCC >= 300) {
        usuarioLogado.pontos += 0.5;
        document.getElementById('pontosDisplay').textContent = `${Math.floor(usuarioLogado.pontos)} pts`;
        carregarRank();
    }
    
    atualizarBanco(usuarioLogado);
    verificarConquistas();
}

function verificarConquistas() {
    let msgCount = usuarioLogado.mensagensTCC;
    
    conquistasConfig.forEach(conq => {
        if (msgCount >= conq.meta && !usuarioLogado.conquistas.includes(conq.id)) {
            usuarioLogado.conquistas.push(conq.id);
            usuarioLogado.pontos += conq.pts;
            atualizarBanco(usuarioLogado);
            
            document.getElementById('pontosDisplay').textContent = `${Math.floor(usuarioLogado.pontos)} pts`;
            carregarRank();
            
            // Pop-up Toast da Conquista
            if(document.getElementById('toast-nome')){
                document.getElementById('toast-nome').textContent = conq.nome;
                document.getElementById('toast-pontos').textContent = `+${conq.pts} pts`;
                
                const toast = document.getElementById('toast-conquista');
                toast.classList.remove('hidden');
                setTimeout(() => { toast.classList.add('show'); }, 100);
                
                setTimeout(() => { 
                    toast.classList.remove('show');
                    setTimeout(() => { toast.classList.add('hidden'); }, 500);
                }, 4000);
            }
        }
    });
    renderizarConquistas();
}

function renderizarConquistas() {
    let msgCount = usuarioLogado.mensagensTCC || 0;
    let painel = document.getElementById('lista-conquistas-ui');
    if(!painel) return;
    
    let html = '';
    conquistasConfig.forEach(conq => {
        let porcentagem = Math.min((msgCount / conq.meta) * 100, 100);
        let desbloqueado = usuarioLogado.conquistas && usuarioLogado.conquistas.includes(conq.id);
        
        html += `
            <div class="conquista-item" style="opacity: ${desbloqueado ? '1' : '0.6'}; margin-bottom: 15px;">
                <div class="conquista-header" style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 5px;">
                    <span>${conq.icone} ${conq.nome}</span>
                    <span style="color:var(--accent-color);">${Math.floor(porcentagem)}%</span>
                </div>
                <div class="progress-bar-bg" style="width: 100%; height: 10px; background: var(--bg-main); border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color);">
                    <div class="progress-bar-fill" style="height: 100%; background: var(--accent-color); transition: width 0.5s; width: ${porcentagem}%;"></div>
                </div>
                <p style="font-size:11px; margin-top:3px; color:var(--text-muted);">
                    ${desbloqueado ? '✅ Desbloqueado' : `Troque ${conq.meta} msgs c/ a IA (${msgCount}/${conq.meta})`}
                </p>
            </div>
        `;
    });
    painel.innerHTML = html;
}

// ==========================================
// FUNÇÕES DE ADMINISTRAÇÃO (PROFESSOR)
// ==========================================
function salvarConteudo(e) {
    e.preventDefault();
    // Descobre qual matéria está selecionada no menu
    let materiaBtn = document.querySelector('.materia-btn.active');
    let materiaAtiva = materiaBtn ? materiaBtn.innerText : 'Geral';
    let arquivoInput = document.getElementById('profArquivo');
    
    let salvar = (arquivoBase64, nomeArquivo) => {
        let novoConteudo = {
            id: Date.now(), materia: materiaAtiva,
            titulo: document.getElementById('profTitulo').value,
            texto: document.getElementById('profTexto').value,
            link: document.getElementById('profLink').value,
            video: document.getElementById('profVideo').value,
            arquivo: arquivoBase64, nomeArquivo: nomeArquivo
        };
        let conteudos = JSON.parse(localStorage.getItem('bd_conteudos')) || [];
        conteudos.push(novoConteudo);
        localStorage.setItem('bd_conteudos', JSON.stringify(conteudos));
        mostrarToastCanto('Conteúdo Publicado', `Conteúdo publicado com sucesso em ${materiaAtiva}!`, 'success');
        e.target.reset();
        carregarMateria(materiaAtiva); // Atualiza a tela na hora
    };

    // Lógica para transformar arquivo em Base64 (salvar localmente)
    if (arquivoInput.files.length > 0) {
        let reader = new FileReader();
        reader.onload = function(evt) { salvar(evt.target.result, arquivoInput.files[0].name); };
        reader.readAsDataURL(arquivoInput.files[0]);
    } else { salvar(null, null); }
}

function salvarQuestao(e) {
    e.preventDefault();
    let novaQuestao = {
        id: Date.now(),
        pergunta: document.getElementById('profPergunta').value,
        tema: document.getElementById('profTema').value,
        opcoes: [
            document.getElementById('profAlt0').value,
            document.getElementById('profAlt1').value,
            document.getElementById('profAlt2').value,
            document.getElementById('profAlt3').value
        ],
        correta: parseInt(document.getElementById('profCorreta').value),
        profNome: usuarioLogado ? usuarioLogado.nome : 'Professor',
        dataHora: new Date().toLocaleString()
    };

    let simulados = JSON.parse(localStorage.getItem('bd_simulados')) || [];
    simulados.push(novaQuestao);
    localStorage.setItem('bd_simulados', JSON.stringify(simulados));
    
    // Injeta a nova questão na variável da prova atual
    if (typeof questoesProfessor !== 'undefined') {
        questoesProfessor.push(novaQuestao);
    }
    dadosProvaSimulada.push(novaQuestao);

    if (window.API && typeof window.API.salvarSimulado === 'function') {
        window.API.salvarSimulado(novaQuestao).catch(err => {
            console.warn('[StudySP] Falha ao enviar simulado para o servidor:', err);
        });
    }
    
    mostrarToastCanto('Questão Cadastrada', 'Questão adicionada ao banco de Simulados com sucesso!', 'success');
    e.target.reset();
    renderizarListaQuestoesProfessor();
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function excluirConteudo(id, materiaNome) {
    if (!confirm('Deseja realmente excluir esta matéria/aula publicada? Essa ação não pode ser desfeita.')) {
        return;
    }

    const idStr = String(id);
    let conteudos = JSON.parse(localStorage.getItem('bd_conteudos')) || [];
    conteudos = conteudos.filter(c => String(c.id) !== idStr);
    localStorage.setItem('bd_conteudos', JSON.stringify(conteudos));

    if (window.API && typeof window.API.excluirConteudo === 'function') {
        window.API.excluirConteudo(idStr).catch(err => {
            console.warn('[StudySP] Falha ao excluir conteúdo do servidor:', err);
        });
    }

    mostrarToastCanto('Publicação Excluída', 'A matéria/aula foi removida com sucesso!', 'info');
    
    let materiaAtiva = materiaNome;
    if (!materiaAtiva) {
        const activeBtn = document.querySelector('.materia-btn.active');
        materiaAtiva = activeBtn ? activeBtn.innerText : 'Português';
    }
    carregarMateria(materiaAtiva);
}

async function excluirQuestao(id) {
    if (!confirm('Deseja realmente remover esta questão do simulado? Essa ação não pode ser desfeita.')) {
        return;
    }

    const idStr = String(id);
    let simulados = JSON.parse(localStorage.getItem('bd_simulados')) || [];
    simulados = simulados.filter(q => String(q.id) !== idStr);
    localStorage.setItem('bd_simulados', JSON.stringify(simulados));

    if (typeof questoesProfessor !== 'undefined') {
        questoesProfessor = questoesProfessor.filter(q => String(q.id) !== idStr);
    }
    dadosProvaSimulada = dadosProvaSimulada.filter(q => String(q.id) !== idStr);

    if (window.API && typeof window.API.excluirSimulado === 'function') {
        window.API.excluirSimulado(idStr).catch(err => {
            console.warn('[StudySP] Falha ao excluir simulado do servidor:', err);
        });
    }

    renderizarListaQuestoesProfessor();
    mostrarToastCanto('Questão Removida', 'A questão foi removida do banco de simulados com sucesso!', 'info');
}

function renderizarListaQuestoesProfessor() {
    const container = document.getElementById('listaQuestoesProfessor');
    const badgeContador = document.getElementById('contagemQuestoesProf');
    if (!container) return;

    let questoes = JSON.parse(localStorage.getItem('bd_simulados')) || [];
    if (typeof questoesProfessor !== 'undefined') {
        questoesProfessor = questoes;
    }

    if (badgeContador) {
        badgeContador.textContent = questoes.length;
    }

    if (questoes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 25px 15px; color: var(--text-muted); font-size: 13px; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border-color);">
                <span>ℹ️</span> Nenhuma questão cadastrada por você no simulado até o momento.
            </div>
        `;
        return;
    }

    const letras = ['A', 'B', 'C', 'D'];

    container.innerHTML = questoes.map((q, index) => {
        if (!q.id) {
            q.id = 'q_' + (index + 1) + '_' + Date.now();
        }
        const safeId = String(q.id);
        const tema = q.tema || 'Geral';
        const dataCriacao = q.dataHora || 'Cadastrada';

        const opcoesHtml = (q.opcoes || []).map((opc, idx) => {
            const isCorreta = idx === parseInt(q.correta);
            const style = isCorreta
                ? 'background: rgba(46, 213, 115, 0.12); border: 1px solid rgba(46, 213, 115, 0.4); color: #2ed573; font-weight: bold;'
                : 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted);';
            return `
                <div style="padding: 6px 10px; border-radius: 5px; ${style} font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    <span>${letras[idx]})</span>
                    <span style="flex: 1; word-break: break-word;">${escapeHtml(opc)}</span>
                    ${isCorreta ? '<span title="Alternativa Correta">✓</span>' : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="questao-prof-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="background: rgba(0, 123, 255, 0.15); color: var(--primary-color); border: 1px solid rgba(0, 123, 255, 0.3); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                            🏷️ ${escapeHtml(tema)}
                        </span>
                        <span style="font-size: 11px; color: var(--text-muted);">
                            🕒 ${escapeHtml(dataCriacao)}
                        </span>
                    </div>
                    <button type="button" 
                            onclick="excluirQuestao('${safeId}')" 
                            class="btn-excluir-questao" 
                            title="Excluir esta questão do simulado">
                        <span>🗑️</span> Remover Questão
                    </button>
                </div>
                <div style="font-size: 13.5px; color: var(--text-main); font-weight: 500; line-height: 1.5; white-space: pre-wrap;">
                    <strong>#${index + 1}:</strong> ${escapeHtml(q.pergunta)}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px; margin-top: 4px;">
                    ${opcoesHtml}
                </div>
            </div>
        `;
    }).reverse().join('');
}

window.escapeHtml = escapeHtml;
window.excluirConteudo = excluirConteudo;
window.excluirQuestao = excluirQuestao;
window.renderizarListaQuestoesProfessor = renderizarListaQuestoesProfessor;

// Inicialização Final (Roda ao carregar a página)
carregarDadosPerfil(); 
carregarRank(); 
calcularMultiplicador(); 
atualizarDesempenho(); 
renderizarConquistas();