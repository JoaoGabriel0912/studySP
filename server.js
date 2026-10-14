require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());

// Suporte a payloads de até 50MB (para fotos de perfil e arquivos em Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===================================================
// ROTAS DA API
// Usamos um Router para aceitar tanto /api/... quanto /...
// Isso garante compatibilidade total com o Vercel Serverless
// ===================================================
const router = express.Router();

// Status do Servidor e Banco de Dados
router.get('/status', (req, res) => {
    const detectedKeys = Object.keys(process.env).filter(k => 
        k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('NEON') || k.includes('PG')
    );
    res.json({
        status: 'online',
        environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone',
        database: db.getEngineName(),
        detectedKeys: detectedKeys,
        error: typeof db.getLastError === 'function' ? db.getLastError() : null,
        timestamp: new Date().toISOString()
    });
});

// Cadastro de Usuário (Aluno ou Professor)
router.post('/cadastro', async (req, res) => {
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

        const { senha: _, ...usuarioSemSenha } = novoUsuario;
        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            user: usuarioSemSenha
        });
    } catch (err) {
        console.error('Erro na rota /cadastro:', err);
        res.status(500).json({ success: false, error: 'Erro interno ao cadastrar usuário: ' + err.message });
    }
});

// Login de Usuário
router.post('/login', async (req, res) => {
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

        const { senha: _, ...usuarioAutenticado } = usuario;
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            user: usuarioAutenticado
        });
    } catch (err) {
        console.error('Erro na rota /login:', err);
        res.status(500).json({ success: false, error: 'Erro interno ao realizar login: ' + err.message });
    }
});

// Buscar todos os usuários (para o Ranking e pódio)
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await db.buscarUsuarios();
        const usuariosSeguros = usuarios.map(({ senha, ...u }) => u);
        res.json(usuariosSeguros);
    } catch (err) {
        console.error('Erro na rota GET /usuarios:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar lista de usuários: ' + err.message });
    }
});

// Buscar perfil de um usuário específico pelo RM
router.get('/usuarios/:rm', async (req, res) => {
    try {
        const usuario = await db.buscarUsuarioPorRM(req.params.rm);
        if (!usuario) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
        }
        const { senha, ...usuarioSeguro } = usuario;
        res.json({ success: true, user: usuarioSeguro });
    } catch (err) {
        console.error('Erro na rota GET /usuarios/:rm:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar dados do usuário: ' + err.message });
    }
});

// Atualizar perfil/pontos/ofensiva do usuário
router.put('/usuarios/:rm', async (req, res) => {
    try {
        const rmStr = String(req.params.rm).trim();
        const novosDados = req.body;

        delete novosDados.rm;
        if (!novosDados.senha) {
            delete novosDados.senha;
        }

        const atualizado = await db.atualizarUsuario(rmStr, novosDados);
        const { senha, ...usuarioSeguro } = atualizado;
        res.json({ success: true, user: usuarioSeguro });
    } catch (err) {
        console.error('Erro na rota PUT /usuarios/:rm:', err);
        res.status(500).json({ success: false, error: 'Erro ao atualizar dados do usuário: ' + err.message });
    }
});

// Buscar e publicar conteúdos das matérias
router.get('/conteudos', async (req, res) => {
    try {
        const { materia } = req.query;
        const conteudos = await db.buscarConteudos(materia);
        res.json(conteudos);
    } catch (err) {
        console.error('Erro na rota GET /conteudos:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar conteúdos: ' + err.message });
    }
});

router.post('/conteudos', async (req, res) => {
    try {
        const conteudo = req.body;
        if (!conteudo.materia || !conteudo.titulo) {
            return res.status(400).json({ success: false, error: 'Matéria e Título são obrigatórios.' });
        }
        conteudo.id = conteudo.id || Date.now();
        const salvo = await db.salvarConteudo(conteudo);
        res.status(201).json({ success: true, conteudo: salvo });
    } catch (err) {
        console.error('Erro na rota POST /conteudos:', err);
        res.status(500).json({ success: false, error: 'Erro ao salvar conteúdo: ' + err.message });
    }
});

// Buscar e publicar questões dos simulados
router.get('/simulados', async (req, res) => {
    try {
        const simulados = await db.buscarSimulados();
        res.json(simulados);
    } catch (err) {
        console.error('Erro na rota GET /simulados:', err);
        res.status(500).json({ success: false, error: 'Erro ao buscar simulados: ' + err.message });
    }
});

router.post('/simulados', async (req, res) => {
    try {
        const questao = req.body;
        if (!questao.pergunta || !Array.isArray(questao.opcoes)) {
            return res.status(400).json({ success: false, error: 'Pergunta e opções são obrigatórias.' });
        }
        questao.id = questao.id || Date.now();
        const salvo = await db.salvarSimulado(questao);
        res.status(201).json({ success: true, simulado: salvo });
    } catch (err) {
        console.error('Erro na rota POST /simulados:', err);
        res.status(500).json({ success: false, error: 'Erro ao salvar simulado: ' + err.message });
    }
});

// Mapeia tanto /api/... quanto /... para o router
app.use('/api', router);
app.use(router);

// ===================================================
// ARQUIVOS ESTÁTICOS
// ===================================================
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Só inicia o listen se não estiver rodando no Vercel (onde roda como serverless)
if (!process.env.VERCEL) {
    db.inicializar().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor StudySP rodando na porta ${PORT}!`);
            console.log(`📍 Acesse no navegador: http://localhost:${PORT}`);
        });
    }).catch(err => {
        console.error('❌ Falha ao inicializar banco de dados:', err);
    });
}

module.exports = app;
