const API_BASE = '/api';

// ── Elementos ─────────────────────────────────────────────────────────────────
const sidebar         = document.getElementById('sidebar');
const sidebarOverlay  = document.getElementById('sidebar-overlay');
const btnMenu         = document.getElementById('btn-menu');
const btnFecharSidebar= document.getElementById('btn-fechar-sidebar');
const navItems        = document.querySelectorAll('.nav-item');
const topbarTitulo    = document.getElementById('topbar-titulo');

const sidebarStatus   = document.getElementById('sidebar-status');
const statusBadge     = document.getElementById('status-badge');

const telaScanner     = document.getElementById('tela-scanner');
const telaImportar    = document.getElementById('tela-importar');
const telaLista       = document.getElementById('tela-lista');

// Scanner
const video           = document.getElementById('video');
const canvas          = document.getElementById('canvas');
const resultado       = document.getElementById('resultado');
const resCodigo       = document.getElementById('res-codigo');
const resNome         = document.getElementById('res-nome');
const resPreco        = document.getElementById('res-preco');
const btnEscanearNovo = document.getElementById('btn-escanear-novo');
const resultadoErro   = document.getElementById('resultado-erro');
const resErroMsg      = document.getElementById('res-erro-msg');
const btnTentarNovo   = document.getElementById('btn-tentar-novo');
const avisoSemLista   = document.getElementById('aviso-sem-lista');
const btnIrImportar   = document.getElementById('btn-ir-importar');

// Importar
const inputPdf        = document.getElementById('input-pdf');
const uploadArea      = document.getElementById('upload-area');
const btnImportar     = document.getElementById('btn-importar');
const progresso       = document.getElementById('progresso');
const msgImportacao   = document.getElementById('msg-importacao');
const btnLimpar       = document.getElementById('btn-limpar');

// Lista
const inputBusca      = document.getElementById('input-busca');
const listaInfo       = document.getElementById('lista-info');
const listaContainer  = document.getElementById('lista-container');

let codeReader  = null;
let streamAtivo = null;
let telaAtual   = 'tela-scanner';
let todosProdutos = {}; // cache local

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════════════════

function abrirSidebar() {
  sidebar.classList.add('aberto');
  sidebarOverlay.classList.add('aberto');
}

function fecharSidebar() {
  sidebar.classList.remove('aberto');
  sidebarOverlay.classList.remove('aberto');
}

btnMenu.addEventListener('click', abrirSidebar);
btnFecharSidebar.addEventListener('click', fecharSidebar);
sidebarOverlay.addEventListener('click', fecharSidebar);

// ── Navegação ─────────────────────────────────────────────────────────────────
const nomeTelas = {
  'tela-scanner':  'Ler Produto',
  'tela-importar': 'Importar Produtos',
  'tela-lista':    'Listar Produtos',
};

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const idTela = btn.dataset.tela;
    navegarPara(idTela);
    fecharSidebar();
  });
});

function navegarPara(idTela) {
  if (telaAtual === 'tela-scanner') pararScanner();

  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.getElementById(idTela).classList.add('ativa');

  navItems.forEach(b => b.classList.toggle('ativo', b.dataset.tela === idTela));
  topbarTitulo.textContent = nomeTelas[idTela] || '';
  telaAtual = idTela;

  if (idTela === 'tela-scanner') iniciarScanner();
  if (idTela === 'tela-lista')   carregarLista();
}

btnIrImportar.addEventListener('click', () => navegarPara('tela-importar'));

// ══════════════════════════════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════════════════════════════

async function verificarStatus() {
  try {
    const res   = await fetch(`${API_BASE}/status`);
    const dados = await res.json();
    atualizarBadges(dados.importado, dados.total);
  } catch { /* servidor offline */ }
}

function atualizarBadges(importado, total) {
  const txt = importado ? `✅ ${total} produtos na lista` : 'Nenhuma lista carregada';
  const cls = importado ? 'badge-ok' : 'badge-vazio';

  [statusBadge, sidebarStatus].forEach(el => {
    el.textContent = txt;
    el.className = `${el === sidebarStatus ? 'sidebar-status-badge' : 'badge'} ${cls}`;
  });

  btnLimpar.classList.toggle('hidden', !importado);
}

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTAR PDF
// ══════════════════════════════════════════════════════════════════════════════

uploadArea.addEventListener('click', () => inputPdf.click());
btnImportar.addEventListener('click', () => inputPdf.click());

uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file?.type === 'application/pdf') processarPDF(file);
  else mostrarMensagem('Apenas arquivos PDF são aceitos.', 'erro');
});

inputPdf.addEventListener('change', () => {
  if (inputPdf.files[0]) processarPDF(inputPdf.files[0]);
});

async function processarPDF(file) {
  mostrarProgresso(true);
  esconderMensagem();
  const form = new FormData();
  form.append('pdf', file);
  try {
    const res   = await fetch(`${API_BASE}/importar`, { method: 'POST', body: form });
    const dados = await res.json();
    if (!res.ok) {
      mostrarMensagem(dados.erro || 'Erro ao importar PDF.', 'erro');
    } else {
      mostrarMensagem(`✅ ${dados.mensagem}`, 'sucesso');
      atualizarBadges(true, dados.total);
      todosProdutos = {}; // limpa cache
    }
  } catch {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  } finally {
    mostrarProgresso(false);
    inputPdf.value = '';
  }
}

