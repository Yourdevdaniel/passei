// Leitura do PDF ou print das notas, toda no navegador.
// As bibliotecas pesadas (pdf.js, tesseract.js) vêm por CDN só quando alguém importa um arquivo.

declare global {
  interface Window { Tesseract: any; pdfjsLib: any }
}

const libs: Record<string, Promise<void>> = {};
const script = (src: string) => libs[src] ||= new Promise<void>((ok, err) => {
  const s = document.createElement('script');
  const falhar = () => { clearTimeout(timer); s.remove(); err(new Error('Não foi possível baixar o leitor. Confira sua conexão e tente novamente.')); };
  const timer = setTimeout(falhar, 20000);
  s.src = src; s.onload = () => { clearTimeout(timer); ok(); }; s.onerror = falhar;
  document.head.appendChild(s);
}).catch(e => { delete libs[src]; throw e; });

type Prog = (p: number, msg: string) => void;
export type ItemPdf = { str: string; hasEOL?: boolean; transform: number[] };

// PDF do "Imprimir notas" do Canvas: o pdf.js entrega o texto por coluna (nomes, depois pontuações).
// Remonta cada linha da tabela pela posição, no formato da página copiada que o parseCanvas já lê:
// nome, grupo, datas, pontuação e comentários, cada um numa linha.
export function textoDaPagina(itens: ItemPdf[]): string {
  const vis = itens.filter(i => i.str.trim());
  const x = (i: ItemPdf) => i.transform[4], y = (i: ItemPdf) => i.transform[5];
  const cab = (s: string) => vis.find(i => i.str.trim() === s);
  const entrega = cab('Entrega'), pontuacao = cab('Pontuação');
  if (!entrega || !pontuacao) return itens.map(i => i.str + (i.hasEOL ? '\n' : ' ')).join('');
  const col = (i: ItemPdf) => x(i) < x(entrega) - 5 ? 0 : x(i) < x(pontuacao) - 5 ? 1 : x(i) < x(pontuacao) + 70 ? 2 : 3;
  const visuais = (xs: ItemPdf[]) => { // agrupa itens na mesma altura
    const out: string[] = [];
    let yAnt = Infinity;
    for (const i of xs) { if (yAnt - y(i) > 2) out.push(''); out[out.length - 1] += (out[out.length - 1] ? ' ' : '') + i.str.trim(); yAnt = y(i); }
    return out;
  };
  const linhas: string[] = [];
  const fechar = (bloco: ItemPdf[]) => {
    const c = [0, 1, 2, 3].map(k => visuais(bloco.filter(i => col(i) === k)));
    if (c[0].length > 1) linhas.push(c[0].slice(0, -1).join(' '), c[0].at(-1)!); // nome quebrado em 2 linhas + grupo
    else linhas.push(...c[0]);
    if (c[1].length) linhas.push(c[1].join(' '));
    const nota = c[2].join(' ');
    if (nota) linhas.push(nota.startsWith('/') ? '- ' + nota : nota); // sem nota lançada = pendente
    if (c[3].length) linhas.push(c[3].join(' '));
  };
  let bloco: ItemPdf[] = [];
  for (const i of [...vis].sort((a, b) => y(b) - y(a) || x(a) - x(b))) {
    if (bloco.length && y(bloco[bloco.length - 1]) - y(i) > 20) { fechar(bloco); bloco = []; }
    bloco.push(i);
  }
  if (bloco.length) fechar(bloco);
  return linhas.join('\n');
}

async function ocr(imgs: (File | HTMLCanvasElement)[], prog: Prog) {
  await script('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  let i = 0, txt = '';
  const w = await window.Tesseract.createWorker('por', 1, {
    logger: (m: { status: string; progress: number }) => m.status === 'recognizing text' && prog((i + m.progress) / imgs.length, 'Lendo as notas…'),
  });
  try {
    for (; i < imgs.length; i++) txt += (await w.recognize(imgs[i])).data.text + '\n';
    return txt;
  } finally { await w.terminate(); }
}

export async function lerArquivo(file: File, prog: Prog): Promise<string> {
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(file.name)) { prog(0, 'Preparando leitura…'); return ocr([file], prog); }
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    prog(0, 'Abrindo PDF…');
    await script('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    try {
    let txt = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      txt += textoDaPagina((await (await pdf.getPage(p)).getTextContent()).items) + '\n';
    }
    if (/Notas para|G[12]\s*[-–]|G[12]\s+(?:N\/A|[\d.,]+\s*%)|WebAluno|Avaliações Parciais|Situação\s+Freq/i.test(txt)) return txt;
    // PDF "impresso" (Microsoft Print to PDF) não tem texto: vira imagem e passa no OCR
    const imgs: HTMLCanvasElement[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p), vp = page.getViewport({ scale: 2.5 }), c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      imgs.push(c);
    }
    return ocr(imgs, prog);
    } finally { await pdf.destroy(); }
  }
  if (file.type === 'text/plain' || file.type === 'application/json' || /\.(txt|json)$/i.test(file.name)) return file.text();
  throw new Error('Formato não suportado. Use PDF, imagem, texto (.txt) ou backup do Passei (.json).');
}
