require('dotenv').config();

// Node 16 não tem fetch nativo — necessário para @upstash/redis
if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch');
}

const express  = require('express');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const { Redis } = require('@upstash/redis');
const cors     = require('cors');
const path     = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Redis / Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const REDIS_KEY = 'produtos';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Rota: Upload e extração do PDF ───────────────────────────────────────────
app.post('/api/importar', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    }

    const data   = await pdfParse(Buffer.from(req.file.buffer));
    const texto  = data.text;
    const produtos = extrairProdutos(texto);

    if (Object.keys(produtos).length === 0) {
      return res.status(422).json({ erro: 'Nenhum produto encontrado no PDF. Verifique o formato.' });
    }

    // Salva no Redis (Vercel KV)
    await redis.set(REDIS_KEY, JSON.stringify(produtos));

    return res.json({
      sucesso: true,
      total: Object.keys(produtos).length,
      mensagem: `${Object.keys(produtos).length} produtos importados com sucesso!`,
    });
  } catch (err) {
    console.error('Erro ao importar PDF:', err);
    return res.status(500).json({ erro: 'Erro interno ao processar o PDF.' });
  }
});

// ─── Rota: Busca por código de barras ─────────────────────────────────────────
app.get('/api/produto/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const raw = await redis.get(REDIS_KEY);
    if (!raw) {
      return res.status(404).json({ erro: 'Nenhuma lista importada. Faça o upload do PDF primeiro.' });
    }

    const produtos = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const produto = produtos[codigo];

    if (!produto) {
      return res.status(404).json({ erro: `Produto com código ${codigo} não encontrado na lista.` });
    }

    return res.json({ sucesso: true, codigo, ...produto });
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    return res.status(500).json({ erro: 'Erro interno ao buscar produto.' });
  }
});

// ─── Rota: Retorna total de produtos importados ────────────────────────────────
app.get('/api/status', async (req, res) => {
  try {
    const raw = await redis.get(REDIS_KEY);
    if (!raw) return res.json({ importado: false, total: 0 });
    const produtos = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.json({ importado: true, total: Object.keys(produtos).length });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao verificar status.' });
  }
});

// ─── Rota: Retorna todos os produtos (para listagem) ───────────────────────────
app.get('/api/produtos', async (req, res) => {
  try {
    const raw = await redis.get(REDIS_KEY);
    if (!raw) return res.json({ importado: false, produtos: {} });
    const produtos = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.json({ importado: true, total: Object.keys(produtos).length, produtos });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao buscar produtos.' });
  }
});

// ─── Rota: Limpar lista ────────────────────────────────────────────────────────
app.delete('/api/limpar', async (req, res) => {
  try {
    await redis.del(REDIS_KEY);
    return res.json({ sucesso: true, mensagem: 'Lista removida com sucesso.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao limpar lista.' });
  }
});

// ─── Extração dos produtos do texto do PDF ────────────────────────────────────
function extrairProdutos(texto) {
  const produtos = {};
  const linhas = texto.split('\n');

  // O pdf-parse une as colunas sem espaço:
  // Ex: "7896221800108AGUA OXIGENADA MARCIA 30V 70MLU2,00"
  // Regex: código (8-14 dígitos) + descrição (qualquer coisa) + U + preço decimal
  const regex = /^(\d{8,14})(.+?)U(\d{1,4}[,.]?\d{0,2})$/;

  for (const linha of linhas) {
    const limpa = linha.trim();
    const match = limpa.match(regex);
    if (match) {
      const codigo = match[1].trim();
      const nome   = match[2].trim();
      const preco  = match[3].trim().replace('.', ',');
      if (nome.length > 2) {
        produtos[codigo] = { nome, preco };
      }
    }
  }

  return produtos;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;
