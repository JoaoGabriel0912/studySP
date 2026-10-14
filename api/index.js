const app = require('../server');
const db = require('../db');

let initPromise = null;

module.exports = async (req, res) => {
    try {
        if (!initPromise) {
            initPromise = db.inicializar().catch(err => {
                console.error('Erro ao inicializar DB no Vercel:', err);
            });
        }
        await initPromise;
        return app(req, res);
    } catch (err) {
        console.error('Erro na execução da Serverless Function:', err);
        return res.status(500).json({
            success: false,
            error: 'Erro interno no servidor Vercel: ' + err.message
        });
    }
};
