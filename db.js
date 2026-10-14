const fs = require('fs');
const path = require('path');

// Garante que o diretório de dados exista
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let dbEngine = 'json'; // 'postgres', 'sqlite', ou 'json'
let pgPool = null;
let sqliteDb = null;
const jsonFilePath = path.join(dataDir, 'studysp.json');

// ===================================================
// 1. INICIALIZAÇÃO DO BANCO DE DADOS
// ===================================================
async function inicializar() {
    // 1.1 Se houver DATABASE_URL no ambiente (ex: Render, Railway, Supabase PostgreSQL)
    if (process.env.DATABASE_URL) {
        try {
            const { Pool } = require('pg');
            const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
            pgPool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: isLocal ? false : { rejectUnauthorized: false }
            });

            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    rm VARCHAR(50) PRIMARY KEY,
                    nome VARCHAR(255),
                    email VARCHAR(255),
                    senha VARCHAR(255),
                    perfil VARCHAR(50),
                    dados JSONB NOT NULL
                );
                CREATE TABLE IF NOT EXISTS conteudos (
                    id VARCHAR(100) PRIMARY KEY,
                    materia VARCHAR(100),
                    dados JSONB NOT NULL
                );
                CREATE TABLE IF NOT EXISTS simulados (
                    id VARCHAR(100) PRIMARY KEY,
                    dados JSONB NOT NULL
                );
            `);
            dbEngine = 'postgres';
            console.log('✅ Banco de Dados conectado: PostgreSQL (DATABASE_URL)');
            return;
        } catch (err) {
            console.warn('⚠️ Falha ao conectar ao PostgreSQL, tentando SQLite/JSON:', err.message);
        }
    }

    // 1.2 Tenta usar SQLite (armazenamento leve em arquivo .sqlite)
    try {
        const sqlite3 = require('sqlite3').verbose();
        const sqliteFile = path.join(dataDir, 'studysp.sqlite');
        
        await new Promise((resolve, reject) => {
            sqliteDb = new sqlite3.Database(sqliteFile, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const execPromise = (sql) => new Promise((resolve, reject) => {
            sqliteDb.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await execPromise(`
            CREATE TABLE IF NOT EXISTS usuarios (
                rm TEXT PRIMARY KEY,
                nome TEXT,
                email TEXT,
                senha TEXT,
                perfil TEXT,
                dados TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS conteudos (
                id TEXT PRIMARY KEY,
                materia TEXT,
                dados TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS simulados (
                id TEXT PRIMARY KEY,
                dados TEXT NOT NULL
            );
        `);

        dbEngine = 'sqlite';
        console.log(`✅ Banco de Dados conectado: SQLite (${sqliteFile})`);
        return;
    } catch (err) {
        console.warn('⚠️ SQLite nativo indisponível (' + err.message + '). Usando engine de persistência JSON segura.');
    }

    // 1.3 Fallback Universal: Arquivo JSON de alta performance
    if (!fs.existsSync(jsonFilePath)) {
        fs.writeFileSync(jsonFilePath, JSON.stringify({
            usuarios: [],
            conteudos: [],
            simulados: []
        }, null, 2), 'utf-8');
    }
    dbEngine = 'json';
    console.log(`✅ Banco de Dados conectado: JSON File Store (${jsonFilePath})`);
}

// Helpers para JSON fallback
function lerJson() {
    try {
        if (!fs.existsSync(jsonFilePath)) {
            return { usuarios: [], conteudos: [], simulados: [] };
        }
        const data = fs.readFileSync(jsonFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error('Erro ao ler JSON db:', e);
        return { usuarios: [], conteudos: [], simulados: [] };
    }
}

function salvarJson(dados) {
    try {
        fs.writeFileSync(jsonFilePath, JSON.stringify(dados, null, 2), 'utf-8');
    } catch (e) {
        console.error('Erro ao salvar JSON db:', e);
    }
}

// ===================================================
// 2. MÉTODOS DE USUÁRIOS
// ===================================================
async function buscarUsuarios() {
    if (dbEngine === 'postgres') {
        const res = await pgPool.query('SELECT dados FROM usuarios');
        return res.rows.map(r => r.dados);
    } else if (dbEngine === 'sqlite') {
        return new Promise((resolve, reject) => {
            sqliteDb.all('SELECT dados FROM usuarios', [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map(r => JSON.parse(r.dados)));
            });
        });
    } else {
        const db = lerJson();
        return db.usuarios || [];
    }
}

async function buscarUsuarioPorRM(rm) {
    const rmStr = String(rm).trim();
    if (dbEngine === 'postgres') {
        const res = await pgPool.query('SELECT dados FROM usuarios WHERE rm = $1', [rmStr]);
        return res.rows.length ? res.rows[0].dados : null;
    } else if (dbEngine === 'sqlite') {
        return new Promise((resolve, reject) => {
            sqliteDb.get('SELECT dados FROM usuarios WHERE rm = ?', [rmStr], (err, row) => {
                if (err) return reject(err);
                resolve(row ? JSON.parse(row.dados) : null);
            });
        });
    } else {
        const db = lerJson();
        return db.usuarios.find(u => String(u.rm).trim() === rmStr) || null;
    }
}

async function salvarUsuario(usuario) {
    const rmStr = String(usuario.rm).trim();
    if (dbEngine === 'postgres') {
        await pgPool.query(
            `INSERT INTO usuarios (rm, nome, email, senha, perfil, dados)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (rm) DO UPDATE SET
                nome = EXCLUDED.nome,
                email = EXCLUDED.email,
                senha = EXCLUDED.senha,
                perfil = EXCLUDED.perfil,
                dados = EXCLUDED.dados`,
            [rmStr, usuario.nome, usuario.email, usuario.senha, usuario.perfil, usuario]
        );
    } else if (dbEngine === 'sqlite') {
        await new Promise((resolve, reject) => {
            sqliteDb.run(
                `INSERT OR REPLACE INTO usuarios (rm, nome, email, senha, perfil, dados)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [rmStr, usuario.nome, usuario.email, usuario.senha, usuario.perfil, JSON.stringify(usuario)],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    } else {
        const db = lerJson();
        const idx = db.usuarios.findIndex(u => String(u.rm).trim() === rmStr);
        if (idx !== -1) {
            db.usuarios[idx] = usuario;
        } else {
            db.usuarios.push(usuario);
        }
        salvarJson(db);
    }
    return usuario;
}

