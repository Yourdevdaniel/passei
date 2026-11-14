// Copia os leitores de PDF e de imagem para public/vendor, para a Vercel servir junto com o app
// (antes vinham de CDN). Roda antes do dev e do build; public/vendor não vai para o git.
import { cpSync, mkdirSync } from 'node:fs';

const arquivos = {
  'pdfjs-dist/build/pdf.min.js': 'pdfjs/pdf.min.js',
  'pdfjs-dist/build/pdf.worker.min.js': 'pdfjs/pdf.worker.min.js',
  'tesseract.js/dist/tesseract.min.js': 'tesseract/tesseract.min.js',
  'tesseract.js/dist/worker.min.js': 'tesseract/worker.min.js',
  // o app usa só o modo LSTM; o tesseract escolhe a versão com ou sem SIMD conforme o aparelho
  'tesseract.js-core/tesseract-core-lstm.wasm.js': 'tesseract/core/tesseract-core-lstm.wasm.js',
  'tesseract.js-core/tesseract-core-simd-lstm.wasm.js': 'tesseract/core/tesseract-core-simd-lstm.wasm.js',
  '@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz': 'tesseract/lang/por.traineddata.gz',
};
for (const [de, para] of Object.entries(arquivos)) {
  const destino = new URL(`../public/vendor/${para}`, import.meta.url);
  mkdirSync(new URL('.', destino), { recursive: true });
  cpSync(new URL(`../node_modules/${de}`, import.meta.url), destino);
}
