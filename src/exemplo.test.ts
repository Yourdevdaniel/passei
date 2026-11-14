import { expect, test } from 'vitest';
import { adicionarDisciplinaTeste } from './exemplo';
import { avaliar, calcGrau, num, type Db } from './logic';
import { lerBackup, novaDisc } from './store';

test('disciplina de teste completa é adicionada sem alterar os dados existentes', () => {
  const atual: Db = { cur: 0, lista: [novaDisc('Minha matéria', '2026/2')], semestre: '2026/2', valorCredito: '300', boletim: [] };
  atual.lista[0].g1.trab = '3';
  const antes = JSON.stringify(atual);
  const db = adicionarDisciplinaTeste(atual), d = db.lista[db.cur];
  expect(JSON.stringify(atual)).toBe(antes);
  expect(db.lista).toHaveLength(2);
  expect(db.lista[0]).toEqual(atual.lista[0]);
  expect(d.nome).toBe('Disciplina de teste');
  expect(d.semestre).toBe('2026/2');
  expect(d.creditos).toBe('4');
  expect(num(d.valorCredito)).toBe(250);
  expect([d.ef, d.sub, d.minimo].every(v => num(v) !== null)).toBe(true);
  expect(calcGrau(d.g1).v).toBeCloseTo(8);
  expect(calcGrau(d.g2).v).toBeCloseTo(8.3);
  for (const g of [d.g1, d.g2]) {
    expect(g.itens).toHaveLength(4);
    expect(g.itens.every(i => i.nome && i.nota && i.max && /^\d{4}-\d{2}-\d{2}$/.test(i.data))).toBe(true);
  }
  expect(avaliar(d).status).toBe('aprovado');
  expect(d.webAluno?.g1?.[0].nota).toBe('8,5');
  expect(d.webAluno?.g2?.[0].nota).toBe('8,3');
  expect(db.boletim?.[0].nome).toBe(d.nome);
  expect(lerBackup(JSON.stringify(db))).toEqual(db);
});

test('clicar de novo abre o exemplo existente sem duplicar ou apagar edições', () => {
  const db = adicionarDisciplinaTeste({ cur: 0, lista: [novaDisc('Outra matéria', '2026/2')], semestre: '2026/2', valorCredito: '' });
  db.lista[db.cur].g1.itens[0].nota = '0,5';
  const repetido = adicionarDisciplinaTeste(db);
  expect(repetido.lista).toHaveLength(2);
  expect(repetido.lista[repetido.cur].g1.itens[0].nota).toBe('0,5');
  expect(repetido.boletim).toHaveLength(1);
});