async function atualizarUsuario(rm, dadosNovos) {
    const rmStr = String(rm).trim();
    const usuarioAtual = await buscarUsuarioPorRM(rmStr);
    if (!usuarioAtual) {
        throw new Error('Usuário não encontrado');
    }
    const usuarioAtualizado = { ...usuarioAtual, ...dadosNovos, rm: rmStr };
    await salvarUsuario(usuarioAtualizado);
    return usuarioAtualizado;
}

// ===================================================
// 3. MÉTODOS DE CONTEÚDOS DAS MATÉRIAS
// ===================================================
async function buscarConteudos(materia) {
    let lista = [];
    if (dbEngine === 'postgres') {
        if (materia) {
            const res = await pgPool.query('SELECT dados FROM conteudos WHERE LOWER(materia) = LOWER($1)', [materia]);
            lista = res.rows.map(r => r.dados);
        } else {
            const res = await pgPool.query('SELECT dados FROM conteudos');
            lista = res.rows.map(r => r.dados);
        }
    } else if (dbEngine === 'sqlite') {
        lista = await new Promise((resolve, reject) => {
            if (materia) {
                sqliteDb.all('SELECT dados FROM conteudos WHERE LOWER(materia) = LOWER(?)', [materia], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows.map(r => JSON.parse(r.dados)));
                });
            } else {
                sqliteDb.all('SELECT dados FROM conteudos', [], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows.map(r => JSON.parse(r.dados)));
                });
            }
        });
    } else {
        const db = lerJson();
        lista = db.conteudos || [];
        if (materia) {
            lista = lista.filter(c => c.materia && c.materia.toLowerCase() === materia.toLowerCase());
        }
    }
    return lista;
}

async function salvarConteudo(conteudo) {
    const idStr = String(conteudo.id || Date.now());
    conteudo.id = idStr;
    const materia = conteudo.materia || 'Geral';

    if (dbEngine === 'postgres') {
        await pgPool.query(
            `INSERT INTO conteudos (id, materia, dados)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET materia = EXCLUDED.materia, dados = EXCLUDED.dados`,
            [idStr, materia, conteudo]
        );
    } else if (dbEngine === 'sqlite') {
        await new Promise((resolve, reject) => {
            sqliteDb.run(
                `INSERT OR REPLACE INTO conteudos (id, materia, dados) VALUES (?, ?, ?)`,
                [idStr, materia, JSON.stringify(conteudo)],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    } else {
        const db = lerJson();
        if (!db.conteudos) db.conteudos = [];
        const idx = db.conteudos.findIndex(c => String(c.id) === idStr);
        if (idx !== -1) {
            db.conteudos[idx] = conteudo;
        } else {
            db.conteudos.push(conteudo);
        }
        salvarJson(db);
    }
    return conteudo;
}

// ===================================================
// 4. MÉTODOS DE SIMULADOS (QUESTÕES PROFESSOR)
// ===================================================
async function buscarSimulados() {
    if (dbEngine === 'postgres') {
        const res = await pgPool.query('SELECT dados FROM simulados');
        return res.rows.map(r => r.dados);
    } else if (dbEngine === 'sqlite') {
        return new Promise((resolve, reject) => {
            sqliteDb.all('SELECT dados FROM simulados', [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map(r => JSON.parse(r.dados)));
            });
        });
    } else {
        const db = lerJson();
        return db.simulados || [];
    }
}

async function salvarSimulado(simulado) {
    const idStr = String(simulado.id || Date.now());
    simulado.id = idStr;

    if (dbEngine === 'postgres') {
        await pgPool.query(
            `INSERT INTO simulados (id, dados) VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET dados = EXCLUDED.dados`,
            [idStr, simulado]
        );
    } else if (dbEngine === 'sqlite') {
        await new Promise((resolve, reject) => {
            sqliteDb.run(
                `INSERT OR REPLACE INTO simulados (id, dados) VALUES (?, ?)`,
                [idStr, JSON.stringify(simulado)],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    } else {
        const db = lerJson();
        if (!db.simulados) db.simulados = [];
        const idx = db.simulados.findIndex(s => String(s.id) === idStr);
        if (idx !== -1) {
            db.simulados[idx] = simulado;
        } else {
            db.simulados.push(simulado);
        }
        salvarJson(db);
    }
    return simulado;
}

function getEngineName() {
    return dbEngine;
}

module.exports = {
    inicializar,
    buscarUsuarios,
    buscarUsuarioPorRM,
    salvarUsuario,
    atualizarUsuario,
    buscarConteudos,
    salvarConteudo,
    buscarSimulados,
    salvarSimulado,
    getEngineName
};
