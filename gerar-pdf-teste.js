const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const produtos = [
  { codigo: '7896221800108', descricao: 'AGUA OXIGENADA MARCIA 30V 70ML',         tam: 'U', preco: '2,00' },
  { codigo: '7891032013259', descricao: 'MILHO VERDE OLE VIDRO',                  tam: 'U', preco: '2,25' },
  { codigo: '7891149440603', descricao: 'SUKITA LATA 350ML',                      tam: 'U', preco: '2,50' },
  { codigo: '7896902204423', descricao: 'AGUA OXIGENADA FARMAX VOL30 90ML',       tam: 'U', preco: '1,00' },
  { codigo: '7896264601137', descricao: 'MASSA DE SEMOLA ARGOLINHA 500G',         tam: 'U', preco: '4,00' },
  { codigo: '7897664113046', descricao: 'MULT USO MINUANO MACA 500ML',            tam: 'U', preco: '2,15' },
  { codigo: '7896226300344', descricao: 'ESSENCIA P FINS ALIMENTICIOS',           tam: 'U', preco: '2,25' },
  { codigo: '7898095756468', descricao: 'VINAGRE ALIANCA',                        tam: 'U', preco: '2,25' },
  { codigo: '7898095756475', descricao: 'VINAGRE ALIANCA TINTO',                  tam: 'U', preco: '2,25' },
  { codigo: '7897161420074', descricao: 'BRONZEADOR DE URUCUM ALYNE',             tam: 'U', preco: '4,90' },
  { codigo: '7896871900098', descricao: 'CANECA PLASNORTE',                       tam: 'U', preco: '1,65' },
  { codigo: '7896849102509', descricao: 'CADER UNIV ROCKER GIRL 12MT',            tam: 'U', preco: '14,00' },
  { codigo: '7891132001729', descricao: 'TEMP SAZON SABOR DO SUL 60G',            tam: 'U', preco: '2,65' },
  { codigo: '7896849103537', descricao: 'CADER OUT OL LAW CADERSIL 15MAT',       tam: 'U', preco: '12,50' },
  { codigo: '7896849103520', descricao: 'CAD UNIV OUT LAW 12MAT',                tam: 'U', preco: '14,75' },
  { codigo: '7898238220092', descricao: 'FARINHA TITAN 1K',                       tam: 'U', preco: '2,25' },
  { codigo: '7896342449897', descricao: 'GRAF RECARREGAVEL MERCUR 0 7MM',         tam: 'U', preco: '3,25' },
  { codigo: '7891035250507', descricao: 'VEJA M USO 750ML CAMPESTRE',             tam: 'U', preco: '6,65' },
  { codigo: '7891150009028', descricao: 'SHA DOVE 200ML CUIDADO DIARIO',          tam: 'U', preco: '7,35' },
  { codigo: '7506195196472', descricao: 'FALDA PANPERS SUPERSEC C 26',            tam: 'U', preco: '18,95' },
  { codigo: '7896084901011', descricao: 'BOA NOITE INSETIC ESPIRAL 12H 10UN',    tam: 'U', preco: '2,10' },
  { codigo: '7896111950326', descricao: 'ESM IMP AZUL PAVAO CREM',               tam: 'U', preco: '2,00' },
  { codigo: '7898196285034', descricao: 'ESM LUD GLITTER PRATA',                 tam: 'U', preco: '2,00' },
  { codigo: '7896565992453', descricao: 'DISJUNTOR MONO 32 A ALUMBRA',           tam: 'U', preco: '5,00' },
  { codigo: '7896509961170', descricao: 'ESM BEAUT BASE FORTALECEDORA',           tam: 'U', preco: '2,50' },
  { codigo: '7899026462670', descricao: 'COL GARNIER 7,0',                       tam: 'U', preco: '9,00' },
  { codigo: '7506295380290', descricao: 'WELLA PRO SERIES AFRIZZ 200ML CO',      tam: 'U', preco: '7,20' },
  { codigo: '7898327052658', descricao: 'NUTRIDAY CREMODAY SAB CHOCOLATE 200G',  tam: 'U', preco: '2,50' },
  { codigo: '7893000079298', descricao: 'MARGARINA VEG CREM C SAL QUALY 1KG',   tam: 'U', preco: '17,00' },
  { codigo: '7896105177654', descricao: 'BISC SALG HIT AGUIA 80G QUEIJ',         tam: 'U', preco: '1,55' },
  { codigo: '7891164016371', descricao: 'FRANGO A PASSARINHO AURO',              tam: 'U', preco: '10,55' },
  { codigo: '7891010935979', descricao: 'SAB LIQ BABY HORA DE BRINCAR 200ML',   tam: 'U', preco: '10,65' },
  { codigo: '7899264318197', descricao: 'BROCHURA FORONI HOT WHEELS 60 F',       tam: 'U', preco: '4,00' },
  { codigo: '7891025102533', descricao: 'IOGUTE DANONE LCM',                     tam: 'U', preco: '2,20' },
  { codigo: '7899165371246', descricao: 'SAND DUPE T MONICA KIDS 35 36 ROSA',   tam: 'U', preco: '12,50' },
  { codigo: '75916565',      descricao: 'VICK',                                  tam: 'U', preco: '3,75' },
  { codigo: '7891962036090', descricao: 'BISC REC VISC MORANGO',                 tam: 'U', preco: '3,00' },
  { codigo: '7891155029823', descricao: 'COPO NADIR LD TROPICAL',                tam: 'U', preco: '3,50' },
  { codigo: '7896036091027', descricao: 'ACHOC PO NESCAU 400G',                  tam: 'U', preco: '8,90' },
  { codigo: '7891000315507', descricao: 'LEITE MOCA COND NESTLE 395G',           tam: 'U', preco: '6,50' },
];