btnLimpar.addEventListener('click', async () => {
  if (!confirm('Deseja remover toda a lista de produtos?')) return;
  try {
    await fetch(`${API_BASE}/limpar`, { method: 'DELETE' });
    atualizarBadges(false, 0);
    todosProdutos = {};
    mostrarMensagem('Lista removida com sucesso.', 'erro');
  } catch {
    mostrarMensagem('Erro ao limpar.', 'erro');
  }
});

function mostrarMensagem(txt, tipo) {
  msgImportacao.textContent = txt;
  msgImportacao.className = `mensagem ${tipo}`;
  msgImportacao.classList.remove('hidden');
}
function esconderMensagem() { msgImportacao.classList.add('hidden'); }
function mostrarProgresso(ativo) {
  progresso.classList.toggle('hidden', !ativo);
  btnImportar.disabled = ativo;
}

// ══════════════════════════════════════════════════════════════════════════════
// SCANNER
// ══════════════════════════════════════════════════════════════════════════════

async function iniciarScanner() {
  resultado.classList.add('hidden');
  resultadoErro.classList.add('hidden');
  avisoSemLista.classList.add('hidden');
  video.classList.remove('hidden');

  // Verifica se tem lista antes de abrir câmera
  try {
    const res   = await fetch(`${API_BASE}/status`);
    const dados = await res.json();
    if (!dados.importado) {
      video.classList.add('hidden');
      avisoSemLista.classList.remove('hidden');
      return;
    }
  } catch {
    video.classList.add('hidden');
    avisoSemLista.classList.remove('hidden');
    return;
  }

  try {
    streamAtivo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = streamAtivo;
    codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromVideoElement(video, (result, err) => {
      if (result) {
        const codigo = result.getText();
        pararScanner();
        buscarProduto(codigo);
      }
    });
  } catch {
    avisoSemLista.classList.remove('hidden');
    avisoSemLista.querySelector('p').textContent = 'Câmera não disponível ou permissão negada.';
  }
}

function pararScanner() {
  if (codeReader) { codeReader.reset(); codeReader = null; }
  if (streamAtivo) { streamAtivo.getTracks().forEach(t => t.stop()); streamAtivo = null; }
}

btnEscanearNovo.addEventListener('click', () => {
  resultado.classList.add('hidden');
  video.classList.remove('hidden');
  iniciarScanner();
});

btnTentarNovo.addEventListener('click', () => {
  resultadoErro.classList.add('hidden');
  video.classList.remove('hidden');
  iniciarScanner();
});

async function buscarProduto(codigo) {
  video.classList.add('hidden');
  try {
    const res   = await fetch(`${API_BASE}/produto/${codigo}`);
    const dados = await res.json();
    if (!res.ok) {
      resErroMsg.textContent = dados.erro || 'Produto não encontrado.';
      resultadoErro.classList.remove('hidden');
    } else {
      resCodigo.textContent = `Cód: ${dados.codigo}`;
      resNome.textContent   = dados.nome;
      resPreco.textContent  = `R$ ${dados.preco}`;
      resultado.classList.remove('hidden');
    }
  } catch {
    resErroMsg.textContent = 'Erro de conexão com o servidor.';
    resultadoErro.classList.remove('hidden');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LISTAR PRODUTOS
// ══════════════════════════════════════════════════════════════════════════════

async function carregarLista() {
  listaContainer.innerHTML = '<div class="lista-vazia">Carregando...</div>';
  listaInfo.textContent = '';

  try {
    const res   = await fetch(`${API_BASE}/produtos`);
    const dados = await res.json();

    if (!res.ok || !dados.produtos) {
      listaContainer.innerHTML = '<div class="lista-vazia">Nenhuma lista carregada ainda.</div>';
      return;
    }

    todosProdutos = dados.produtos;
    renderizarLista(todosProdutos);
  } catch {
    listaContainer.innerHTML = '<div class="lista-vazia">Erro ao carregar produtos.</div>';
  }
}

function renderizarLista(produtos) {
  const entries = Object.entries(produtos);
  listaInfo.textContent = `${entries.length} produto(s)`;

  if (entries.length === 0) {
    listaContainer.innerHTML = '<div class="lista-vazia">Nenhum produto encontrado.</div>';
    return;
  }

  listaContainer.innerHTML = entries.map(([codigo, p]) => `
    <div class="produto-card">
      <div class="produto-card-info">
        <div class="produto-card-nome">${p.nome}</div>
        <div class="produto-card-codigo">${codigo}</div>
      </div>
      <div class="produto-card-preco">R$ ${p.preco}</div>
    </div>
  `).join('');
}

// Filtro de busca
inputBusca.addEventListener('input', () => {
  const q = inputBusca.value.toLowerCase().trim();
  if (!q) { renderizarLista(todosProdutos); return; }
  const filtrado = Object.fromEntries(
    Object.entries(todosProdutos).filter(([cod, p]) =>
      p.nome.toLowerCase().includes(q) || cod.includes(q)
    )
  );
  renderizarLista(filtrado);
});

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════
verificarStatus();
iniciarScanner(); // começa na tela do scanner
