const fs = require('fs');
const path = require('path');
const os = require('os');

// No Vercel, o diretório da aplicação é somente leitura (/var/task).
// Por isso, se for Vercel, usamos o diretório temporário do sistema (/tmp).
const isVercel = !!process.env.VERCEL;
const dataDir = isVercel 
    ? path.join(os.tmpdir(), 'studysp_data') 
    : path.join(__dirname, 'data');

try {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
} catch (e) {
    console.warn('Aviso: Não foi possível criar dataDir no caminho padrão:', e.message);
}

let dbEngine = 'json'; // 'postgres', 'sqlite', ou 'json'
let pgPool = null;
let sqliteDb = null;
const jsonFilePath = path.join(dataDir, 'studysp.json');

// ===================================================
// 1. INICIALIZAÇÃO DO BANCO DE DADOS
// ===================================================
async function inicializar() {
    // 1.1 Se houver DATABASE_URL ou POSTGRES_URL no ambiente (Vercel Postgres, Supabase, Neon, Render)
    const postgresUri = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (postgresUri) {
        try {
            const { Pool } = require('pg');
            const isLocal = postgresUri.includes('localhost') || postgresUri.includes('127.0.0.1');
            pgPool = new Pool({
                connectionString: postgresUri,
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
            console.log('✅ Banco de Dados conectado: PostgreSQL em nuvem (Vercel/Render)');
            return;
        } catch (err) {
            console.warn('⚠️ Falha ao conectar ao PostgreSQL, tentando SQLite/JSON:', err.message);
        }
    }

    // 1.2 Tenta usar SQLite (apenas fora do Vercel, pois SQLite precisa de compilação C++ e disco persistente)
    if (!isVercel) {
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
            console.warn('⚠️ SQLite nativo indisponível. Usando engine JSON.');
        }
    }

    // 1.3 Fallback Universal: Arquivo JSON
    try {
        if (!fs.existsSync(jsonFilePath)) {
            fs.writeFileSync(jsonFilePath, JSON.stringify({
                usuarios: [],
                conteudos: [],
                simulados: []
            }, null, 2), 'utf-8');
        }
    } catch (e) {
        console.warn('Aviso: Falha ao inicializar arquivo JSON no disco:', e.message);
    }
    dbEngine = 'json';
    console.log(`✅ Banco de Dados conectado: JSON File Store (${jsonFilePath})`);
}

// Helpers para JSON fallback
let memoriaBackup = { usuarios: [], conteudos: [], simulados: [] };

function lerJson() {
    try {
        if (!fs.existsSync(jsonFilePath)) {
            return memoriaBackup;
        }
        const data = fs.readFileSync(jsonFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        memoriaBackup = parsed;
        return parsed;
    } catch (e) {
        return memoriaBackup;
    }
}

function salvarJson(dados) {
    try {
        memoriaBackup = dados;
        fs.writeFileSync(jsonFilePath, JSON.stringify(dados, null, 2), 'utf-8');
    } catch (e) {
        memoriaBackup = dados;
    }
}

// ===================================================
// 2. MÉTODOS DE USUÁRIOS
// ===================================================
async function buscarUsuarios() {
    if (dbEngine === 'postgres' && pgPool) {
        const res = await pgPool.query('SELECT dados FROM usuarios');
        return res.rows.map(r => r.dados);
    } else if (dbEngine === 'sqlite' && sqliteDb) {
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
    if (dbEngine === 'postgres' && pgPool) {
        const res = await pgPool.query('SELECT dados FROM usuarios WHERE rm = $1', [rmStr]);
        return res.rows.length ? res.rows[0].dados : null;
    } else if (dbEngine === 'sqlite' && sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb.get('SELECT dados FROM usuarios WHERE rm = ?', [rmStr], (err, row) => {
                if (err) return reject(err);
                resolve(row ? JSON.parse(row.dados) : null);
            });
        });
    } else {
        const db = lerJson();
        return (db.usuarios || []).find(u => String(u.rm).trim() === rmStr) || null;
    }
}

async function salvarUsuario(usuario) {
    const rmStr = String(usuario.rm).trim();
    if (dbEngine === 'postgres' && pgPool) {
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
    } else if (dbEngine === 'sqlite' && sqliteDb) {
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
        if (!db.usuarios) db.usuarios = [];
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
    if (dbEngine === 'postgres' && pgPool) {
        if (materia) {
            const res = await pgPool.query('SELECT dados FROM conteudos WHERE LOWER(materia) = LOWER($1)', [materia]);
            lista = res.rows.map(r => r.dados);
        } else {
            const res = await pgPool.query('SELECT dados FROM conteudos');
            lista = res.rows.map(r => r.dados);
        }
    } else if (dbEngine === 'sqlite' && sqliteDb) {
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

    if (dbEngine === 'postgres' && pgPool) {
        await pgPool.query(
            `INSERT INTO conteudos (id, materia, dados)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET materia = EXCLUDED.materia, dados = EXCLUDED.dados`,
            [idStr, materia, conteudo]
        );
    } else if (dbEngine === 'sqlite' && sqliteDb) {
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
    if (dbEngine === 'postgres' && pgPool) {
        const res = await pgPool.query('SELECT dados FROM simulados');
        return res.rows.map(r => r.dados);
    } else if (dbEngine === 'sqlite' && sqliteDb) {
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

    if (dbEngine === 'postgres' && pgPool) {
        await pgPool.query(
            `INSERT INTO simulados (id, dados) VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET dados = EXCLUDED.dados`,
            [idStr, simulado]
        );
    } else if (dbEngine === 'sqlite' && sqliteDb) {
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
