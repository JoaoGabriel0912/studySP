// =======================================================
// StudySP - Cliente de Integração com o Backend API
// Permite a persistência e sincronização de dados entre múltiplos
// navegadores, computadores e dispositivos.
// =======================================================

(function (window) {
    'use strict';

    function getBaseUrl() {
        // 1. Se o desenvolvedor especificou uma URL manualmente
        if (window.STUDY_SP_API_URL) {
            return window.STUDY_SP_API_URL.replace(/\/+$/, '');
        }

        // 2. Se a página foi aberta diretamente pelo arquivo (file://)
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3000/api';
        }

        // 3. Se estiver rodando via Live Server do VS Code (geralmente portas 5500, 5501, etc.)
        // e o backend Node estiver rodando na porta 3000
        if (window.location.port && window.location.port !== '3000') {
            return `${window.location.protocol}//${window.location.hostname}:3000/api`;
        }

        // 4. Em produção (Render, Railway, etc.), onde o backend serve o próprio frontend
        return '/api';
    }

    const API_BASE = getBaseUrl();

    async function apiFetch(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const res = await fetch(url, config);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                let errorMsg = `Erro de servidor (código ${res.status})`;
                if (data && data.error) {
                    if (typeof data.error === 'string') {
                        errorMsg = data.error;
                    } else if (typeof data.error === 'object') {
                        errorMsg = data.error.message || data.error.code || JSON.stringify(data.error);
                    }
                }
                return {
                    success: false,
                    error: errorMsg,
                    status: res.status
                };
            }

            return data;
        } catch (err) {
            console.warn(`[StudySP API] Falha na conexão com ${url}:`, err.message);
            return {
                success: false,
                networkError: true,
                error: 'Não foi possível conectar ao servidor. Verifique se o backend está em execução.'
            };
        }
    }

    const API = {
        baseUrl: API_BASE,

        // --- AUTENTICAÇÃO E USUÁRIOS ---
        async cadastrar(dadosUsuario) {
            return await apiFetch('/cadastro', {
                method: 'POST',
                body: dadosUsuario
            });
        },

        async login(rm, senha) {
            return await apiFetch('/login', {
                method: 'POST',
                body: { rm, senha }
            });
        },

        async buscarUsuarios() {
            const res = await apiFetch('/usuarios');
            if (Array.isArray(res)) return res;
            if (res && res.success && Array.isArray(res.usuarios)) return res.usuarios;
            return [];
        },

        async buscarUsuario(rm) {
            if (!rm) return null;
            const res = await apiFetch(`/usuarios/${encodeURIComponent(rm)}`);
            if (res && res.success && res.user) return res.user;
            return null;
        },

        async atualizarUsuario(usuario) {
            if (!usuario || !usuario.rm) return null;
            return await apiFetch(`/usuarios/${encodeURIComponent(usuario.rm)}`, {
                method: 'PUT',
                body: usuario
            });
        },

        // --- CONTEÚDOS DAS MATÉRIAS ---
        async buscarConteudos(materia) {
            const query = materia ? `?materia=${encodeURIComponent(materia)}` : '';
            const res = await apiFetch(`/conteudos${query}`);
            if (Array.isArray(res)) return res;
            return [];
        },

        async salvarConteudo(conteudo) {
            return await apiFetch('/conteudos', {
                method: 'POST',
                body: conteudo
            });
        },

        async excluirConteudo(id) {
            return await apiFetch(`/conteudos/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        },

        // --- SIMULADOS (QUESTÕES DOS PROFESSORES) ---
        async buscarSimulados() {
            const res = await apiFetch('/simulados');
            if (Array.isArray(res)) return res;
            return [];
        },

        async salvarSimulado(simulado) {
            return await apiFetch('/simulados', {
                method: 'POST',
                body: simulado
            });
        },

        async excluirSimulado(id) {
            return await apiFetch(`/simulados/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        },

        // --- VERIFICAÇÃO DE SAÚDE ---
        async status() {
            return await apiFetch('/status');
        },

        // --- PROXY GEMINI IA ---
        async gemini(prompt) {
            return await apiFetch('/gemini', {
                method: 'POST',
                body: { prompt }
            });
        }
    };

    window.StudySP_API = API;
    window.API = API;
})(window);