const doc = new PDFDocument({ margin: 40, size: 'A4' });
const outputPath = path.join(__dirname, 'lista-teste.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Cabeçalho
doc.fontSize(13).font('Helvetica-Bold').text('MERCEARIA SANTAREM', { align: 'left' });
doc.fontSize(9).font('Helvetica').text('QD 6B, 51 JORGE TEXEIRA');
doc.moveDown(0.5);

doc.fontSize(10).font('Helvetica-Bold')
   .text('RELATORIO DE QUANTIDADE NO ESTOQUE', { align: 'center' });
doc.moveDown(0.5);

// Linha separadora
doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(0.3);

// Cabeçalho da tabela
const colCodigo = 40;
const colDesc   = 160;
const colTam    = 430;
const colPreco  = 470;

doc.fontSize(8).font('Helvetica-Bold');
doc.text('Produto',    colCodigo, doc.y, { continued: false, width: 110 });
doc.moveUp();
doc.text('Descrição',  colDesc,   doc.y, { continued: false, width: 260 });
doc.moveUp();
doc.text('N°/Tam.',    colTam,    doc.y, { continued: false, width: 40 });
doc.moveUp();
doc.text('Preço',      colPreco,  doc.y, { continued: false, width: 60 });
doc.moveDown(0.3);

doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(0.3);

// Linhas de produto
doc.font('Helvetica').fontSize(8);

for (const p of produtos) {
  const y = doc.y;
  doc.text(p.codigo,   colCodigo, y, { width: 110, lineBreak: false });
  doc.text(p.descricao, colDesc,  y, { width: 265, lineBreak: false });
  doc.text(p.tam,       colTam,   y, { width: 35,  lineBreak: false });
  doc.text(p.preco,     colPreco, y, { width: 60,  lineBreak: false });
  doc.moveDown(0.7);
}

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);
doc.end();

stream.on('finish', () => {
  console.log(`✅ PDF gerado com sucesso: ${outputPath}`);
  console.log(`📦 Total de produtos: ${produtos.length}`);
});

stream.on('error', (err) => {
  console.error('Erro ao gravar PDF:', err.message);
});
