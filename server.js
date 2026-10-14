require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());

// Suporte a payloads de até 50MB (para permitir fotos de perfil e arquivos PDF de aulas em Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===================================================
// ROTAS DA API
// ===================================================

// Status do Servidor e Banco de Dados
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        database: db.getEngineName(),
        timestamp: new Date().toISOString()
    });
});

// Cadastro de Usuário (Aluno ou Professor)
app.post('/api/cadastro', async (req, res) => {
    try {
        const { rm, nome, email, senha, perfil } = req.body;

        if (!rm || !nome || !email || !senha) {
            return res.status(400).json({ success: false, error: 'Preencha todos os campos obrigatórios!' });
        }

        const rmStr = String(rm).trim();
        const usuarioExistente = await db.buscarUsuarioPorRM(rmStr);
        if (usuarioExistente) {
            return res.status(400).json({ success: false, error: 'Este RM já está cadastrado no sistema!' });
        }

        const novoUsuario = {
            rm: rmStr,
            nome: String(nome).trim(),
            email: String(email).trim().toLowerCase(),
            senha: String(senha),
            perfil: perfil || 'Aluno',
            pontos: 0,
            sequencia: 0,
            tempoEstudadoSegundos: 0,
            multiplicador: 1.0,
            totalQuestoes: 0,
            totalAcertos: 0,
            mensagensTCC: 0,
            mensagensTCCHoje: 0,
            ultimaDataChat: new Date().toLocaleDateString(),
            conquistas: [],
            onboardingTCC: 0,
            ultimaDataAcesso: new Date().toLocaleDateString(),
            endereco: '',
            cidade: '',
            telefone: '',
            idade: '',
            bio: '',
            foto: null,
            criadoEm: new Date().toISOString()
        };

        await db.salvarUsuario(novoUsuario);

        // Retorna sem a senha para segurança
        const { senha: _, ...usuarioSemSenha } = novoUsuario;
        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            user: usuarioSemSenha
        });
    } catch (err) {
        console.error('Erro na rota /api/cadastro:', err);
        res.status(500).json({ success: false, error: 'Erro interno ao cadastrar usuário.' });
    }
});

// Login de Usuário
app.post('/api/login', async (req, res) => {
    try {
        const { rm, senha } = req.body;
        if (!rm || !senha) {
            return res.status(400).json({ success: false, error: 'RM e senha são obrigatórios!' });
        }

        const rmStr = String(rm).trim();
        const usuario = await db.buscarUsuarioPorRM(rmStr);

        if (!usuario || String(usuario.senha) !== String(senha)) {
            return res.status(401).json({ success: false, error: 'RM ou Senha incorretos. Tente novamente!' });
        }

        // Retorna os dados do usuário autenticado
        const { senha: _, ...usuarioAutenticado } = usuario;
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            user: usuarioAutenticado
        });
    } catch (err) {
        console.error('Erro na rota /api/login:', err);
        res.status(500).json({ success: false, error: 'Erro interno ao realizar login.' });
    }
});

// Buscar todos os usuários (para o Ranking e visualização dos Alunos)
app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await db.buscarUsuarios();
        // Remove senhas antes de enviar
        const usuariosSeguros = usuarios.map(({ senha, ...u }) => u);
        res.json(usuariosSeguros);
    } catch (err) {
        console.error('Erro na rota GET /api/usuarios:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar lista de usuários.' });
    }
});

// Buscar perfil de um usuário específico pelo RM
app.get('/api/usuarios/:rm', async (req, res) => {
    try {
        const usuario = await db.buscarUsuarioPorRM(req.params.rm);
        if (!usuario) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
        }
        const { senha, ...usuarioSeguro } = usuario;
        res.json({ success: true, user: usuarioSeguro });
    } catch (err) {
        console.error('Erro na rota GET /api/usuarios/:rm:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar dados do usuário.' });
    }
});

// Atualizar perfil/pontos/ofensiva do usuário
app.put('/api/usuarios/:rm', async (req, res) => {
    try {
        const rmStr = String(req.params.rm).trim();
        const novosDados = req.body;

        // Impede que campos essenciais fiquem corrompidos
        delete novosDados.rm;
        // Se a senha não foi informada na atualização, não altera a existente
        if (!novosDados.senha) {
            delete novosDados.senha;
        }

        const atualizado = await db.atualizarUsuario(rmStr, novosDados);
        const { senha, ...usuarioSeguro } = atualizado;
        res.json({ success: true, user: usuarioSeguro });
    } catch (err) {
        console.error('Erro na rota PUT /api/usuarios/:rm:', err);
        res.status(500).json({ success: false, error: 'Erro ao atualizar dados do usuário.' });
    }
});

// ===================================================
// ROTAS DE CONTEÚDO (AULAS PUBLICADAS PELOS PROFESSORES)
// ===================================================
app.get('/api/conteudos', async (req, res) => {
    try {
        const { materia } = req.query;
        const conteudos = await db.buscarConteudos(materia);
        res.json(conteudos);
    } catch (err) {
        console.error('Erro na rota GET /api/conteudos:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar conteúdos.' });
    }
});

app.post('/api/conteudos', async (req, res) => {
    try {
        const conteudo = req.body;
        if (!conteudo.materia || !conteudo.titulo) {
            return res.status(400).json({ success: false, error: 'Matéria e Título são obrigatórios.' });
        }
        conteudo.id = conteudo.id || Date.now();
        const salvo = await db.salvarConteudo(conteudo);
        res.status(201).json({ success: true, conteudo: salvo });
    } catch (err) {
        console.error('Erro na rota POST /api/conteudos:', err);
        res.status(500).json({ success: false, error: 'Erro ao salvar conteúdo.' });
    }
});

// ===================================================
// ROTAS DE SIMULADOS (QUESTÕES DOS PROFESSORES)
// ===================================================
app.get('/api/simulados', async (req, res) => {
    try {
        const simulados = await db.buscarSimulados();
        res.json(simulados);
    } catch (err) {
        console.error('Erro na rota GET /api/simulados:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar simulados.' });
    }
});

app.post('/api/simulados', async (req, res) => {
    try {
        const questao = req.body;
        if (!questao.pergunta || !Array.isArray(questao.opcoes)) {
            return res.status(400).json({ success: false, error: 'Pergunta e opções são obrigatórias.' });
        }
        questao.id = questao.id || Date.now();
        const salvo = await db.salvarSimulado(questao);
        res.status(201).json({ success: true, simulado: salvo });
    } catch (err) {
        console.error('Erro na rota POST /api/simulados:', err);
        res.status(500).json({ success: false, error: 'Erro ao salvar simulado.' });
    }
});

// ===================================================
// SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND
// ===================================================
app.use(express.static(path.join(__dirname)));

// Rota raiz redireciona para a página de login ou index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicializa banco de dados e inicia servidor
db.inicializar().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor StudySP rodando na porta ${PORT}!`);
        console.log(`📍 Acesse no navegador: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('❌ Falha ao inicializar banco de dados:', err);
    process.exit(1);
});
