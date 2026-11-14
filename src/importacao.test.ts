import { expect, test } from 'vitest';
import { parseImportacao, aplicarImportacao } from './importacao';
import { normalizar, novaDisc } from './store';
import type { Db } from './logic';

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

test('ambos os cortes se juntam por matéria sem substituir as avaliações do AULA', () => {
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
  expect(db.lista[0].g1.trab).toBe('3');
  expect(db.lista[0].webAluno?.g1).toEqual([{ nome: 'G1', peso: '10', nota: '7,5' }]);
  expect(db.lista[0].webAluno?.g2?.[0].nota).toBe('');
  expect(aplicarImportacao(db, p).lista).toHaveLength(2);
});

test('boletim não entra na lista de matérias do semestre atual', () => {
  const base = { cur: 0, lista: [novaDisc('Minha disciplina', '2026/2')], semestre: '2026/2', valorCredito: '' };
  const db = aplicarImportacao(base, parseImportacao('WebAluno Notas\nHISTÓRIA 9,5 - 9,5 - 9,5 APR 100,00'));
  expect(db.lista).toEqual(base.lista);
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
  expect(db.lista).toHaveLength(1);
  expect(db.lista[0].g1.itens[0].nota).toBe('9,24');
  expect(db.lista[0].g2.itens[0].nota).toBe('3,6');
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
