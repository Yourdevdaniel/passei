// node teste.js  — confere o cálculo e a leitura do Canvas
const A = require('assert');
const fs = require('fs');
const { avaliar, simular, parseCanvas } = require('./logic.js');

const confere = r => {
  const a = avaliar({ g1: r.g1, g2: r.g2, limitar: true });
  A(Math.abs(a.G1 - 7.15) < 1e-9, 'G1 ' + a.G1);
  A(Math.abs(a.G2 - 9.15) < 1e-9, 'G2 ' + a.G2);
  A.equal(a.status, 'aprovado');
  A.equal(r.curso, '25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO');
};

// texto que o OCR tirou do PDF impresso (Microsoft Print to PDF não tem texto)
if (fs.existsSync(__dirname + '/teste-ocr.txt')) confere(parseCanvas(fs.readFileSync(__dirname + '/teste-ocr.txt', 'utf8')));

// PDF com texto, tudo numa linha
confere(parseCanvas('Notas para X: 25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO Imprimir Prova G2 - Parte Prática 3,0 Pontos Tarefas 18 de Jun 2,75 / 3 G1 - Prova G1 3,9 / 6 G1 - Questionários, Participações e Apresentação de Slides G1 3,25 / 4 G2 - Atividades G2 4 / 4 G2 - Prova G2 5,15 / 6 Tarefas 96,43% 6,75 / 7,00 G1 71,5% 7,15 / 10,00 G2 91,5% 9,15 / 10,00 Substituição N/A 0,00 / 0,00'));

// página copiada (Ctrl+A, Ctrl+C)
confere(parseCanvas('Notas para X: 25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO\nProva G2 - Parte Prática 3,0 Pontos\nTarefas\n\t2,75 / 3\nG1 - Prova\nG1\n\t3,9 / 6\nG1 - Questionários, Participações e Apresentação de Slides\nG1\n3,25 / 4\nG2 - Atividades\nG2\n4 / 4\nG2 - Prova\nG2\n5,15 / 6\nG1\t71,5%\t7,15 / 10,00\nG2\t91,5%\t9,15 / 10,00'));

// modo simples: falta a prova da G2
let a = avaliar({ g1: { modo: 'simples', trabMax: 4, trab: '3', prova: '2', extra: '' }, g2: { modo: 'simples', trabMax: 4, trab: '4', prova: '', extra: '0,5' }, limitar: true });
A.equal(a.status, 'falta'); A(Math.abs(a.precisa.valor - 2) < 1e-9); A.equal(a.precisa.max, 6);

// modo lista: G1 = 0,5 + 2 + 4,5 = 7; G2 sem notas
a = avaliar({ g1: { modo: 'lista', itens: [{ tipo: 'trab', nota: '0,5', max: '1' }, { tipo: 'trab', nota: '2', max: '3' }, { tipo: 'prova', nota: '4,5', max: '6' }] }, g2: { modo: 'lista', itens: [{ tipo: 'trab', nota: '', max: '4' }, { tipo: 'prova', nota: '', max: '6' }] }, limitar: true });
A.equal(a.G1, 7); A.equal(a.status, 'falta'); A(Math.abs(a.precisa.valor - 5.5) < 1e-9); A.equal(a.precisa.max, 10);

// exame e substituição
a = avaliar({ g1: { modo: 'simples', trabMax: 0, prova: '8' }, g2: { modo: 'simples', trabMax: 0, prova: '3' }, limitar: true });
A.equal(a.status, 'exame'); A(Math.abs(a.efPrecisa - (18 - 14 / 3) / 2) < 1e-9);
a = avaliar({ g1: { modo: 'simples', trabMax: 0, prova: '8' }, g2: { modo: 'simples', trabMax: 0, prova: '3' }, sub: '9', limitar: true });
A.equal(a.subUsada, 'G2'); A.equal(a.status, 'aprovado');

// simulador: G1 = 7, 2 pontos de trabalho na G2 → prova 3,5
A(Math.abs(simular(7, 2, 0, 6, 6).prova - 3.5) < 1e-9);

console.log('ok');
