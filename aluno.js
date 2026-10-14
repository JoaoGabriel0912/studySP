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
    if(document.getElementById('acertosStats')) {
        document.getElementById('acertosStats').innerHTML = `✅ Acertos: <strong>${usuarioLogado.totalAcertos || 0}</strong>`;
    }
    if(document.getElementById('errosStats')) {
        let erros = (usuarioLogado.totalQuestoes || 0) - (usuarioLogado.totalAcertos || 0);
        document.getElementById('errosStats').innerHTML = `❌ Erros: <strong>${erros}</strong>`;
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
    abrirModalMeuPerfil();
}

function abrirModalMeuPerfil() {
    const modal = document.getElementById('modal-meu-perfil');
    if (!modal) return;

    if (document.getElementById('meuPerfilNomeModal')) {
        document.getElementById('meuPerfilNomeModal').textContent = usuarioLogado.nome || 'Aluno';
    }
    if (document.getElementById('meuPerfilRoleModal')) {
        document.getElementById('meuPerfilRoleModal').textContent = (usuarioLogado.perfil === 'Professor') ? 'Professor' : 'Estudante Ativo';
    }
    if (document.getElementById('userEmailDisplay')) {
        document.getElementById('userEmailDisplay').textContent = usuarioLogado.email || 'aluno@escola.sp.gov.br';
    }
    const avatarEl = document.getElementById('meuPerfilAvatarModal');
    if (avatarEl) {
        if (usuarioLogado.foto) {
            avatarEl.style.backgroundImage = `url(${usuarioLogado.foto})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
        } else {
            avatarEl.style.backgroundImage = 'none';
            avatarEl.textContent = '👤';
        }
    }

    carregarDadosPerfil();

    if (document.getElementById('acertosStats')) {
        document.getElementById('acertosStats').textContent = usuarioLogado.totalAcertos || 0;
    }
    if (document.getElementById('errosStats')) {
        let erros = (usuarioLogado.totalQuestoes || 0) - (usuarioLogado.totalAcertos || 0);
        document.getElementById('errosStats').textContent = erros >= 0 ? erros : 0;
    }
    if (document.getElementById('sequenciaStats')) {
        document.getElementById('sequenciaStats').innerHTML = `🔥 Sequência: <strong>${usuarioLogado.sequencia || 0} Dias</strong>`;
    }
    let minutosEstudados = (usuarioLogado.tempoEstudadoSegundos || 0) / 60;
    let h = Math.floor(minutosEstudados / 60);
    let m = Math.floor(minutosEstudados % 60);
    if (document.getElementById('horasEstudadasStats')) {
        document.getElementById('horasEstudadasStats').innerHTML = `⏱ Horas: <strong>${h}h ${m}m</strong>`;
    }

    modal.classList.remove('hidden');
    const conquistasDrop = document.getElementById('conquistasDropdown');
    if (conquistasDrop) conquistasDrop.classList.add('hidden');
}

function fecharModalMeuPerfil() {
    const modal = document.getElementById('modal-meu-perfil');
    if (modal) modal.classList.add('hidden');
}

function toggleConquistas() { 
    const cDrop = document.getElementById('conquistasDropdown');
    if (cDrop) cDrop.classList.toggle('hidden'); 
    fecharModalMeuPerfil(); 
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
    } else {
        usuariosBD.push(usuarioAtualizado);
    }
    localStorage.setItem('bd_usuarios', JSON.stringify(usuariosBD));

    // Sincroniza com a API do Servidor (persistência global entre navegadores)
    if (window.API && typeof window.API.atualizarUsuario === 'function') {
        window.API.atualizarUsuario(usuarioAtualizado).catch(err => {
            console.warn('[StudySP] Falha ao sincronizar dados com o servidor:', err);
        });
    }
}

function salvarPerfil() {
    if (document.getElementById('perfilEndereco')) usuarioLogado.endereco = document.getElementById('perfilEndereco').value;
    if (document.getElementById('perfilCidade')) usuarioLogado.cidade = document.getElementById('perfilCidade').value;
    if (document.getElementById('perfilTelefone')) usuarioLogado.telefone = document.getElementById('perfilTelefone').value;
    if (document.getElementById('perfilIdade')) usuarioLogado.idade = document.getElementById('perfilIdade').value;
    if (document.getElementById('perfilBio')) usuarioLogado.bio = document.getElementById('perfilBio').value;
    atualizarBanco(usuarioLogado);
    mostrarToastCanto('Perfil Atualizado', 'Suas informações foram salvas com sucesso!', 'success');
    fecharModalMeuPerfil();
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
function renderizarRankComAlunos(alunos) {
    let userRankIndex = alunos.findIndex(u => u.rm === usuarioLogado.rm);
    let rankPos = userRankIndex !== -1 ? userRankIndex + 1 : '-';
    if(document.getElementById('rankPositionDisplay')) {
        document.getElementById('rankPositionDisplay').textContent = `Você está no Top ${rankPos}`;
    }
    
    // 1. RENDERIZAR O PÓDIO (TOP 3 NA TELA INÍCIO)
    const podioContainer = document.getElementById('podio-container');
    if (podioContainer) {
        let top3 = alunos.slice(0, 3);
        let htmlPodio = '';
        
        const posicoes = [
            { rank: 2, aluno: top3[1], class: 'podio-prata', height: '200px' },
            { rank: 1, aluno: top3[0], class: 'podio-ouro', height: '245px' },
            { rank: 3, aluno: top3[2], class: 'podio-bronze', height: '175px' }
        ];
        
        posicoes.forEach(pos => {
            if (pos.aluno) {
                let avatarStyle = pos.aluno.foto ? `background-image: url(${pos.aluno.foto}); color: transparent; background-size: cover; background-position: center;` : ``;
                
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

    // 2. RENDERIZAR A LISTA LATERAL COMPLETA
    const rankList = document.getElementById('rankList');
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

async function carregarRank() {
    let usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let alunos = usuarios.filter(user => user.perfil === 'Aluno');
    
    alunos.forEach(aluno => {
        if (!aluno.pontos) aluno.pontos = 0;
        if (!aluno.sequencia) aluno.sequencia = 0;
    });
    
    alunos.sort((a, b) => b.pontos - a.pontos);
    renderizarRankComAlunos(alunos);

    // Busca ranking sincronizado da nuvem para ver alunos de todos os navegadores
    try {
        if (window.API && typeof window.API.buscarUsuarios === 'function') {
            const usuariosRemotos = await window.API.buscarUsuarios();
            if (Array.isArray(usuariosRemotos) && usuariosRemotos.length > 0) {
                localStorage.setItem('bd_usuarios', JSON.stringify(usuariosRemotos));
                let alunosRemotos = usuariosRemotos.filter(user => user.perfil === 'Aluno');
                alunosRemotos.forEach(aluno => {
                    if (!aluno.pontos) aluno.pontos = 0;
                    if (!aluno.sequencia) aluno.sequencia = 0;
                });
                alunosRemotos.sort((a, b) => b.pontos - a.pontos);
                renderizarRankComAlunos(alunosRemotos);
            }
        }
    } catch (err) {
        console.warn('[StudySP] Erro ao sincronizar ranking com servidor:', err);
    }
}

// ----------------------------------------------------
// NOVO MODAL DE PERFIL (SUBSTITUI O ALERT)
// ----------------------------------------------------
async function mostrarPerfilRank(rmDestino) {
    let usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let alunoAlvo = usuarios.find(u => u.rm === rmDestino);
    
    if (!alunoAlvo && window.API && typeof window.API.buscarUsuario === 'function') {
        try {
            alunoAlvo = await window.API.buscarUsuario(rmDestino);
        } catch(e) {}
    }
    
    if(alunoAlvo) {
        // Preenche os dados HTML do modal
        document.getElementById('modal-perfil-nome').textContent = alunoAlvo.nome;
        document.getElementById('modal-perfil-role').textContent = alunoAlvo.perfil || 'Aluno';
        document.getElementById('modal-perfil-cidade').textContent = alunoAlvo.cidade || 'Não informada';
        document.getElementById('modal-perfil-pontos').textContent = Math.floor(alunoAlvo.pontos || 0) + ' pts';
        document.getElementById('modal-perfil-ofensiva').textContent = (alunoAlvo.sequencia || 0) + ' Dias';
        document.getElementById('modal-perfil-bio').textContent = `"${alunoAlvo.bio || 'Este utilizador ainda não escreveu uma biografia.'}"`;
        
        // Lógica para mostrar a foto ou o emoji padrão
        const avatarEl = document.getElementById('modal-perfil-avatar');
        if (alunoAlvo.foto) {
            avatarEl.style.backgroundImage = `url(${alunoAlvo.foto})`;
            avatarEl.textContent = ''; // Tira o emoji se tiver foto
        } else {
            avatarEl.style.backgroundImage = 'none';
            avatarEl.textContent = '👤';
        }

        // Exibe o modal na tela
        document.getElementById('modal-perfil').classList.remove('hidden');
    }
}

// Função para fechar o Modal
function fecharModalPerfil() {
    document.getElementById('modal-perfil').classList.add('hidden');
}

// Permite fechar o modal clicando fora dele (no fundo escuro)
document.addEventListener('click', function(e) {
    const modalOverlay = document.getElementById('modal-perfil');
    // Verifica se o clique foi exatamente no fundo escuro e não dentro da caixa
    if (e.target === modalOverlay) {
        fecharModalPerfil();
    }
});

// Lógica de ajuda e contador do Rank
document.getElementById('btnRankHelp')?.addEventListener('click', () => {
    document.getElementById('modal-rank-help').classList.remove('hidden');
});
function fecharModalRankHelp() {
    document.getElementById('modal-rank-help').classList.add('hidden');
}

function updateRankCountdown() {
    const countdownEl = document.getElementById('rankCountdown');
    if (!countdownEl) return;
    
    const now = new Date();
    // Próximo dia 1
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = nextMonth - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    
    countdownEl.textContent = `Reset em: ${days}d ${hours}h ${mins}m ${secs}s`;
}
setInterval(updateRankCountdown, 1000);
updateRankCountdown();

// ==========================================
// ESTUDAR (CONTEÚDO) - ATUALIZADO PARA LER O BANCO DO PROFESSOR
// ==========================================
function renderizarConteudosNaTela(filtrados, materiaNome) {
    const container = document.getElementById('conteudo-materia');
    if (!container) return;

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

    container.innerHTML = filtrados.map(item => {
        let avatarStyle = item.profFoto ? `background-image: url(${item.profFoto}); background-size: cover; background-position: center; color: transparent;` : '';
        const safeId = String(item.id || '');
        const safeMateria = (item.materia || materiaNome || '').replace(/'/g, "\\'");
        let htmlCard = `<div class="tema-card" style="margin-bottom: 25px; position: relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; gap: 10px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="avatar-circle" style="width: 32px; height: 32px; font-size: 14px; ${avatarStyle}">👤</div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 13px; font-weight: bold; color: var(--text-main);">${escapeHtml(item.profNome || 'Professor')}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(item.dataHora || 'Recentemente')}</span>
                    </div>
                </div>
                ${isProfessor ? `
                    <button type="button" 
                            class="btn-excluir-publicacao" 
                            onclick="excluirConteudo('${safeId}', '${safeMateria}')" 
                            title="Excluir esta publicação">
                        <span>🗑️</span> Excluir Publicação
                    </button>
                ` : ''}
            </div>
            <h3 style="color:var(--primary-color); font-size: 20px;">${escapeHtml(item.titulo)}</h3>
            <p style="margin: 15px 0; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${escapeHtml(item.texto)}</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
        `;

        if (item.link) {
            htmlCard += `<a href="${encodeURI(item.link)}" target="_blank" style="padding: 8px 15px; background: rgba(0, 123, 255, 0.1); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 13px;">🔗 Acessar Link Externo</a>`;
        }

        if (item.arquivo) {
            htmlCard += `<a href="${item.arquivo}" download="${escapeHtml(item.nomeArquivo || 'arquivo')}" style="padding: 8px 15px; background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; color: #4CAF50; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 13px;">📎 Baixar ${escapeHtml(item.nomeArquivo || 'Arquivo')}</a>`;
        }
        
        htmlCard += `</div>`; 

        if (item.video) {
            htmlCard += `
                <div style="margin:20px auto 0 auto; width: 60%; position:relative; padding-bottom:33.75%; height:0; overflow:hidden; border-radius:10px; border: 1px solid var(--border-color);">
                    <iframe src="https://www.youtube.com/embed/${encodeURIComponent(item.video)}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
                </div>
            `;
        }

        htmlCard += `</div>`; 
        return htmlCard;
    }).reverse().join(''); 
}

async function carregarMateria(materiaNome) {
    // 1. Atualiza os botões visuais da matéria selecionada
    document.querySelectorAll('.materia-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === materiaNome) btn.classList.add('active');
    });

    // 2. Puxa os conteúdos salvos no cache local para exibição instantânea
    let conteudos = JSON.parse(localStorage.getItem('bd_conteudos')) || [];
    let filtrados = conteudos.filter(c => c.materia && c.materia.toLowerCase() === materiaNome.toLowerCase());
    renderizarConteudosNaTela(filtrados, materiaNome);

    // 3. Sincroniza em segundo plano com o banco de dados do servidor
    try {
        if (window.API && typeof window.API.buscarConteudos === 'function') {
            const conteudosServidor = await window.API.buscarConteudos();
            if (Array.isArray(conteudosServidor)) {
                localStorage.setItem('bd_conteudos', JSON.stringify(conteudosServidor));
                let filtradosServidor = conteudosServidor.filter(c => c.materia && c.materia.toLowerCase() === materiaNome.toLowerCase());
                renderizarConteudosNaTela(filtradosServidor, materiaNome);
            }
        }
    } catch (err) {
        console.warn('[StudySP] Falha ao atualizar conteúdos da matéria do servidor:', err);
    }
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

let eyeOpen = true;
function toggleMiniTimerEye() {
    eyeOpen = !eyeOpen;
    document.getElementById('btnToggleTimerEye').textContent = eyeOpen ? '👁️' : '🙈';
    atualizarVisorPomodoro();
}

function fecharMiniTimer() {
    const miniW = document.getElementById('miniTimerWidget');
    if (miniW) {
        miniW.classList.add('hidden');
        miniW.style.display = 'none';
    }
}

function reexibirMiniTimer() {
    const miniW = document.getElementById('miniTimerWidget');
    if (miniW) {
        miniW.classList.remove('hidden');
        miniW.style.display = 'flex';
        atualizarVisorPomodoro();
        mostrarToastCanto("Mini Cronômetro", "Mini Cronômetro reexibido no canto da tela!", "info", 2500);
    }
}

function atualizarVisorPomodoro() {
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;
    let tempoStr = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    if(document.getElementById('timerDisplay')){
        document.getElementById('timerDisplay').textContent = tempoStr;
    }
    if(document.getElementById('miniTimerTime')){
        document.getElementById('miniTimerTime').textContent = eyeOpen ? tempoStr : '***';
    }
    
    if (tempoTotalSessao > 0 && document.getElementById('clockHand')) {
        let graus = (1 - (tempoRestante / tempoTotalSessao)) * 360;
        document.getElementById('clockHand').style.transform = `rotate(${graus}deg)`;
    }
}
function calcularMultiplicador() {
    let minutosEstudados = usuarioLogado.tempoEstudadoSegundos / 60;
    let novoMultiplicador = 1.0;
    if (minutosEstudados >= 120) novoMultiplicador = 1.5;
    else if (minutosEstudados >= 60) novoMultiplicador = 1.4;
    else if (minutosEstudados >= 30) novoMultiplicador = 1.3;

    usuarioLogado.multiplicador = novoMultiplicador;
    atualizarBanco(usuarioLogado);
    
    if(document.getElementById('multiplicadorDisplay')) document.getElementById('multiplicadorDisplay').textContent = `${novoMultiplicador.toFixed(1)}x`;
    let h = Math.floor(minutosEstudados / 60);
    let m = Math.floor(minutosEstudados % 60);
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
    
    let miniW = document.getElementById('miniTimerWidget');
    if(miniW) { miniW.classList.remove('hidden'); miniW.style.display = 'flex'; }
    
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
// BANCO DE QUESTÕES PROVÃO PAULISTA (ORGANIZADO POR EDIÇÃO)
// ==========================================
let questoesProfessor = JSON.parse(localStorage.getItem('bd_simulados')) || [];

// // BANCO OFICIAL — Questões contextualizadas no modelo VUNESP / Provão Paulista (SEDUC-SP)
const bancoQuestoes = {
    '1º Ano - 2023': [
        {
            pergunta: "(Provão Paulista / VUNESP) Leia o trecho de 'Os Lusíadas' (Canto IV): 'Ó glória de mandar, ó vã cobiça / Desta vaidade a quem chamamos Fama! / Ó fraudulento gosto, que se atiça / C'uma aura popular, que honra se chama!'. A fala do 'Velho do Restelo' no momento da partida das naus portuguesas expressa:",
            opcoes: [
                "A glorificação incondicional da expansão marítima e a busca por riquezas nas Índias.",
                "A crítica severa à ambição desmedida da nobreza e aos custos humanos e sociais das navegações.",
                "O entusiasmo do povo humilde com a promessa de glória e terras no além-mar.",
                "A celebração religiosa da catequese sobre os povos do continente africano."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Classicismo e Epopeia Camoniana"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em uma aula prática de química sobre segurança laboratorial, um professor explica que o ácido sulfúrico (H₂SO₄) é um ácido diprótico forte muito utilizado na indústria de fertilizantes. Ao reagir completamente com hidróxido de sódio (NaOH), a equação química balanceada que representa essa neutralização é:",
            opcoes: [
                "H₂SO₄ + NaOH → NaSO₄ + H₂O",
                "H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O",
                "2 H₂SO₄ + NaOH → Na₂SO₄ + H₂O",
                "H₂SO₄ + NaOH → Na₂SO₄ + H₂"
            ],
            correta: 1,
            tema: "Química: Funções Inorgânicas e Reações de Neutralização"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Um veículo de transporte escolar trafega em uma avenida retilínea de São Paulo a 72 km/h (20 m/s). Ao avistar a faixa de pedestres, o motorista aciona os freios, imprimindo uma desaceleração constante de magnitude 4 m/s². A distância percorrida pelo veículo até parar completamente é de:",
            opcoes: [
                "25 metros",
                "50 metros",
                "80 metros",
                "100 metros"
            ],
            correta: 1,
            tema: "Física: Movimento Retilíneo Uniformemente Variado (Equação de Torricelli)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Um agricultor paulista deseja cercar um canteiro retangular de hortaliças com 120 metros de tela. Sabendo que o comprimento do canteiro é o triplo da sua largura, a área total cultivada desse canteiro retangular corresponde a:",
            opcoes: [
                "450 m²",
                "675 m²",
                "900 m²",
                "1.350 m²"
            ],
            correta: 1,
            tema: "Matemática: Equações de 1º Grau e Geometria Plana"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Durante uma expedição pela Serra do Mar, estudantes observaram que as briófitas (musgos) crescem apenas em locais úmidos e sombreados, apresentando pequeno porte (poucos centímetros). Essa limitação de tamanho e dependência da água decorre diretamente:",
            opcoes: [
                "Da ausência de clorofila e incapacidade de realizar fotossíntese completa.",
                "Da ausência de vasos condutores de seiva (xilema e floema) e fecundação dependente de água.",
                "Da produção exclusiva de sementes desprovidas de frutos protetores.",
                "Da presença de raízes pivotantes profundas que retêm pouca umidade superficial."
            ],
            correta: 1,
            tema: "Biologia: Reino Plantae / Briófitas e Evolução Vegetal"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) 'A introdução das máquinas a vapor e dos teares mecânicos na Inglaterra da segunda metade do século XVIII transformou radicalmente a organização do trabalho humano.' Entre as consequências sociais imediatas da 1ª Revolução Industrial, destaca-se:",
            opcoes: [
                "A valorização salarial do artesão tradicional e redução das jornadas fabris.",
                "A separação definitiva entre o trabalhador e os meios de produção, com longas jornadas e urbanização acelerada.",
                "A universalização dos direitos trabalhistas e a erradicação do trabalho infantil.",
                "A descentralização das cidades fabris e o fortalecimento da produção agrícola de subsistência."
            ],
            correta: 1,
            tema: "História: 1ª Revolução Industrial e Transformações Sociais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O relevo do estado de São Paulo é caracterizado pelo Planalto Atlântico, pela Depressão Periférica e pelo Planalto Ocidental Paulista. A Depressão Periférica Paulista se destaca economicamente e geograficamente por:",
            opcoes: [
                "Apresentar as maiores altitudes do estado, abrigando formações de campos de altitude.",
                "Situar-se entre o Planalto Atlântico e as Cuestas Basálticas, com relevo suave propício à cana-de-açúcar e ferrovias.",
                "Ser formada exclusivamente por planícies litorâneas sujeitas a transgressões marinhas periódicas.",
                "Constituir uma zona desértica com solos rasos e ausência de bacias hidrográficas expressivas."
            ],
            correta: 1,
            tema: "Geografia: Geomorfologia e Ocupação do Espaço Paulista"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na Grécia Antiga, o filósofo Sócrates utilizava um método de diálogo composto por duas etapas: a ironia e a maiêutica. O objetivo central da maiêutica socrática era:",
            opcoes: [
                "Transmitir verdades absolutas prontas elaboradas pelos governantes atenienses.",
                "Ajudar o interlocutor a 'dar à luz' às suas próprias ideias e ao autoconhecimento racional.",
                "Vencer debates políticos na ágora por meio do uso da retórica sofística e falácias.",
                "Provar que os sentidos humanos são infalíveis na apreensão da realidade exterior."
            ],
            correta: 1,
            tema: "Filosofia: O Método Socrático e a Busca pela Verdade"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Read the short message: 'Climate change is no longer a future threat; it is an urgent crisis reshaping ecosystems across the globe.' The modal sentence 'Governments must implement strict carbon regulations' expresses an idea of:",
            opcoes: [
                "Possibility or doubt about what could occur.",
                "Obligation and strong necessity in taking action.",
                "Permission granted by environmental agencies.",
                "Ability developed through past technological innovation."
            ],
            correta: 1,
            tema: "Língua Inglesa: Modal Verbs (Must / Obligation) e Leitura Temática"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Émile Durkheim postulava que os 'fatos sociais' possuem três características essenciais que condicionam o comportamento dos indivíduos. São elas:",
            opcoes: [
                "Subjetividade, flexibilidade e transitoriedade.",
                "Exterioridade, coercitividade e generalidade.",
                "Racionalidade econômica, voluntariedade e individualidade.",
                "Biológica, hereditariedade e determinismo geográfico."
            ],
            correta: 1,
            tema: "Sociologia: Teoria Funcionalista e Fato Social em Durkheim"
        }
    ],
    '1º Ano - 2024': [
        {
            pergunta: "(Provão Paulista / VUNESP) Leia a estrofe de Gregório de Matos (Barroco Baiano): 'Nasce o Sol, e não dura mais que um dia, / Depois da Luz se segue a noite escura, / Em tristes sombras morre a formosura, / Em contínuas tristezas a alegria.'. A temática central e a figura de linguagem predominante nos versos são, respectivamente:",
            opcoes: [
                "A celebração da eternidade das paixões humanas e a metáfora.",
                "A efemeridade do tempo e da vida (carpe diem / transitoriedade) e a antítese.",
                "A exaltação patriótica da natureza brasileira e o hipérbato.",
                "A sátira aos governantes de Salvador e o eufemismo."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Barroco Brasileiro / Gregório de Matos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em um laboratório de análises, um técnico investiga a densidade de amostras metálicas puras. Uma barra de alumínio de massa 135 g ocupa um volume de 50 cm³. Sabendo que a densidade é a razão entre massa e volume, a densidade dessa barra em g/cm³ e em kg/m³ é, respectivamente:",
            opcoes: [
                "2,7 g/cm³ e 2.700 kg/m³",
                "0,37 g/cm³ e 370 kg/m³",
                "2,7 g/cm³ e 270 kg/m³",
                "6,75 g/cm³ e 6.750 kg/m³"
            ],
            correta: 0,
            tema: "Química / Física: Propriedades Gerais da Matéria e Conversão de Unidades"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Segundo a 1ª Lei de Newton (Princípio da Inércia), um corpo em repouso tende a permanecer em repouso e um corpo em movimento retilíneo uniforme tende a permanecer nesse estado a menos que:",
            opcoes: [
                "A gravidade atue perpendicularmente ao vetor de velocidade.",
                "Uma força resultante não nula atue sobre ele, alterando seu estado mecânico.",
                "Ele perca calor para o meio ambiente circundante.",
                "Sua velocidade atinja o limiar da velocidade da luz no vácuo."
            ],
            correta: 1,
            tema: "Física: Mecânica Clássica e Leis de Newton"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Os números de casos atendidos em uma unidade de saúde paulista seguiram uma Progressão Aritmética (PA) ao longo de cinco dias: 12, 19, 26, 33, 40. A soma total de atendimentos realizados nessa unidade durante esses cinco dias foi de:",
            opcoes: [
                "115 atendimentos",
                "130 atendimentos",
                "145 atendimentos",
                "160 atendimentos"
            ],
            correta: 1,
            tema: "Matemática: Progressão Aritmética (Soma dos Termos de uma PA)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em ervilhas-de-cheiro (Pisum sativum), o alelo para sementes amarelas (V) é dominante sobre o alelo para sementes verdes (v). Do cruzamento entre duas plantas heterozigotas (Vv × Vv), a proporção fenotípica esperada na descendência é de:",
            opcoes: [
                "100% de plantas com sementes amarelas.",
                "75% sementes amarelas e 25% sementes verdes (proporção 3:1).",
                "50% sementes amarelas e 50% sementes verdes (proporção 1:1).",
                "25% sementes amarelas e 75% sementes verdes."
            ],
            correta: 1,
            tema: "Biologia: 1ª Lei de Mendel e Probabilidade Genética"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) 'O Tratado de Tordesilhas, assinado em 1494 entre Portugal e Espanha, dividiu o mundo ultramarino a partir de um meridiano a 370 léguas a oeste de Cabo Verde.' No contexto da colonização do Brasil, as capitanias hereditárias implementadas pela Coroa portuguesa em 1534 objetivavam:",
            opcoes: [
                "Permitir a posse da terra aos povos originários tupi-guarani sob supervisão régia.",
                "Povoar e defender a costa brasileira contra invasões estrangeiras transferindo os custos à iniciativa privada.",
                "Estabelecer de imediato a mineração de ouro e pedras preciosas no interior da colônia.",
                "Declarar a emancipação política das províncias ultramarinas perante a Coroa britânica."
            ],
            correta: 1,
            tema: "História: Brasil Colônia / Capitanias Hereditárias e Economia Açucareira"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) As estações do ano ocorrem em ritmos opostos nos hemisférios Norte e Sul. A causa científica fundamental dessa alternância climática ao longo do ano é:",
            opcoes: [
                "A variação na distância entre a Terra e o Sol ao longo da órbita elíptica (afélio e periélio).",
                "A inclinação do eixo de rotação da Terra (aproximadamente 23,5°) combinada com o movimento de translação.",
                "A rotação diária da Terra associada às variações dos ventos alísios tropicais.",
                "A atração gravitacional combinada da Lua e dos planetas vizinhos sobre a atmosfera."
            ],
            correta: 1,
            tema: "Geografia: Movimentos da Terra e Climatologia Geral"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O filósofo iluminista Jean-Jacques Rousseau, em sua obra 'Do Contrato Social' (1762), argumenta que o fundamento da autoridade política legítima reside na:",
            opcoes: [
                "Tradição monárquica do direito divino dos reis.",
                "Vontade geral do povo soberano, mediante um pacto social que garanta a liberdade civil.",
                "Submissão incondicional do cidadão ao poder absolutista do soberano Leviatã.",
                "Propriedade privada irrestrita regulada exclusivamente pelo livre mercado."
            ],
            correta: 1,
            tema: "Filosofia: Filosofia Política Moderna / Contratualismo de Rousseau"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) In scientific texts, the passive voice is frequently used to emphasize the process rather than the agent. Identify the sentence written in the correct Passive Voice form:",
            opcoes: [
                "The researchers collected fifty water samples yesterday.",
                "Fifty water samples were collected by the researchers yesterday.",
                "Fifty water samples have collect by the researchers yesterday.",
                "The researchers was collected fifty water samples yesterday."
            ],
            correta: 1,
            tema: "Língua Inglesa: Voz Passiva (Passive Voice) em Textos Científicos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na análise sociológica de Max Weber, o conceito de 'ação social' distingue-se de um mero comportamento reflexo porque a ação social é:",
            opcoes: [
                "Praticada unicamente por indivíduos isolados em ambiente doméstico.",
                "Dotada de sentido subjetivo orientado pela conduta e pelas expectativas de outros indivíduos.",
                "Imposta compulsoriamente pelas instituições jurídicas do Estado Moderno.",
                "Determinada de modo automático pelas condições materiais de produção da infraestrutura."
            ],
            correta: 1,
            tema: "Sociologia: Ação Social e Tipos Puros em Max Weber"
        }
    ],
    '2º Ano - 2023': [
        {
            pergunta: "(Provão Paulista / VUNESP) Em 'O Cortiço' (1890), Aluísio Azevedo constrói uma narrativa naturalista onde o comportamento das personagens é determinado pelo meio, pela raça e pelo momento histórico (determinismo taineano). A transformação do português Jerônimo, que abandona seus antigos hábitos e família para viver com a mulata Rita Baiana, ilustra:",
            opcoes: [
                "O triunfo da moral burguesa sobre os instintos primários dos habitantes do cortiço.",
                "A influência irresistível do meio tropical e da sensualidade sobre a conduta moral do indivíduo.",
                "A exaltação do romantismo idealizado onde o amor supera todas as barreiras sociais.",
                "A denúncia do trabalho assalariado como única causa da decadência psicológica do proletariado."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Naturalismo Brasileiro / Determinismo"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Os hidrocarbonetos constituem a principal matéria-prima fóssil para combustíveis e plásticos. O composto orgânico de fórmula estrutural CH₃–CH₂–CH=CH₂ pertence à função hidrocarboneto e possui a seguinte nomenclatura oficial (IUPAC):",
            opcoes: [
                "Butano",
                "But-1-eno",
                "But-2-ino",
                "Ciclobutano"
            ],
            correta: 1,
            tema: "Química Orgânica: Hidrocarbonetos Alcenos e Nomenclatura IUPAC"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em uma residência no interior de SP, um chuveiro elétrico de potência 5.500 W (5,5 kW) é utilizado diariamente durante 30 minutos (0,5 h). Ao final de um mês de 30 dias, a energia elétrica consumida exclusivamente por esse chuveiro, em quilowatts-hora (kWh), é de:",
            opcoes: [
                "27,5 kWh",
                "82,5 kWh",
                "165,0 kWh",
                "275,0 kWh"
            ],
            correta: 1,
            tema: "Física: Eletrodinâmica / Potência e Consumo de Energia Elétrica"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A escala Richter quantifica a magnitude sísmica por meio de uma função logarítmica da forma M = ⅔ · log₁₀(E / E₀). Se uma medição resulta no cálculo de log₁₀(x) = 3, o valor real da variável x corresponde a:",
            opcoes: [
                "30",
                "100",
                "1.000",
                "10.000"
            ],
            correta: 2,
            tema: "Matemática: Propriedades dos Logaritmos e Funções Exponenciais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O processo de magnificação trófica (bioacumulação) ocorre ao longo das cadeias alimentares quando poluentes não biodegradáveis (como pesticidas organoclorados ou mercúrio) são ingeridos. Os organismos mais prejudicados e que concentram a maior taxa tóxica no topo da cadeia são os:",
            opcoes: [
                "Produtores primários (fitoplâncton e algas)",
                "Consumidores primários (herbívoros)",
                "Consumidores quaternários ou predadores de topo",
                "Decompositores bacterianos exclusivamente"
            ],
            correta: 2,
            tema: "Biologia: Ecologia / Cadeias Alimentares e Bioacumulação"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Proclamação da República no Brasil, ocorrida em 15 de novembro de 1889, resultou da convergência de interesses entre diferentes setores descontentes com o Império. Dentre esses setores, destacaram-se:",
            opcoes: [
                "A Igreja Católica ultramontana e os escravizados recém-libertos pela Lei Áurea.",
                "A cafeicultura paulista (oeste paulista) defensora do federalismo e o Exército positivista.",
                "A aristocracia açucareira nordestina e a Coroa britânica interessada no monopólio têxtil.",
                "Os sindicatos operários anarquistas e os imigrantes italianos fabris."
            ],
            correta: 1,
            tema: "História: Crise do Império e Proclamação da República"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O fenômeno oceânico-atmosférico denominado 'El Niño' caracteriza-se pelo aquecimento anômalo das águas superficiais do Oceano Pacífico Equatorial. No Brasil, os efeitos climáticos típicos desse fenômeno incluem:",
            opcoes: [
                "Secas históricas na Região Sul e chuvas torrenciais generalizadas no semiárido nordestino.",
                "Aumento expressivo das chuvas e inundações na Região Sul e estiagem severa no semiárido setentrional e leste da Amazônia.",
                "Queda abrupta de temperatura com nevascas no Sudeste e umidade extrema no Centro-Oeste.",
                "Estabilização térmica total em todas as regiões brasileiras sem desvios de pluviosidade."
            ],
            correta: 1,
            tema: "Geografia: Dinâmica Climática Global e Impactos do El Niño no Brasil"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Para Karl Marx, a produção na sociedade capitalista fundamenta-se na extração de 'mais-valia', que pode ser conceituada como:",
            opcoes: [
                "O imposto cobrado pelo Estado burguês para financiar obras públicas de infraestrutura.",
                "A diferença entre o valor total gerado pelo trabalho do operário e o salário pago a ele pela sua força de trabalho.",
                "O lucro obtido exclusivamente através de transações especulativas na bolsa de valores.",
                "A remuneração justa e proporcional ao esforço individual de cada trabalhador na linha de montagem."
            ],
            correta: 1,
            tema: "Sociologia: Teoria Marxista / Mais-Valia e Luta de Classes"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Consider the sentence: 'By the time the rescue team arrived at the isolated village, the floodwaters ___ already damaged dozens of houses.'. The verb form that correctly completes the sentence is:",
            opcoes: [
                "have",
                "had",
                "were",
                "will have"
            ],
            correta: 1,
            tema: "Língua Inglesa: Past Perfect Tense e Relações de Anterioridade Temporal"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em uma função quadrática da forma f(x) = ax² + bx + c com a ≠ 0, a coordenada x do vértice (ponto de máximo ou mínimo da parábola) é calculada por xv = -b / (2a). Para a função f(x) = x² - 6x + 8, o ponto vértice e o valor mínimo são, respectivamente:",
            opcoes: [
                "Vértice em x = 3 com valor mínimo f(3) = -1",
                "Vértice em x = -3 com valor mínimo f(-3) = 35",
                "Vértice em x = 6 com valor mínimo f(6) = 8",
                "Vértice em x = 2 com valor mínimo f(2) = 0"
            ],
            correta: 0,
            tema: "Matemática: Funções Polinomiais do 2º Grau e Vértice da Parábola"
        }
    ],
    '2º Ano - 2024': [
        {
            pergunta: "(Provão Paulista / VUNESP) Leia o trecho de 'Os Sertões' (1902), de Euclides da Cunha: 'O sertanejo é, antes de tudo, um forte. Não tem o raquitismo exaustivo dos mestiços neurastênicos do litoral...'. A obra, inserida no Pré-Modernismo brasileiro, caracteriza-se pela:",
            opcoes: [
                "Exaltação ingênua e ufanista da vida na corte do Rio de Janeiro da Belle Époque.",
                "Denúncia do massacre militar em Canudos combinada a uma rigorosa análise científica (geográfica, antropológica e histórica) do sertão nordestino.",
                "Criação de versos parnasianos de métrica perfeita sem qualquer engajamento social.",
                "Ficção romanesca centrada nas lendas do folclore amazônico e heróis mitológicos."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Pré-Modernismo / Euclides da Cunha"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A isomeria espacial óptica manifesta-se em moléculas que possuem pelo menos um carbono assimétrico ou quiral (carbono ligado a quatro grupos ligantes distintos). Qual dos compostos abaixo apresenta isomeria óptica?",
            opcoes: [
                "Etanol (CH₃–CH₂–OH)",
                "Ácido lático / 2-hidroxipropanoico (CH₃–CH(OH)–COOH)",
                "Metano (CH₄)",
                "Propan-2-ol (CH₃–CH(OH)–CH₃)"
            ],
            correta: 1,
            tema: "Química Orgânica: Isomeria Espacial Óptica e Carbono Quiral"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A 2ª Lei da Termodinâmica estabelece limitações fundamentais às transformações de energia. De acordo com essa lei física:",
            opcoes: [
                "É possível construir uma máquina térmica que transforme integralmente calor em trabalho mecânico em um ciclo contínuo.",
                "O calor flui espontaneamente de um corpo frio para um corpo quente sem a realização de trabalho externo.",
                "A entropia total de um sistema termodinamicamente isolado tende sempre a aumentar ou permanecer constante com o tempo.",
                "A energia mecânica total do universo diminui a cada transformação química."
            ],
            correta: 2,
            tema: "Física: Termodinâmica / 2ª Lei e Conceito de Entropia"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Uma rampa de acessibilidade foi projetada com ângulo de inclinação de 30° em relação ao piso horizontal. Se a rampa atinge uma altura vertical de 1,5 metro no ponto mais alto, o comprimento linear dessa rampa é de (Dado: sen(30°) = 0,5):",
            opcoes: [
                "2,0 metros",
                "3,0 metros",
                "4,5 metros",
                "6,0 metros"
            ],
            correta: 1,
            tema: "Matemática: Trigonometria no Triângulo Retângulo"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O Sistema Nervoso Central humano (SNC) é protegido por ossos e por três membranas conjuntivas conhecidas como meninges (dura-máter, aracnoide e pia-máter). Os órgãos que formam anatomica e funcionalmente o SNC são:",
            opcoes: [
                "Nervos cranianos e gânglios simpáticos",
                "Encéfalo (cérebro, cerebelo e tronco encefálico) e Medula Espinhal",
                "Coração, vasos sanguíneos e pulmões",
                "Rins, ureteres e glândulas suprarrenais"
            ],
            correta: 1,
            tema: "Biologia: Anatomia e Fisiologia do Sistema Nervoso Humano"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A 'Era Vargas' (1930-1945) introduziu profundas transformações na estrutura política e econômica brasileira. Entre as medidas mais marcantes do primeiro governo Getúlio Vargas, destacam-se:",
            opcoes: [
                "A privatização imediata da indústria pesada e o fim do protecionismo cambial.",
                "A consolidação da legislação trabalhista (CLT em 1943) e a industrialização de base (CSN e Vale do Rio Doce).",
                "A adoção do sistema parlamentarista republicano e o fechamento de todas as ferrovias.",
                "A descentralização administrativa total com ampla autonomia armada para os estados da federação."
            ],
            correta: 1,
            tema: "História: Era Vargas / Trabalhismo e Industrialização de Base"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Teoria da Tectônica de Placas explica a ocorrência de sismos, vulcanismos e a formação de cadeias orogenéticas (montanhas). A Cordilheira dos Andes na América do Sul resulta da colisão entre quais placas tectônicas?",
            opcoes: [
                "Placa de Nazca (oceânica) e Placa Sul-Americana (continental), configurando uma zona de subducção e convergência.",
                "Placa Africana e Placa Norte-Americana em limite divergente oceânico.",
                "Placa do Pacífico e Placa Euroasiática em limite transformante lateral.",
                "Placa da Antártida e Placa do Caribe em zona de rifteamento continental."
            ],
            correta: 0,
            tema: "Geografia: Geologia Estrutural e Tectônica de Placas"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O sociólogo polonês Zygmunt Bauman formulou a metáfora da 'Modernidade Líquida' para caracterizar a sociedade contemporânea. De acordo com Bauman, as relações humanas na atualidade são marcadas por:",
            opcoes: [
                "Vínculos comunitários indissolúveis, sólidos e permanentes de geração em geração.",
                "Fragilidade, individualismo exacerbado, efemeridade dos laços afetivos e consumo instantâneo.",
                "Retorno aos preceitos religiosos e dogmáticos da Idade Média feudal.",
                "Certezas inabaláveis sobre o futuro e estabilidade profissional vitalícia."
            ],
            correta: 1,
            tema: "Sociologia: Zygmunt Bauman e a Modernidade Líquida"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Read the sentence: 'If solar panels were cheaper, more families ___ them on their rooftops.'. The correct verb form to complete this Second Conditional structure is:",
            opcoes: [
                "will install",
                "would install",
                "installed",
                "had installed"
            ],
            correta: 1,
            tema: "Língua Inglesa: Second Conditional (Hipóteses no Presente/Futuro)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Um investidor aplicou um capital de R$ 5.000,00 sob regime de juros simples a uma taxa de 2% ao mês durante 6 meses. O valor total dos juros obtidos (J = C · i · t) e o montante final resgatado são:",
            opcoes: [
                "Juros de R$ 600,00 e Montante de R$ 5.600,00",
                "Juros de R$ 300,00 e Montante de R$ 5.300,00",
                "Juros de R$ 1.200,00 e Montante de R$ 6.200,00",
                "Juros de R$ 500,00 e Montante de R$ 5.500,00"
            ],
            correta: 0,
            tema: "Matemática Financeira: Juros Simples e Montante"
        }
    ],
    '3º Ano - 2023': [
        {
            pergunta: "(Provão Paulista / VUNESP) Na década de 1950, o Concretismo (liderado pelos poetas Augusto de Campos, Haroldo de Campos e Décio Pignatari) inaugurou uma vanguarda poética revolucionária no Brasil. A proposta estética do poema concreto caracteriza-se fundamentalmente por:",
            opcoes: [
                "Narrativas épicas em versos decassílabos sobre a colonização do sertão.",
                "Exploração do espaço gráfico visual da página em branco, valorização sonoro-visual e eliminação do verso linear tradicional.",
                "Lirismo intimista e confessional de temática religiosa ultrarromântica.",
                "Preservação rigorosa da sintaxe clássica e de rimas ricas emparelhadas."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Vanguardas Poéticas / Concretismo Brasileiro"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na produção industrial de sabões e sabonetes, óleos ou gorduras vegetais/animais (triglicerídeos) reagem com uma base inorgânica forte (como NaOH) sob aquecimento. Essa reação de hidrólise alcalina de ésteres é denominada:",
            opcoes: [
                "Esterificação de Fischer",
                "Reação de Saponificação",
                "Combustão completa",
                "Craqueamento catalítico"
            ],
            correta: 1,
            tema: "Química Orgânica: Reações de Saponificação e Lipídios"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Uma partícula com carga elétrica puntiforme q = +3 × 10⁻⁶ C move-se com velocidade v = 2 × 10⁴ m/s perpendicularmente às linhas de indução de um campo magnético uniforme de intensidade B = 0,5 T. A força magnética (Fm = |q| · v · B · sen θ) que atua sobre a partícula é igual a:",
            opcoes: [
                "0,015 N",
                "0,030 N",
                "0,300 N",
                "3,000 N"
            ],
            correta: 1,
            tema: "Física: Eletromagnetismo / Força Magnética de Lorentz sobre Carga Móvel"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) No sistema de juros compostos, o montante M gerado por um capital C aplicado à taxa i por n períodos é dado pela expressão M = C · (1 + i)ⁿ. Se um capital de R$ 10.000,00 for aplicado à taxa de 10% ao ano durante 2 anos, o montante final será de:",
            opcoes: [
                "R$ 11.000,00",
                "R$ 12.000,00",
                "R$ 12.100,00",
                "R$ 13.310,00"
            ],
            correta: 2,
            tema: "Matemática: Matemática Financeira / Juros Compostos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O dogma central da Biologia Molecular descreve o fluxo de informação genética na célula: o DNA é transcrito em RNA mensageiro, que é traduzido em proteínas nos ribossomos. Se uma fita molde de DNA apresenta a sequência de bases 3'-TAC GGC TTA-5', o RNA mensageiro transcrito correspondente terá a sequência:",
            opcoes: [
                "5'-AUG CCG AAU-3'",
                "5'-ATG CCG AAT-3'",
                "5'-UAC GGC UUA-3'",
                "5'-AUC GGC UUA-3'"
            ],
            correta: 0,
            tema: "Biologia: Biologia Molecular / Transcrição Gênica e Código Genético"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Guerra Fria (1947–1991) caracterizou-se pela bipolarização global entre os blocos liderados pelos Estados Unidos (capitalismo) e pela União Soviética (socialismo). Durante esse período, a contenção bélica direta entre as duas superpotências deveu-se principalmente:",
            opcoes: [
                "À intervenção militar pacificadora obrigatória exercida pela Liga das Nações.",
                "À Doutrina da Destruição Mútua Assegurada (MAD) proporcionada pela proliferação de arsenais nucleares.",
                "Ao desarmamento atômico voluntário promovido em conjunto pelos dois países em 1950.",
                "À dependência financeira mútua em um comércio internacional totalmente desregulamentado."
            ],
            correta: 1,
            tema: "História: Guerra Fria / Geopolítica Bipolar e Corrida Armamentista"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A chamada 'República Oligárquica' ou da 'Espada e Café com Leite' (1894–1930) no Brasil foi sustentada pela chamada 'Política dos Governadores', articulada pelo presidente Campos Sales. Esse arranjo político baseava-se em:",
            opcoes: [
                "Eleições com voto secreto, universal e fiscalizadas por tribunais independentes.",
                "Troca mútua de favores entre o governo federal e as oligarquias estaduais dominantes, sustentada pelo coronelismo e voto de cabresto.",
                "Reforma agrária ampla para fortalecer os pequenos colonos imigrantes do interior.",
                "Nacionalização de bancos estrangeiros e concessão de crédito estatal à indústria operária."
            ],
            correta: 1,
            tema: "História: República Velha / Coronelismo e Política dos Governadores"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O filósofo alemão Jürgen Habermas propõe em sua teoria social o conceito de 'Agir Comunicativo'. Para Habermas, a emancipação democrática fundamenta-se:",
            opcoes: [
                "Na coerção física e imposição unilateral da lei pela força militar do Estado.",
                "No diálogo racional livre de coações, em que os cidadãos buscam o consenso pelo melhor argumento.",
                "No cálculo utilitarista individual de ganhos e perdas econômicas no mercado financeiro.",
                "Na manipulação da opinião pública pelas grandes corporações de mídia digital."
            ],
            correta: 1,
            tema: "Filosofia: Teoria Crítica / Razão Comunicativa de Habermas"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Complete with the correct Third Conditional form: 'If the emergency alarm had sounded in time, the workers ___ the facility without casualties.'.",
            opcoes: [
                "would evacuate",
                "would have evacuated",
                "had evacuated",
                "will have evacuated"
            ],
            correta: 1,
            tema: "Língua Inglesa: Third Conditional (Situações Hipotéticas Irreais no Passado)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Seja o número complexo z = 3 + 4i na sua forma algébrica, onde i é a unidade imaginária (i² = -1). O módulo desse número complexo, dado por |z| = √(a² + b²), é igual a:",
            opcoes: [
                "√7",
                "5",
                "7",
                "25"
            ],
            correta: 1,
            tema: "Matemática: Números Complexos e Plano de Argand-Gauss"
        }
    ],
    '3º Ano - 2024': [
        {
            pergunta: "(Provão Paulista / VUNESP) Em 'Vidas Secas' (1938), Graciliano Ramos constrói a narrativa da família de retirantes sertanejos (Fabiano, Sinhá Vitória, os dois meninos e a cachorra Baleia). O romance modernista da 2ª fase destaca-se estilisticamente pela:",
            opcoes: [
                "Linguagem rebuscada, prolixa e ornamental inspirada no barroco e arcadismo.",
                "Linguagem seca, concisa e despojada de sentimentalismos, espelhando a aridez do sertão e a mudez social das personagens.",
                "Idealização heróica dos retirantes sertanejos como seres imunes à fome e às intempéries climáticas.",
                "Predomínio de versos livres rimados de exaltação ao progresso das cidades litorâneas."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Modernismo Brasileiro (2ª Fase) / Graciliano Ramos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na estequiometria química, a combustão completa do gás metano ocorre segundo a equação balanceada: CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(v). Queimando-se completamente 32 g de gás metano (Massa molar do CH₄ = 16 g/mol; CO₂ = 44 g/mol), a massa de dióxido de carbono (CO₂) formada é de:",
            opcoes: [
                "44 g",
                "66 g",
                "88 g",
                "132 g"
            ],
            correta: 2,
            tema: "Química: Cálculos Estequiométricos e Leis Ponderais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Teoria da Relatividade Especial de Albert Einstein (1905) revolucionou os conceitos de espaço e tempo da física clássica. Um de seus postulados fundamentais estabelece que:",
            opcoes: [
                "A velocidade da luz no vácuo é uma constante universal (c ≈ 3 × 10⁸ m/s), independente do movimento da fonte ou do observador.",
                "O tempo transcorre de maneira idêntica e absoluta para todos os referenciais inerciais no universo.",
                "A massa de um corpo diminui e anula-se à medida que sua velocidade se aproxima da velocidade da luz.",
                "A velocidade da luz varia de acordo com a velocidade do observador que se desloca em sua direção."
            ],
            correta: 0,
            tema: "Física: Física Moderna / Postulados da Relatividade Especial de Einstein"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Uma urna contém 5 bolas vermelhas, 3 bolas azuis e 2 bolas amarelas idênticas em tamanho e peso. Retirando-se aleatoriamente uma única bola dessa urna, a probabilidade de que a bola retirada seja azul é de:",
            opcoes: [
                "15%",
                "20%",
                "30%",
                "50%"
            ],
            correta: 2,
            tema: "Matemática: Probabilidade Simples em Espaço Amostral Finito"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A respiração celular aeróbia é o processo pelo qual as células eucariontes extraem energia química da molécula de glicose para produzir ATP. Esse processo bioquímico divide-se em três etapas sucessivas:",
            opcoes: [
                "Fotossíntese, ciclo de Calvin e quimiossíntese.",
                "Glicólise (no citoplasma), Ciclo de Krebs (na matriz mitocondrial) e Cadeia Respiratória / Fosforilação Oxidativa (nas cristas mitocondriais).",
                "Fermentação láctica, fermentação alcoólica e ciclo do nitrogênio.",
                "Fagocitose, pinocitose e transcrição reversa."
            ],
            correta: 1,
            tema: "Biologia: Bioenergética / Respiração Celular Aeróbia e Mitocôndria"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O processo de Redemocratização brasileira, que culminou no término do regime militar (1964–1985), teve como marco de mobilização cívica popular o movimento das 'Diretas Já' (1984). Embora a emenda Dante de Oliveira não tenha atingido os votos necessários para eleições diretas imediatas, o processo resultou em:",
            opcoes: [
                "Permanência indefinida da junta militar no controle do poder executivo até o ano 2000.",
                "Eleição de Tancredo Neves no Colégio Eleitoral em 1985 e promulgação da 'Constituição Cidadã' de 1988.",
                "Dissolução imediata do Congresso Nacional e instauração de nova censura à imprensa.",
                "Proclamação de um regime monárquico parlamentarista por plebiscito popular."
            ],
            correta: 1,
            tema: "História: Fim da Ditadura Militar, Redemocratização e CF de 1988"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O processo de urbanização acelerada vivido pelo Brasil a partir da década de 1950, estimulado pela industrialização concentrada na Região Sudeste, gerou o fenômeno da 'macrometafização' e da periferização urbana. Entre suas consequências socioespaciais diretas, destaca-se:",
            opcoes: [
                "A erradicação dos déficits habitacionais e a distribuição equitativa de saneamento básico em todas as regiões metropolitanas.",
                "A segregação socioespacial com proliferação de favelas, ocupação de áreas de risco e precariedade na mobilidade urbana.",
                "A transferência massiva da população das capitais litorâneas para o interior da floresta amazônica.",
                "O esvaziamento das cidades médias em favor exclusivo das zonas rurais agrícolas."
            ],
            correta: 1,
            tema: "Geografia: Urbanização Brasileira e Segregação Socioespacial"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O filósofo iluminista Immanuel Kant, ao responder à pergunta 'O que é o Esclarecimento?' (Aufklärung, 1784), defendeu que o esclarecimento consiste na saída do ser humano da sua 'menoridade culpada', sintetizada na célebre máxima latina:",
            opcoes: [
                "'Carpe diem' (Aproveite o dia presente)",
                "'Sapere aude!' (Tenha a coragem de fazer uso do seu próprio entendimento sem tutela de outrem)",
                "'Cogito, ergo sum' (Penso, logo existo)",
                "'Homo homini lupus' (O homem é o lobo do próprio homem)"
            ],
            correta: 1,
            tema: "Filosofia: O Iluminismo Kantiano e a Autonomia da Razão"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Read the excerpt: 'Artificial Intelligence algorithms are increasingly embedded in healthcare, analyzing radiological scans with higher speed than human clinicians. Nonetheless, ethical guidelines must prevent biased outcomes.'. The word 'Nonetheless' conveys an idea of:",
            opcoes: [
                "Conclusion or summary of previous arguments.",
                "Contrast, opposition or concession to the preceding statement.",
                "Addition of similar technical examples.",
                "Cause and consequence between technology and society."
            ],
            correta: 1,
            tema: "Língua Inglesa: Conectivos e Marcadores Discursivos (Contrast / Nonetheless)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em estatística básica, a média aritmética e o desvio padrão são medidas de tendência central e de dispersão, respectivamente. Um aluno obteve notas 6,0; 7,0; 8,0 e 9,0 em quatro avaliações bimestrais. A média aritmética dessas notas é:",
            opcoes: [
                "7,0",
                "7,5",
                "8,0",
                "8,5"
            ],
            correta: 1,
            tema: "Matemática: Estatística Básica / Média Aritmética"
        }
    ],
    'Simulado Geral': [
        {
            pergunta: "(Provão Paulista / VUNESP) No romance machadiano 'Memórias Póstumas de Brás Cubas' (1881), que inaugurou o Realismo no Brasil, o protagonista narra sua trajetória após a morte como um 'defunto autor'. Esse recurso narrativo inovador permitiu a Machado de Assis:",
            opcoes: [
                "Exaltar a nobreza e generosidade desinteressada da elite imperial carioca.",
                "Analisar com ironia implacável a hipocrisia, o parasitismo e as contradições morais da sociedade burguesa de sua época.",
                "Defender fervorosamente os dogmas religiosos do catolicismo tradicional.",
                "Construir um melodrama romântico centrado no sofrimento de amantes proibidos."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Realismo Machadiano / Ironia e Crítica Social"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Lei de Hess fundamenta a termoquímica afirmando que a variação de entalpia (ΔH) de uma reação química depende exclusivamente dos estados inicial e final, sendo independente do número de etapas intermediárias. Se uma reação apresenta ΔH < 0, ela é classificada termodinamicamente como:",
            opcoes: [
                "Endotérmica, com absorção líquida de calor do ambiente.",
                "Exotérmica, com liberação líquida de calor para as vizinhanças.",
                "Isotérmica perfeita sem troca energética com o meio.",
                "Adiabática com trabalho nulo."
            ],
            correta: 1,
            tema: "Química: Termoquímica / Lei de Hess e Reações Exotérmicas"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A soma dos ângulos internos de um polígono convexo de n lados é dada pela fórmula S = (n - 2) · 180°. Para um hexágono regular (n = 6), a soma de todos os seus ângulos internos e o valor de cada ângulo interno medem, respectivamente:",
            opcoes: [
                "540° e 90°",
                "720° e 120°",
                "900° e 150°",
                "1080° e 180°"
            ],
            correta: 1,
            tema: "Matemática: Geometria Plana / Polígonos Convexos e Ângulos Internos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) As ondas eletromagnéticas propagam-se no vácuo com velocidade c ≈ 3 × 10⁸ m/s e classificam-se no espectro conforme suas frequências e comprimentos de onda. A radiação eletromagnética de maior frequência e maior energia por fóton é a:",
            opcoes: [
                "Onda de rádio AM/FM",
                "Luz visível amarela",
                "Radiação infravermelha",
                "Radiação gama (Raios Gama)"
            ],
            correta: 3,
            tema: "Física: Ondulatória e Espectro Eletromagnético"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A intensificação do efeito estufa antropogênico tem elevado a temperatura média dos oceanos e da atmosfera global. Os principais gases de efeito estufa (GEE) emitidos pelas atividades humanas modernas são:",
            opcoes: [
                "Oxigênio molecular (O₂) e nitrogênio gasoso (N₂)",
                "Dióxido de carbono (CO₂) e gás metano (CH₄)",
                "Gás hélio (He) e argônio (Ar)",
                "Monóxido de carbono e ozônio estratosférico puro"
            ],
            correta: 1,
            tema: "Biologia / Geografia: Ecologia e Mudanças Climáticas Globais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Constituição da República Federativa do Brasil de 1988 consagrou em seu Artigo 5º direitos e garantias fundamentais individuais e coletivos. Um princípio basilar nela estabelecido determina que:",
            opcoes: [
                "A tortura e o tratamento desumano são admitidos em casos de grave comoção interna.",
                "Homens e mulheres são iguais em direitos e obrigações nos termos da Constituição, sendo inviolável a liberdade de consciência e de crença.",
                "A censura prévia de espetáculos públicos e periódicos é permitida aos órgãos executivos de segurança.",
                "A pena de morte pode ser aplicada sumariamente a qualquer crime contra o patrimônio privado."
            ],
            correta: 1,
            tema: "História / Sociologia: Cidadania, Direitos Humanos e Constituição de 1988"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) No pensamento sociológico contemporâneo, a 'globalização' manifesta-se pela interconexão econômica, cultural e tecnológica planetária. No entanto, teóricos como Milton Santos apontam que esse processo produz simultaneamente:",
            opcoes: [
                "Igualdade socioeconômica plena entre todas as nações do globo.",
                "Fragmentação territorial, exclusão digital e aprofundamento das assimetrias entre países ricos e periféricos.",
                "Erradicação completa das crises migratórias e das fronteiras nacionais.",
                "Uniformização absoluta dos idiomas e costumes locais sem qualquer resistência identitária."
            ],
            correta: 1,
            tema: "Geografia / Sociologia: Milton Santos e a Globalização Fragmentada"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Complete with the appropriate future expression indicating a planned, decided intention: 'Look at the schedule! The school board ___ announce the new science fair winners tomorrow morning.'.",
            opcoes: [
                "is going to",
                "will to",
                "shall to",
                "goes"
            ],
            correta: 0,
            tema: "Língua Inglesa: Formas de Futuro (Be going to vs. Will)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em termos de extensão territorial contínua, o Brasil possui mais de 8,5 milhões de km², ocupando qual posição entre os maiores países do mundo em área territorial?",
            opcoes: [
                "3º maior país (atrás de Rússia e Canadá)",
                "5º maior país (atrás de Rússia, Canadá, China e EUA)",
                "7º maior país (atrás da Austrália e Índia)",
                "2º maior país do planeta"
            ],
            correta: 1,
            tema: "Geografia: Território Brasileiro, Fronteiras e Posição Global"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) René Descartes, pai do Racionalismo moderno, estabeleceu a dúvida metódica radical como caminho para encontrar uma certeza indubitável. Ao duvidar de tudo, inclusive das ilusões dos sentidos, Descartes formulou o princípio fundamental do conhecimento:",
            opcoes: [
                "'Tabula rasa' (A mente humana é uma folha em branco)",
                "'Cogito, ergo sum' (Penso, logo existo)",
                "'Só sei que nada sei'",
                "'A existência precede a essência'"
            ],
            correta: 1,
            tema: "Filosofia: Racionalismo Cartesiano e Teoria do Conhecimento"
        }
    ]
};

// Questão padrão caso uma edição sem chave específica seja requisitada
const questoesPadrao = [
    {
        pergunta: "(Provão Paulista / VUNESP) Em 'Memórias Póstumas de Brás Cubas' (1881), de Machado de Assis, o recurso narrativo inovador do 'defunto autor' possibilitou:",
        opcoes: [
            "A exaltação patriótica e ufanista dos costumes do Segundo Reinado.",
            "Uma análise mordaz, irônica e descompromissada da hipocrisia e mesquinhez humana.",
            "A defesa da fé religiosa dogmática contra o cientificismo moderno.",
            "Um enredo policial clássico de investigação sobre o culpado de sua morte."
        ],
        correta: 1,
        tema: "Língua Portuguesa e Literatura: Realismo Machadiano"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) A neutralização estequiométrica total de ácido clorídrico (HCl) por hidróxido de cálcio (Ca(OH)₂) produz água e o sal inorgânico denominado:",
        opcoes: [
            "Cloreto de Cálcio (CaCl₂)",
            "Carbonato de Cálcio (CaCO₃)",
            "Sulfato de Cálcio (CaSO₄)",
            "Nitrato de Cálcio (Ca(NO₃)₂)"
        ],
        correta: 0,
        tema: "Química: Funções Inorgânicas e Reações de Neutralização"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) Um objeto de massa 2 kg é solto a partir do repouso de uma altura de 20 metros em relação ao solo. Desprezando a resistência do ar e adotando g = 10 m/s², a sua velocidade imediatamente antes de atingir o solo é de:",
        opcoes: [
            "10 m/s",
            "15 m/s",
            "20 m/s",
            "40 m/s"
        ],
        correta: 2,
        tema: "Física: Mecânica / Conservação da Energia Mecânica e Queda Livre"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) Qual é o valor de x que satisfaz a equação exponencial 2^(x + 3) = 64?",
        opcoes: [
            "1",
            "2",
            "3",
            "6"
        ],
        correta: 2,
        tema: "Matemática: Equações Exponenciais"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) O processo celular mitótico que produz duas células-filhas geneticamente idênticas à célula-mãe tem como função primária nos organismos pluricelulares:",
        opcoes: [
            "A produção exclusiva de gametas haploides para reprodução sexuada.",
            "O crescimento tecidual, regeneração e renovação celular.",
            "A introdução contínua de variabilidade genética por crossing-over.",
            "A redução pela metade do número cromossômico original da espécie."
        ],
        correta: 1,
        tema: "Biologia: Citologia e Divisão Celular (Mitose vs. Meiose)"
    },
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
    
    // Garante que se o aluno usou o Pomodoro, o multiplicador base vai para 1.2 no mínimo
    if (typeof rodando !== 'undefined' && rodando && modoEstudo) {
        if (multiplicadorAtual < 1.2) multiplicadorAtual = 1.2;
    }
    
    // Removemos o Math.round para manter os números decimais (ex: 4.8, 4.4)
    let pontosFinais = parseFloat(((acertosProva * 2) * multiplicadorAtual).toFixed(1));

    usuarioLogado.pontos += pontosFinais;
    // Arredonda apenas para evitar dízimas periódicas longas na hora de salvar
    usuarioLogado.pontos = parseFloat(usuarioLogado.pontos.toFixed(1)); 
    usuarioLogado.totalAcertos += acertosProva;
    usuarioLogado.totalQuestoes += dadosProvaSimulada.length;
    atualizarBanco(usuarioLogado);
    
    document.getElementById('pontosDisplay').textContent = `${usuarioLogado.pontos} pts`;
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
Regra 3: NÃO use emojis ou asteriscos (*) nas suas respostas. 
Regra 4: Dê respostas curtas e diretas, mas suficientes para compreensão.
Regra 5: No final de cada resposta, sugira um site, livro, vídeo ou filme para explicar a dúvida melhor.
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
            arquivo: arquivoBase64, nomeArquivo: nomeArquivo,
            dataHora: new Date().toLocaleString(),
            profNome: usuarioLogado.nome,
            profFoto: usuarioLogado.foto || null
        };
        let conteudos = JSON.parse(localStorage.getItem('bd_conteudos')) || [];
        conteudos.push(novoConteudo);
        localStorage.setItem('bd_conteudos', JSON.stringify(conteudos));

        // Envia para o servidor para persistir entre navegadores e dispositivos
        if (window.API && typeof window.API.salvarConteudo === 'function') {
            window.API.salvarConteudo(novoConteudo).catch(err => {
                console.warn('[StudySP] Falha ao enviar aula para o servidor:', err);
            });
        }

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
        profNome: (usuarioLogado && usuarioLogado.nome) ? usuarioLogado.nome : 'Professor',
        dataHora: new Date().toLocaleString()
    };

    let simulados = JSON.parse(localStorage.getItem('bd_simulados')) || [];
    simulados.push(novaQuestao);
    localStorage.setItem('bd_simulados', JSON.stringify(simulados));
    
    // Injeta a nova questão na variável da prova atual
    questoesProfessor.push(novaQuestao);
    dadosProvaSimulada.push(novaQuestao);

    // Envia para o servidor para persistir para todos os alunos em qualquer navegador
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

    questoesProfessor = questoesProfessor.filter(q => String(q.id) !== idStr);
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
    questoesProfessor = questoes;

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

// ==========================================
// BANCO DETALHADO DE ESTRUTURA DOS TCCS (18 PROJETOS)
// ==========================================
const tccIdeiasDetalhes = {
    'ds_1': {
        curso: 'Desenvolvimento de Sistemas',
        autor: 'João Silva',
        titulo: 'App de Mobilidade Escolar Compartilhada',
        tema: 'Roteirização Inteligente e Carona Solidária para Comunidades Escolares',
        problema: 'Falta de integração e segurança no deslocamento de estudantes de bairros afastados até a escola técnica, resultando em altos índices de atrasos matutinos e evasão escolar no primeiro módulo.',
        objetivo: 'Desenvolver um aplicativo mobile seguro que conecta responsáveis e estudantes de trajetos comuns, possibilitando grupos de caminhada monitorada e caronas solidárias verificadas pela secretaria escolar.',
        metodologia: 'Levantamento de requisitos com 120 pais e alunos, prototipagem navegável no Figma, backend desenvolvido em Node.js com banco PostgreSQL e mapas integrados via Leaflet/OpenStreetMap com criptografia ponta a ponta.',
        resultados: 'Projeto-piloto com 85 famílias ativas no município, reduzindo atrasos em 38% e aumentando a sensação de segurança comunitária para mais de 90% dos usuários cadastrados.'
    },
    'ds_2': {
        curso: 'Desenvolvimento de Sistemas',
        autor: 'Maria Fernanda',
        titulo: 'IA para Triagem e Orientação de Currículos de Jovens Aprendizes',
        tema: 'Inteligência Artificial e Processamento de Linguagem Natural na Inclusão Produtiva',
        problema: 'Estudantes do Ensino Médio enfrentam extrema dificuldade para estruturar seus primeiros currículos com palavras-chave e competências adequadas aos sistemas automatizados (ATS) dos processos seletivos.',
        objetivo: 'Construir uma ferramenta web inteligente que avalia currículos enviados em PDF, destaca lacunas formativas e sugere cursos gratuitos alinhados à BNCC e ao perfil das vagas ofertadas no CIEE.',
        metodologia: 'Processamento de texto em Python (spaCy e NLTK), integração com API LLM para feedback personalizado, interface web responsiva em HTML5/CSS3/Vanilla JS e hospedagem em nuvem.',
        resultados: 'Validação com 160 jovens do ensino técnico, alcançando taxa de aprovação para entrevistas 42% superior ao grupo de controle que utilizou modelos de currículo tradicionais.'
    },
    'ds_3': {
        curso: 'Desenvolvimento de Sistemas',
        autor: 'Pedro Santos',
        titulo: 'Sistema Integrado de Gestão de Laboratórios e Equipamentos Escolares',
        tema: 'Sistemas Web para Otimização de Infraestrutura e Recursos Pedagógicos',
        problema: 'Desorganização e frequentes conflitos no agendamento de laboratórios de informática, kits de robótica e projetores, decorrentes de controles feitos em cadernos físicos de papel.',
        objetivo: 'Implementar um sistema web dinâmico de reserva de ambientes com controle de permissões por perfil (gestor, docente e monitor), acompanhamento de manutenções e inventário patrimonial por QR Code.',
        metodologia: 'Arquitetura MVC com PHP 8 e MySQL, autenticação JWT, geração automatizada de etiquetas QR Code para equipamentos e módulo de relatórios de uso em PDF.',
        resultados: 'Implantação na unidade escolar, zerando duplicidades de reserva e reduzindo em 65% o tempo ocioso dos laboratórios de informática.'
    },
    'jur_1': {
        curso: 'Serviços Jurídicos',
        autor: 'Ana Luísa',
        titulo: 'Cartilha Interativa dos Direitos do Consumidor Jovem no E-Commerce',
        tema: 'Educação Jurídica e Proteção do Consumidor nas Compras Digitais',
        problema: 'Aumento expressivo de compras por impulso em redes sociais (TikTok e Instagram) por menores de idade, gerando endividamento precoce e vulnerabilidade a golpes sem compreensão do Código de Defesa do Consumidor.',
        objetivo: 'Produzir uma cartilha jurídica interativa e linguagem acessível detalhando direitos de arrependimento (art. 49 do CDC), prazos para troca de produtos com defeito e identificação de publicidade enganosa.',
        metodologia: 'Pesquisa legislativa no CDC e jurisprudências recentes do TJ-SP sobre golpes via PIX, aplicação de questionário diagnóstico com 200 jovens e desenvolvimento de infográficos visuais.',
        resultados: 'Distribuição digital do guia para mais de 1.400 estudantes, elevando a taxa de acerto em testes sobre direitos básicos do consumidor de 31% para 89%.'
    },
    'jur_2': {
        curso: 'Serviços Jurídicos',
        autor: 'Carlos Almeida',
        titulo: 'Impactos e Conformidade da LGPD no Tratamento de Dados de Menores nas Escolas',
        tema: 'Lei Geral de Proteção de Dados (Lei nº 13.709/2018) na Gestão Escolar',
        problema: 'Escolas armazenam e compartilham rotineiramente fotos de eventos, notas e laudos psicológicos de crianças e adolescentes sem formulários adequados de consentimento específico dos responsáveis legais.',
        objetivo: 'Elaborar um modelo prático de Governança de Privacidade em conformidade com o Artigo 14 da LGPD, fornecendo minutas de termos de consentimento e plano de resposta a incidentes para escolas públicas.',
        metodologia: 'Estudo de caso exploratório em duas unidades de ensino, análise dogmática da lei e consultas a pareceres da Autoridade Nacional de Proteção de Dados (ANPD).',
        resultados: 'Adoção da minuta contratual e da cartilha de boas práticas pela equipe gestora da escola, estabelecendo protocolo seguro de veiculação de imagens pedagógicas.'
    },
    'jur_3': {
        curso: 'Serviços Jurídicos',
        autor: 'Beatriz Costa',
        titulo: 'Guia de Mediação Comunitária e Justiça Restaurativa no Ambiente Escolar',
        tema: 'Meios Adequados de Solução de Conflitos e Prevenção à Violência Escolar',
        problema: 'A aplicação exclusiva de medidas punitivas tradicionais (suspensão e advertência) não tem sido eficaz para resolver desavenças interpessoais e casos de cyberbullying entre estudantes.',
        objetivo: 'Estruturar um roteiro metodológico para implantação de Círculos Restaurativos e formação de comissões de alunos mediadores, respaldado na Lei de Mediação (Lei nº 13.140/2015).',
        metodologia: 'Revisão bibliográfica sobre Justiça Restaurativa, realização de oficinas práticas com dinâmicas de Comunicação Não-Violenta (CNV) e acompanhamento simulado de conflitos típicos da rotina escolar.',
        resultados: 'Redução de 55% nos encaminhamentos de ocorrências disciplinares graves à direção e capacitação de 18 estudantes como mediadores voluntários.'
    },
    'log_1': {
        curso: 'Logística',
        autor: 'Lucas Oliveira',
        titulo: 'Otimização de Rotas no Transporte Escolar Municipal',
        tema: 'Pesquisa Operacional, Roteirização de Frotas e Sustentabilidade',
        problema: 'Rotas desorganizadas de vans e micro-ônibus escolares causavam atrasos sistemáticos na chegada às aulas, aumento abusivo do consumo de diesel e emissão excessiva de poluentes.',
        objetivo: 'Mapear todos os pontos de embarque e aplicar técnicas de roteirização baseadas no Problema do Caixeiro Viajante (TSP) para desenhar itinerários mais curtos e eficientes.',
        metodologia: 'Coleta de dados georreferenciados de 210 estudantes via GPS, modelagem computacional no software QGIS e análise comparativa de quilometragem e consumo médio de combustível.',
        resultados: 'Diminuição de 19% nos custos operacionais de combustível e ganho de 22 minutos diários no tempo médio de permanência dos alunos dentro do veículo.'
    },
    'log_2': {
        curso: 'Logística',
        autor: 'Rafael Souza',
        titulo: 'Gestão Sustentável e Controle PEPS/FIFO no Estoque da Merenda Escolar',
        tema: 'Gestão de Suprimentos Perecíveis e Combate ao Desperdício de Alimentos',
        problema: 'Perdas frequentes de hortifrutigranjeiros e laticínios da alimentação escolar em decorrência de estocagem incorreta e falta de método padronizado de rotação de estoque.',
        objetivo: 'Implantar o método PEPS (Primeiro que Entra, Primeiro que Sai) integrado a uma matriz de curva ABC para priorizar itens de alta sensibilidade e curto prazo de validade.',
        metodologia: 'Diagnóstico in loco nos depósitos de 4 escolas, redesenho do layout das despensas, elaboração de fichas técnicas de controle diário e capacitação prática dos colaboradores.',
        resultados: 'Eliminação de 88% do descarte de alimentos por vencimento e aproveitamento integral das compras provenientes da agricultura familiar sustentável.'
    },
    'log_3': {
        curso: 'Logística',
        autor: 'Juliana Mendes',
        titulo: 'Logística Reversa para Descarte Adequado de E-Waste na Comunidade Escolar',
        tema: 'Logística Reversa, Economia Circular e Destinação de Resíduos Sólidos',
        problema: 'Inexistência de pontos de coleta acessíveis para baterias, celulares antigos e cabos quebrados, levando ao descarte no lixo comum e contaminação do solo por metais pesados.',
        objetivo: 'Desenvolver a modelagem completa de uma cadeia reversa para resíduos eletrônicos, integrando postos de coleta voluntária na escola a cooperativas recicladoras certificadas.',
        metodologia: 'Mapeamento de stakeholders, dimensionamento da capacidade de estocagem temporária, análise de custo-benefício de frete compartilhado e palestras de conscientização ecológica.',
        resultados: 'Coleta de mais de 1.100 kg de componentes eletrônicos em três meses de campanha, com certificação oficial de destinação e reciclagem sustentável.'
    },
    'agro_1': {
        curso: 'Agropecuária',
        autor: 'Marcos Vinícius',
        titulo: 'Horta Hidropônica Automatizada de Baixo Custo para Alimentação Escolar',
        tema: 'Agricultura 4.0, Hidroponia NFT e Eficiência no Uso da Água',
        problema: 'Dificuldade de manter hortaliças frescas durante todo o ano letivo devido a períodos severos de estiagem, solo arenoso e falta de mão de obra para manutenção diária.',
        objetivo: 'Construir um protótipo de cultivo hidropônico NFT (Nutrient Film Technique) com automação simples via microcontrolador para controle de bombeamento e oxigenação da solução nutritiva.',
        metodologia: 'Montagem estrutural em perfis de PVC reaproveitados, calibração de sensores de pH e condutividade elétrica, e monitoramento semanal do desenvolvimento de mudas de alface e rúcula.',
        resultados: 'Produção 30% mais rápida comparada ao canteiro de terra tradicional, com economia hídrica superior a 85% e fornecimento semanal de verduras frescas para o refeitório.'
    },
    'agro_2': {
        curso: 'Agropecuária',
        autor: 'Fernanda Lima',
        titulo: 'Bioinseticidas Caseiros à Base de Nim e Calda Bordalesa em Hortas Urbanas',
        tema: 'Controle Biológico e Manejo Agroecológico de Pragas e Doenças',
        problema: 'Contaminação de alimentos e risco de intoxicação por produtores familiares ao utilizarem agrotóxicos sintéticos de alta toxicidade em hortas periurbanas.',
        objetivo: 'Avaliar a eficiência agronômica do extrato aquoso de folhas de Nim (Azadirachta indica) e da calda bordalesa no combate a pulgões e fungos foliares.',
        metodologia: 'Delineamento em blocos casualizados com 4 tratamentos e 5 repetições em canteiros de couve manteiga e tomateiro, com contagem seriada de insetos antes e após pulverizações.',
        resultados: 'Eficácia de combate a pragas de 84% sem qualquer resíduo tóxico na hortaliça colhida, gerando economia de 70% nos custos de insumos agrícolas.'
    },
    'agro_3': {
        curso: 'Agropecuária',
        autor: 'Thiago Ribeiro',
        titulo: 'Sistema Integrado de Captação Pluvial e Irrigação Localizada por Gravidade',
        tema: 'Manejo e Conservação de Recursos Hídricos na Produção Agropecuária',
        problema: 'Gastos elevados na conta de água e perda de plantios durante períodos de estiagem prolongada nas escolas agrícolas do interior do estado.',
        objetivo: 'Projetar e instalar um sistema de captação de água das calhas de galpões agrícolas com filtragem mecânica em camadas e irrigação por gotejamento acionada pela gravidade.',
        metodologia: 'Cálculo do índice pluviométrico regional, dimensionamento de cisterna de alvenaria impermeabilizada e testes de vazão e uniformidade de gotejadores autocompensantes.',
        resultados: 'Armazenamento de 15.000 litros de água pluvial durante o período chuvoso, mantendo a área experimental 100% autossuficiente em irrigação durante o inverno.'
    },
    'vet_1': {
        curso: 'Veterinária',
        autor: 'Mariana Castro',
        titulo: 'Plataforma Digital de Adoção Responsável com Matchmaking Comportamental',
        tema: 'Bem-Estar Animal, Guarda Responsável e Controle Populacional de Zoonoses',
        problema: 'Altas taxas de abandono e devolução de cães resgatados decorrentes de expectativas irreais dos tutores em relação ao porte, nível de energia e necessidades do animal.',
        objetivo: 'Criar uma aplicação web de triagem e adoção que utiliza questionário comportamental para conectar o perfil do adotante ao cão ou gato mais compatível do canil municipal.',
        metodologia: 'Avaliação etológica dos animais abrigados em parceria com médicos veterinários, desenvolvimento do formulário de triagem e teste piloto com duas ONGs de proteção.',
        resultados: '72 adoções intermediadas em 4 meses, com registro de zero devoluções após 90 dias de acompanhamento pós-adoção.'
    },
    'vet_2': {
        curso: 'Veterinária',
        autor: 'Diego Rocha',
        titulo: 'Manual de Primeiros Socorros para Animais de Estimação: Condutas Pré-Clínicas',
        tema: 'Medicina Veterinária Intensiva e Capacitação Comunitária em Emergências Pets',
        problema: 'Muitos animais vêm a óbito antes do atendimento médico veterinário por ações errôneas dos tutores diante de quadros de engasgo, envenenamento ou atropelamento.',
        objetivo: 'Elaborar um guia técnico e ilustrado com condutas emergenciais baseadas em evidências científicas para estabilização segura de cães e gatos em situações críticas.',
        metodologia: 'Revisão bibliográfica com foco no protocolo RECOVER de ressuscitação cardiorrespiratória, produção de infográficos anatômicos e validação do conteúdo com médicos veterinários intensivistas.',
        resultados: 'Mais de 800 cartilhas impressas e digitais distribuídas no município, com realização de 3 workshops práticos que capacitaram mais de 150 tutores.'
    },
    'vet_3': {
        curso: 'Veterinária',
        autor: 'Letícia Martins',
        titulo: 'Manejo Nutricional e Preventivo da Doença Renal Crônica em Caninos Idosos',
        tema: 'Nutrição Clínica, Nefrologia e Geriatria em Medicina de Pequenos Animais',
        problema: 'A Doença Renal Crônica (DRC) é uma das principais causas de mortalidade em cães idosos, frequentemente diagnosticada em fases tardias sem suporte dietético adequado.',
        objetivo: 'Avaliar os parâmetros nutricionais ideais (fósforo controlado, teor proteico de alto valor biológico e ácidos graxos ômega-3) para desacelerar a progressão da nefropatia geriátrica.',
        metodologia: 'Acompanhamento clínico de prontuários de 25 cães geriátricos em ambulatório-escola, correlacionando o tipo de alimentação com parâmetros séricos de ureia, creatinina e escore corporal.',
        resultados: 'Constatação de retardo de 40% na progressão do estágio clínico em animais que receberam dieta específica rica em ômega-3 e restrição calibrada de fósforo.'
    },
    'adm_1': {
        curso: 'Administração',
        autor: 'Gabriel Nogueira',
        titulo: 'Plano de Negócios e Viabilidade Financeira para Brechó Online Sustentável',
        tema: 'Empreendedorismo, Economia Circular e Análise de Viabilidade Econômica',
        problema: 'O impacto ambiental severo da indústria têxtil (Fast Fashion) aliado à falta de planejamento gerencial e financeiro que leva à mortalidade precoce de novos microbrechós.',
        objetivo: 'Estruturar um Plano de Negócios completo segundo a metodologia SEBRAE, compreendendo plano de marketing, análise de concorrência, estudo operacional e fluxo de caixa projetado.',
        metodologia: 'Pesquisa quantitativa com 250 consumidores da classe C, modelagem Canvas, projeção de Demonstrativo de Resultados (DRE) para 36 meses e cálculo de Ponto de Equilíbrio e TIR.',
        resultados: 'Comprovação da viabilidade financeira com Payback de 10 meses e margem líquida projetada de 24%, permitindo o lançamento real da startup na cidade.'
    },
    'adm_2': {
        curso: 'Administração',
        autor: 'Camila Ferreira',
        titulo: 'Estratégias de Marketing Digital e Tráfego Pago para Micro e Pequenas Empresas',
        tema: 'Marketing Digital de Performance e Transformação Comercial de Negócios Locais',
        problema: 'Comércios familiares de bairro perderam volume de vendas no pós-pandemia por desconhecerem ferramentas de posicionamento online no Google e redes sociais.',
        objetivo: 'Desenvolver e testar um modelo prático de atração e fidelização de clientes locais através do Google Meu Negócio, Meta Ads e atendimento estruturado via WhatsApp Business.',
        metodologia: 'Estudo de caso com três pequenas empresas da região (padaria, pet shop e oficina), estruturação de campanhas geolocalizadas em raio de 3 km e métricas de Custo por Lead (CPL).',
        resultados: 'Aumento médio de 48% nas mensagens de orçamento recebidas e retorno sobre investimento publicitário (ROAS) de 4,5x nos primeiros 60 dias.'
    },
    'adm_3': {
        curso: 'Administração',
        autor: 'Rodrigo Alves',
        titulo: 'Educação Financeira Juvenil: Método 50-30-20 e Investimentos no Tesouro Direto',
        tema: 'Finanças Pessoais, Orçamento Familiar e Educação Econômica na Juventude',
        problema: 'Jovens aprendizes e estagiários frequentemente contraem dívidas no cartão de crédito logo nos primeiros meses de trabalho devido ao desconhecimento de noções elementares de finanças.',
        objetivo: 'Elaborar uma metodologia dinâmica de gestão financeira com foco na regra 50-30-20 e introdução prática a títulos de renda fixa pública (Tesouro Selic) para formação de reserva de emergência.',
        metodologia: 'Aplicação de pesquisa diagnóstica de hábitos financeiros com 190 estudantes da 3ª série do EM, realização de oficinas interativas e fornecimento de planilha orçamentária automatizada.',
        resultados: '91% dos alunos participantes constituíram sua primeira reserva financeira e mais de 35% realizaram seu primeiro aporte em títulos públicos ou CDBs de liquidez diária.'
    }
};

function abrirDetalheTCC(id) {
    const dados = tccIdeiasDetalhes[id];
    if (!dados) return;

    if (document.getElementById('tccModalCursoBadge')) document.getElementById('tccModalCursoBadge').textContent = dados.curso;
    if (document.getElementById('tccModalTitulo')) document.getElementById('tccModalTitulo').textContent = dados.titulo;
    if (document.getElementById('tccModalAutor')) document.getElementById('tccModalAutor').textContent = `Autor(a): ${dados.autor}`;
    if (document.getElementById('tccModalTema')) document.getElementById('tccModalTema').textContent = dados.tema;
    if (document.getElementById('tccModalProblema')) document.getElementById('tccModalProblema').textContent = dados.problema;
    if (document.getElementById('tccModalObjetivo')) document.getElementById('tccModalObjetivo').textContent = dados.objetivo;
    if (document.getElementById('tccModalMetodologia')) document.getElementById('tccModalMetodologia').textContent = dados.metodologia;
    if (document.getElementById('tccModalResultados')) document.getElementById('tccModalResultados').textContent = dados.resultados;

    const modal = document.getElementById('modal-detalhe-tcc');
    if (modal) modal.classList.remove('hidden');
}

function fecharModalDetalheTCC() {
    const modal = document.getElementById('modal-detalhe-tcc');
    if (modal) modal.classList.add('hidden');
}

// Fechamento dos novos modais ao clicar no overlay escuro
window.addEventListener('click', function(e) {
    const modalPerfil = document.getElementById('modal-meu-perfil');
    if (modalPerfil && e.target === modalPerfil) {
        modalPerfil.classList.add('hidden');
    }
    const modalTCC = document.getElementById('modal-detalhe-tcc');
    if (modalTCC && e.target === modalTCC) {
        modalTCC.classList.add('hidden');
    }
});

// ==========================================
// SINCRONIZAÇÃO EM SEGUNDO PLANO COM O SERVIDOR
// ==========================================
async function sincronizarComServidor() {
    if (!usuarioLogado || !usuarioLogado.rm) return;
    try {
        if (window.API && typeof window.API.buscarUsuario === 'function') {
            const remoto = await window.API.buscarUsuario(usuarioLogado.rm);
            if (remoto && remoto.rm) {
                // Atualiza dados locais com a versão mais recente do banco de dados
                Object.assign(usuarioLogado, remoto);
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                carregarDadosPerfil();
                carregarRank();
                if (typeof atualizarDesempenho === 'function') atualizarDesempenho();
                if (typeof renderizarConquistas === 'function') renderizarConquistas();
            }
        }
    } catch (err) {
        console.warn('[StudySP] Sincronização inicial com o servidor indisponível:', err);
    }
}

async function carregarQuestoesDoServidor() {
    try {
        if (window.API && typeof window.API.buscarSimulados === 'function') {
            const questoesServidor = await window.API.buscarSimulados();
            if (Array.isArray(questoesServidor)) {
                questoesProfessor = questoesServidor;
                localStorage.setItem('bd_simulados', JSON.stringify(questoesServidor));
                if (typeof renderizarListaQuestoesProfessor === 'function') {
                    renderizarListaQuestoesProfessor();
                }
            }
        }
    } catch (err) {
        console.warn('[StudySP] Simulados do servidor indisponíveis, mantendo locais:', err);
    }
}

// Inicialização Final (Roda ao carregar a página)
carregarDadosPerfil(); 
carregarRank(); 
calcularMultiplicador(); 
atualizarDesempenho(); 
renderizarConquistas();
sincronizarComServidor();
carregarQuestoesDoServidor();