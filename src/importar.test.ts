import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const scripts: any[] = [];
beforeEach(() => {
  vi.resetModules(); scripts.length = 0; vi.stubGlobal('location', { href: 'https://passei.test/' });
  vi.stubGlobal('document', { createElement: () => ({ remove: vi.fn() }), head: { appendChild: (s: any) => scripts.push(s) } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

test('leitor pode tentar novamente após falha no download e libera o PDF', async () => {
  const pdf = { numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: [{ str: 'G1 80% 8 / 10', hasEOL: true }] }) }), destroy: vi.fn() };
  vi.stubGlobal('window', { pdfjsLib: { GlobalWorkerOptions: {}, getDocument: () => ({ promise: Promise.resolve(pdf) }) } });
  const { lerArquivo } = await import('./importar');
  const file = new File(['pdf'], 'notas.pdf', { type: 'application/pdf' });
  const primeira = lerArquivo(file, () => {}); scripts[0].onerror();
  await expect(primeira).rejects.toThrow(/leitor/i);
  const segunda = lerArquivo(file, () => {}); segunda.catch(() => {});
  expect(scripts).toHaveLength(2);
  scripts[1].onload();
  await expect(segunda).resolves.toContain('G1 80%');
  expect(pdf.destroy).toHaveBeenCalledOnce();
});

test('falha no OCR encerra o worker em vez de deixá-lo consumindo recursos', async () => {
  const worker = { recognize: vi.fn().mockRejectedValue(new Error('imagem corrompida')), terminate: vi.fn() };
  vi.stubGlobal('window', { Tesseract: { createWorker: async () => worker } });
  const { lerArquivo } = await import('./importar');
  const p = lerArquivo(new File(['imagem'], 'print.png', { type: 'image/png' }), () => {});
  scripts[0].onload();
  await expect(p).rejects.toThrow('imagem corrompida');
  expect(worker.terminate).toHaveBeenCalledOnce();
});

test('formato sem suporte é recusado antes de tratar conteúdo binário como texto', async () => {
  const { lerArquivo } = await import('./importar');
  await expect(lerArquivo(new File(['binário'], 'arquivo.zip', { type: 'application/zip' }), () => {})).rejects.toThrow(/formato/i);
});

test('download que não responde termina com erro recuperável', async () => {
  vi.useFakeTimers(); vi.stubGlobal('window', {});
  const { lerArquivo } = await import('./importar');
  const p = lerArquivo(new File(['pdf'], 'notas.pdf', { type: 'application/pdf' }), () => {});
  p.catch(() => {});
  await vi.advanceTimersByTimeAsync(20001);
  await expect(p).rejects.toThrow(/tente novamente/i);
  expect(scripts[0].remove).toHaveBeenCalledOnce();
});
