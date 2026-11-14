// Leitura do PDF ou print das notas, toda no navegador.
// As bibliotecas pesadas (pdf.js, tesseract.js) vêm por CDN só quando alguém importa um arquivo.

declare global {
  interface Window { Tesseract: any; pdfjsLib: any }
}

const libs: Record<string, Promise<void>> = {};
const script = (src: string) => libs[src] ||= new Promise<void>((ok, err) => {
  const s = document.createElement('script');
  s.src = src; s.onload = () => ok(); s.onerror = () => err(new Error('sem internet para baixar o leitor'));
  document.head.appendChild(s);
});

type Prog = (p: number, msg: string) => void;

async function ocr(imgs: (File | HTMLCanvasElement)[], prog: Prog) {
  await script('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  let i = 0, txt = '';
  const w = await window.Tesseract.createWorker('por', 1, {
    logger: (m: { status: string; progress: number }) => m.status === 'recognizing text' && prog((i + m.progress) / imgs.length, 'Lendo as notas…'),
  });
  for (; i < imgs.length; i++) txt += (await w.recognize(imgs[i])).data.text + '\n';
  await w.terminate();
  return txt;
}

export async function lerArquivo(file: File, prog: Prog): Promise<string> {
  if (file.type.startsWith('image/')) { prog(0, 'Preparando leitura…'); return ocr([file], prog); }
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    prog(0, 'Abrindo PDF…');
    await script('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let txt = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const itens: { str: string; hasEOL: boolean }[] = (await (await pdf.getPage(p)).getTextContent()).items;
      txt += itens.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('') + '\n';
    }
    if (/G[12]\s*[-–]|G[12]\s+[\d,]+\s*%|WebAluno|Avaliações Parciais|Situação\s+Freq/i.test(txt)) return txt;
    // PDF "impresso" (Microsoft Print to PDF) não tem texto: vira imagem e passa no OCR
    const imgs: HTMLCanvasElement[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p), vp = page.getViewport({ scale: 2.5 }), c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      imgs.push(c);
    }
    return ocr(imgs, prog);
  }
  return file.text();
}
