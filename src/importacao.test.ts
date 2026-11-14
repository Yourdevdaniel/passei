import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { parseImportacao, aplicarImportacao, materiaDoBoletim } from './importacao';
import { normalizar, novaDisc, resumoCurto } from './store';
import { avaliar, calcGrau, type Db } from './logic';

test('boletim preserva colunas, zeros e pendências sem inventar semestre', () => {
  const p = parseImportacao(`WebAluno\nNotas\nDisciplina 1º 2º Média EXAME Média Final Situação Freq
COMUNICAÇÃO E LINGUAGEM\t9,5\t-\t9,5\t-\t9,5\tAPR\t100,00
FUNDAMENTOS DE CÁLCULO 7,0 4,6 5,4 6,3 6,0 APR 100,00
BANCO DE DADOS AVANÇADO - - - - - - 100,00
LÓGICA 0,0 6,0 4,0 - 4,0 REP 80,00`);
  expect(p.fonte).toBe('web-notas');
  expect(p.boletim).toHaveLength(4);
  expect(p.boletim?.[1]).toMatchObject({ nome: 'FUNDAMENTOS DE CÁLCULO', exame: '6,3', final: '6,0' });
  expect(p.boletim?.[2].g1).toBe('');
  expect(p.boletim?.[3].g1).toBe('0,0');
});

test('ambos os cortes se juntam por matéria e alimentam os graus', () => {
  const base = { cur: 0, lista: [novaDisc('Paradigmas de Linguagens de Programação', '2026/2')], semestre: '2026/2', valorCredito: '' };
  base.lista[0].g1.trab = '3';
  const p = parseImportacao(`WebAluno Avaliações Parciais
PARADIGMAS DE LINGUAGENS DE PROGRAMAÇÃO ( 1º corte )
Avaliação Peso Nota
G1 10.0 7.5
MÉDIA PARCIAL -
BANCO DE DADOS AVANÇADO ( 1º corte )
Avaliação Peso Nota
G1 10.0 -
MÉDIA PARCIAL -
PARADIGMAS DE LINGUAGENS DE PROGRAMAÇÃO ( 2º corte )
Avaliação Peso Nota
G2 10.0 -
MÉDIA PARCIAL -`);
  const db = aplicarImportacao(base, p);
  expect(db.lista).toHaveLength(2);
  expect(calcGrau(db.lista[0].g1).v).toBe(7.5);
  expect(db.lista[0].webAluno?.g1).toEqual([{ nome: 'G1', peso: '10', nota: '7,5' }]);
  expect(db.lista[0].webAluno?.g2?.[0].nota).toBe('');
  expect(aplicarImportacao(db, p).lista).toHaveLength(2);
});

