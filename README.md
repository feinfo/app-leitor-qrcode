# App Leitor de Produtos 🛒

App web responsivo (estilo PWA) para leitura de código de barras e consulta de preços a partir de uma lista exportada pelo PDV em PDF.

## ✨ Funcionalidades

- 📄 Importação de lista de produtos via PDF
- 📷 Scanner de código de barras pela câmera do celular
- 💾 Produtos salvos no Vercel KV (Redis)
- ✅ Retorna nome e preço do produto escaneado

## 🛠️ Stack

- **Backend:** Node.js + Express
- **Extração PDF:** pdf-parse
- **Banco de dados:** Vercel KV (Upstash Redis)
- **Scanner:** ZXing-js (browser)
- **Deploy:** Vercel

---

## 🚀 Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e preencha com as credenciais do Upstash:

```bash
cp .env.example .env
```

Acesse [upstash.com](https://upstash.com), crie um banco Redis gratuito e copie:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### 3. Iniciar servidor

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy no Vercel

1. Suba o projeto para o GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório
3. Em **Environment Variables**, adicione:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Clique em **Deploy** ✅

---

## 📋 Formato do PDF esperado

O PDF deve conter linhas no formato:

```
CÓDIGO_BARRAS   DESCRIÇÃO DO PRODUTO   U   PREÇO
7896221800108   AGUA OXIGENADA MARCIA 30V 70ML   U   2,00
```

O app extrai automaticamente: código de barras, nome e preço.
