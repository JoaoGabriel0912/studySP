# 📚 StudySP — Provão Paulista + TCC

Plataforma educacional para estudantes e professores da rede estadual de São Paulo (SEDUC-SP / ETEC), com simulados, método Pomodoro, mentor de TCC com IA, publicação de conteúdos e ranking em tempo real.

---

## 🚀 Persistência em Produção (Multi-Navegadores)

O sistema agora possui um **Backend REST API em Node.js / Express** que centraliza os dados, permitindo que as informações persistam e sejam compartilhadas em tempo real entre **diferentes navegadores, computadores e celulares**:

- **Usuários e Autenticação**: Contas de Aluno e Professor salvas centralmente.
- **Ranking Geral e Pódio**: Atualizado com as pontuações e sequências (ofensivas) de todos os alunos.
- **Aulas e Conteúdos**: Materiais publicados por professores ficam imediatamente visíveis para todos os alunos.
- **Banco de Questões e Simulados**: Questões cadastradas por professores ficam disponíveis para os simulados em qualquer navegador.
- **Cache Local Inteligente**: Se o navegador perder conexão momentaneamente, o sistema usa o cache local (`localStorage`) e ressincroniza com o servidor assim que reconectar.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 Moderno, JavaScript Vanilla.
- **Backend**: Node.js, Express, CORS.
- **Banco de Dados**:
  - **Local / Desenvolvimento**: SQLite (`studysp.sqlite`) com fallback automático para JSON seguro (`studysp.json`).
  - **Produção**: Suporte nativo a **PostgreSQL** via variável de ambiente `DATABASE_URL` (ideal para Render, Railway e Supabase).

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- Ter o **Node.js** instalado (versão 18 ou superior). Se ainda não tiver, baixe em [nodejs.org](https://nodejs.org).

### Passo a Passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor:**
   ```bash
   npm start
   ```
   *(ou `npm run dev` para reiniciar automaticamente ao alterar arquivos)*

3. **Acesse no seu navegador:**
   Abra: **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Como Subir em Produção (Render / Railway / Vercel)

### Opção 1: Render.com (Recomendado — Gratuito)
1. Crie uma conta gratuita em [render.com](https://render.com).
2. Clique em **New** > **Web Service**.
3. Conecte o repositório GitHub `felipeeduardomax-source/studySP`.
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. *(Opcional para PostgreSQL permanente)*:
   - No Render, clique em **New** > **PostgreSQL** (grátis).
   - Copie a **Internal Database URL** e adicione como variável de ambiente `DATABASE_URL` no seu Web Service.
6. Clique em **Deploy Web Service**. O link gerado (ex: `https://studysp.onrender.com`) já estará funcionando com persistência entre todos os dispositivos!

### Opção 2: Railway.app
1. Acesse [railway.app](https://railway.app) e conecte seu repositório GitHub.
2. Adicione um plugin de **PostgreSQL** ou use o disco do Railway.
3. O Railway detectará o `package.json` e iniciará o servidor automaticamente.

---

## 📂 Estrutura de Arquivos

```text
├── aluno.html          # Painel principal do Aluno e Professor
├── aluno.js            # Lógica do painel, simulados, pomodoro e sincronização
├── aluno.css           # Estilos visuais do painel
├── cadastro.html       # Tela de cadastro escolar (Aluno / Professor)
├── login.html          # Tela de login
├── script.js           # Lógica de login/cadastro conectada à API
├── style.css           # Estilos de login e cadastro
├── api.js              # Cliente frontend para comunicação com a API REST
├── server.js           # Servidor Node.js / Express
├── db.js               # Gerenciador de Banco de Dados (PostgreSQL / SQLite / JSON)
├── index.html          # Redirecionador automático para o login/painel
├── package.json        # Dependências e scripts do Node.js
└── data/               # Armazenamento local do banco de dados (gerado automaticamente)
```