test('boletim cria disciplinas no semestre selecionado', () => {
  const base = { cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' };
  const db = aplicarImportacao(base, parseImportacao('WebAluno Notas\nHISTÓRIA 9,5 - 9,5 - 9,5 APR 100,00'));
  expect(db.lista).toHaveLength(1);
  expect(calcGrau(db.lista[0].g1).v).toBe(9.5);
  expect(db.lista[0].semestre).toBe('2026/2');
  expect(db.boletim).toHaveLength(1);
});

test('importa PDFs de matérias diferentes sem sobrescrever outra disciplina', () => {
  let db = { cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' };
  for (const nome of ['BANCO DE DADOS AVANÇADO', 'PI EM TI I']) {
    db = aplicarImportacao(db, parseImportacao(`Notas para X\nCurso\n25213 - ${nome}\nG1 92,4% 9,24 / 10,00\nG2 45% 3,60 / 8,00`));
  }
  expect(db.lista.map(d => d.nome)).toEqual(['Banco de Dados Avançado', 'Pi em Ti I']);
});

test('texto desconhecido não produz importação vazia', () => {
  expect(() => parseImportacao('qualquer texto')).toThrow();
});

test('PDF do WebAluno com todas as linhas achatadas', () => {
  const p = parseImportacao('WebAluno Avaliações Parciais 1° Corte 2° Corte BANCO DE DADOS AVANÇADO ( 1º corte ) Avaliação Peso Nota G1 10.0 0.0 MÉDIA PARCIAL - PI EM TI I ( 2º corte ) Avaliação Peso Nota G2 10.0 8.0 MÉDIA PARCIAL -');
  expect(p.materias.map(m => m.curso)).toEqual(['BANCO DE DADOS AVANÇADO', 'PI EM TI I']);
  expect(p.materias[0].webAluno?.g1?.[0].nota).toBe('0');
  const boletim = parseImportacao('WebAluno Notas Disciplina 1º 2º Média EXAME Média Final Situação Freq COMUNICAÇÃO E LINGUAGEM 9,5 - 9,5 - 9,5 APR 100,00 PI EM TI I - - - - - - 100,00');
  expect(boletim.boletim).toHaveLength(2);
});

test('importar o segundo corte depois preserva o primeiro e sobrevive ao backup', () => {
  let db = { cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' };
  for (const corte of [1, 2]) db = aplicarImportacao(db, parseImportacao(`WebAluno Avaliações Parciais\nPI EM TI I ( ${corte}º corte )\nAvaliação Peso Nota\nG${corte} 10.0 9.0\nMÉDIA PARCIAL -`));
  const salvo = normalizar(JSON.parse(JSON.stringify(db)))!;
  expect(salvo.lista).toHaveLength(1);
  expect(salvo.lista[0].webAluno?.g1?.[0].nota).toBe('9');
  expect(salvo.lista[0].webAluno?.g2?.[0].nota).toBe('9');
  const boletim = aplicarImportacao(salvo, parseImportacao('WebAluno Notas\nPI EM TI I 9,5 - 9,5 - 9,5 APR 100,00'));
  expect(normalizar(JSON.parse(JSON.stringify(boletim)))?.boletim).toHaveLength(1);
});

test('PDFs de boletins diferentes acumulam matérias e atualizam sem duplicar', () => {
  let db: Db = { cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' };
  for (const linha of ['LÓGICA 8,0 - 8,0 - 8,0 APR 100,00', 'CÁLCULO 9,0 - 9,0 - 9,0 APR 100,00', 'LÓGICA 9,0 - 9,0 - 9,0 APR 100,00']) {
    db = aplicarImportacao(db, parseImportacao('WebAluno Notas\n' + linha));
  }
  expect(db.boletim).toHaveLength(2);
  expect(db.boletim?.[0].g1).toBe('9,0');
});

test('boletim com cabeçalho repetido em várias páginas preserva a primeira página', () => {
  const p = parseImportacao('WebAluno Notas Disciplina 1º 2º Média EXAME Média Final Situação Freq\nLÓGICA 8,0 - 8,0 - 8,0 APR 100,00\nWebAluno Notas Disciplina 1º 2º Média EXAME Média Final Situação Freq\nCÁLCULO 9,0 - 9,0 - 9,0 APR 100,00');
  expect(p.boletim?.map(n => n.nome)).toEqual(['LÓGICA', 'CÁLCULO']);
});

const paginasJuntas = [
  'Notas para Aluno\nCurso\n25213 - PI EM TI I\nG1 92,4% 9,24 / 10,00\nG2 45% 3,60 / 8,00',
  'WebAluno\nNotas\nDisciplina 1º 2º Média EXAME Média Final Situação Freq\nPI EM TI I - - - - - - 100,00\nCÁLCULO 7,0 4,6 5,4 6,3 6,0 APR 100,00',
  'WebAluno\nAvaliações Parciais\nPI EM TI I ( 1º corte )\nAvaliação Peso Nota\nG1 10.0 9.0\nMÉDIA PARCIAL -\nWebAluno\nAvaliações Parciais\nPI EM TI I ( 2º corte )\nAvaliação Peso Nota\nG2 10.0 -\nMÉDIA PARCIAL -',
];

test.each([[0, 1, 2], [2, 0, 1], [1, 2, 0]])('colar as três páginas em qualquer ordem: %s %s %s', (...ordem) => {
  const txt = ordem.map(i => paginasJuntas[i]).join('\n\n');
  const p = parseImportacao(txt);
  expect(p.fonte).toBe('misto');
  const db = aplicarImportacao({ cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' }, p);
  expect(db.lista).toHaveLength(2);
  expect(calcGrau(db.lista[0].g1).v).toBe(9);
  expect(calcGrau(db.lista[0].g2).v).toBeNull();
  expect(db.lista[0].webAluno?.g1).toEqual([{ nome: 'G1', peso: '10', nota: '9' }]);
  expect(db.lista[0].webAluno?.g2).toEqual([{ nome: 'G2', peso: '10', nota: '' }]);
  expect(db.boletim?.map(n => n.nome)).toEqual(['PI EM TI I', 'CÁLCULO']);
});

test('opção de páginas juntas também aceita uma ou duas fontes e texto achatado', () => {
  const p = parseImportacao([paginasJuntas[0], paginasJuntas[1]].join(' ').replace(/\n/g, ' '), 'misto');
  expect(p.materias[0].curso).toBe('25213 - PI EM TI I');
  expect(p.materias[0].g1?.itens[0].nota).toBe('9,24');
  expect(p.boletim).toHaveLength(2);
  expect(parseImportacao(paginasJuntas[2], 'misto').materias).toHaveLength(1);
  expect(() => parseImportacao('sem notas', 'misto')).toThrow();
});

const bancoCanvas = readFileSync(new URL('./fixtures/canvas-banco.txt', import.meta.url), 'utf8');

test('G2 N/A limpa nota antiga e não anuncia aprovação com G1 ainda pendente', () => {
  const d = novaDisc('Banco de Dados Avançado', '2026/2');
  d.g2 = { ...d.g2, trabMax: '0', prova: '6,7' }; d.sub = '9';
  d.webAluno = { g2: [{ nome: 'G2', peso: '10', nota: '' }] };
  const p = parseImportacao(bancoCanvas);
  expect(p.materias[0].curso).toBe('25595 - BANCO DE DADOS AVANÇADO');
  expect(p.materias[0].g2).toBeDefined();
  expect(calcGrau(p.materias[0].g2!).v).toBeNull();
  const db = aplicarImportacao({ cur: 0, lista: [d], semestre: '2026/2', valorCredito: '' }, p);
  expect(db.lista).toHaveLength(1);
  const atual = db.lista[0], r = avaliar(atual);
  expect(r.G2).toBeNull();
  expect(r.G1).toBeNull();
  expect(r.g1.known).toBeCloseTo(5.6);
  expect(r.g1.pend.filter(p => p.max > 0).map(p => p.max)).toEqual([1.5, 1.5]);
  expect(r.status).toBe('vazio');
  expect(resumoCurto(r).label).toBe('Em andamento');
  expect(atual.g1.itens.every(i => i.max !== '0')).toBe(true);
  expect(atual.sub).toBe('');
  expect(atual.webAluno).toEqual(d.webAluno);
  expect(atual.g1.itens).toEqual(expect.arrayContaining([
    expect.objectContaining({ nome: 'Trabalho 01', nota: '1', max: '1' }),
    expect.objectContaining({ nome: 'Atividade Avaliativa 01', nota: '', max: '1,5' }),
    expect.objectContaining({ nome: 'G1', nota: '4,6', max: '6', tipo: 'prova' }),
  ]));
});

test.each(['G1 65,88% 5,60 / 8,50\nG2 N/A 0,00 / 0,00', 'G1 65,88% 5,60 / 8,50 G2 N/A 0,00 / 0,00'])('resumo N/A também deixa a G2 pendente: %s', txt => {
  const p = parseImportacao(txt).materias[0];
  expect(p.g2).toBeDefined();
  expect(calcGrau(p.g2!).v).toBeNull();
});

test('grau ausente de um recorte não apaga uma nota anterior', () => {
  const d = novaDisc('Banco de Dados Avançado', '2026/2');
  d.g2 = { ...d.g2, trabMax: '0', prova: '6,7' };
  const p = parseImportacao('Notas para Aluno\n25595 - BANCO DE DADOS AVANÇADO\nG1 65,88% 5,60 / 8,50');
  const db = aplicarImportacao({ cur: 0, lista: [d], semestre: '2026/2', valorCredito: '' }, p);
  expect(calcGrau(db.lista[0].g2).v).toBe(6.7);
});

test('a tabela de pesos sozinha não é uma página com notas', () => {
  expect(() => parseImportacao('As tarefas são ponderadas por grupo:\nGrupo Peso\nG1 33%\nG2 67%\nTotal 100%')).toThrow();
});

test('uma disciplina com zero confirmado não é reaproveitada como se estivesse vazia', () => {
  const d = novaDisc('Minha disciplina', '2026/2');
  d.g1.trab = '0';
  const db = aplicarImportacao({ cur: 0, lista: [d], semestre: '2026/2', valorCredito: '' }, parseImportacao('Notas para Aluno\n25595 - BANCO DE DADOS AVANÇADO\nG1 90% 9 / 10'));
  expect(db.lista).toHaveLength(2);
  expect(db.lista[0]).toEqual(d);
});

test('duas matérias do Canvas no mesmo texto não são fundidas silenciosamente', () => {
  const txt = 'Notas para Aluno\n25595 - BANCO DE DADOS AVANÇADO\nG1 90% 9 / 10\nG2 80% 8 / 10\nNotas para Aluno\n25213 - PI EM TI I\nG1 30% 3 / 10\nG2 20% 2 / 10';
  expect(() => parseImportacao(txt)).toThrow(/disciplina/i);
});


test('boletim preenche G1 e G2 nas disciplinas existentes do semestre selecionado', () => {
  const a = novaDisc('Logica', '2026/2'), antiga = novaDisc('Logica', '2026/1');
  a.g1.trab = '4'; a.g2.prova = '6';
  const base = { cur: 0, lista: [a, antiga], semestre: '2026/2', valorCredito: '' };
  const p = parseImportacao('WebAluno\nNotas\nDisciplina 1º 2º Média EXAME Média\nFinal Situação Freq\nLOGICA\t7,2\t9,2\t8,5\t-\t8,5\tAPR\t100,00');
  const db = aplicarImportacao(base, p);
  expect(calcGrau(db.lista[0].g1).v).toBe(7.2);
  expect(calcGrau(db.lista[0].g2).v).toBe(9.2);
  expect(db.lista[1]).toEqual(antiga);
  expect(base.lista[0].g1.trab).toBe('4');
  expect(db.boletim?.[0]).toMatchObject({ g1: '7,2', g2: '9,2' });
});

test('boletim pendente limpa a nota anterior e zero continua confirmado', () => {
  const d = novaDisc('Logica', '2026/2'); d.g2.prova = '6';
  const db = aplicarImportacao({ cur: 0, lista: [d], semestre: '2026/2', valorCredito: '' }, parseImportacao('WebAluno Notas\nLOGICA 0 - 0 - 0 REP 100'));
  expect(calcGrau(db.lista[0].g1).v).toBe(0);
  expect(calcGrau(db.lista[0].g2).v).toBeNull();
});

test('usar boletim explicitamente cria disciplina para simular sem inventar trabalhos', () => {
  const p = parseImportacao('WebAluno Notas\nLOGICA 7,2 9,2 8,5 - 8,5 APR 100');
  const db = aplicarImportacao({ cur: 0, lista: [novaDisc('Outra', '2026/2')], semestre: '2026/2', valorCredito: '' }, { fonte: 'web-notas', materias: [materiaDoBoletim(p.boletim![0])], avisos: [] });
  expect(db.lista).toHaveLength(2);
  expect(calcGrau(db.lista[1].g1).v).toBe(7.2);
  expect(calcGrau(db.lista[1].g2).v).toBe(9.2);
  expect(calcGrau(db.lista[1].g2).trabMax).toBe(0);
});


test('boletim prevalece sobre AULA de materia criada no mesmo lote misto', () => {
  const p = parseImportacao('Notas para Aluno\nCurso\n25595 - LOGICA\nG1 90% 9 / 10\nG2 80% 8 / 10\nWebAluno Notas\nDisciplina 1º 2º Média EXAME Média Final Situação Freq\nLOGICA 7,2 9,2 8,5 - 8,5 APR 100');
  const db = aplicarImportacao({ cur: 0, lista: [novaDisc('Outra', '2026/2')], semestre: '2026/2', valorCredito: '' }, p);
  expect(calcGrau(db.lista[1].g1).v).toBe(7.2);
  expect(calcGrau(db.lista[1].g2).v).toBe(9.2);
});


test('parciais com quebra entre os cortes alimentam G1 de requisitos sem confundir peso e nota', () => {
  const txt = 'WebAluno Avaliações Parciais\n1° Corte 2° Corte\nENGENHARIA DE REQUISITOS E MODELAGEM DE SOFTWARE ( 1º corte )\nAvaliação Peso Nota\nG1\t10.0\t9.0\nMÉDIA PARCIAL -\nPI EM TI I ( 1º corte )\nWebAluno Avaliações Parciais\nENGENHARIA DE REQUISITOS E MODELAGEM DE SOFTWARE ( 2º corte )\nAvaliação Peso Nota\nG2 10.0 -\nMÉDIA PARCIAL -';
  const p = parseImportacao(txt);
  const db = aplicarImportacao({ cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' }, p);
  expect(db.lista[0].nome).toContain('Requisitos');
  expect(calcGrau(db.lista[0].g1).v).toBe(9);
  expect(calcGrau(db.lista[0].g2).v).toBeNull();
  expect(db.lista[0].webAluno?.g1?.[0]).toMatchObject({ peso: '10', nota: '9' });
});


test('boletim ainda vazio preserva uma parcial publicada anteriormente', () => {
  const d = novaDisc('Requisitos', '2026/2');
  d.webAluno = { g1: [{ nome: 'G1', peso: '10', nota: '9' }] };
  const db = aplicarImportacao({ cur: 0, lista: [d], semestre: '2026/2', valorCredito: '' }, parseImportacao('WebAluno Notas\nREQUISITOS - - - - - - 100'));
  expect(calcGrau(db.lista[0].g1).v).toBe(9);
  expect(calcGrau(db.lista[0].g2).v).toBeNull();
});
