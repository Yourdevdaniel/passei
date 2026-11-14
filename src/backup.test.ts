import { expect, test } from 'vitest';
import { lerBackup, novaDisc } from './store';
import type { Db } from './logic';

test('backup do Passei preserva todos os dados de todos os semestres', () => {
  const db: Db = {
    cur: 1, semestre: '2026/2', valorCredito: '250,50',
    lista: [novaDisc('Cálculo', '2025/1'), novaDisc('PI em TI I', '2026/2')],
    boletim: [{ nome: 'CÁLCULO', g1: '7', g2: '8', media: '7,7', exame: '', final: '7,7', situacao: 'APR', frequencia: '100' }],
  };
  db.lista[1].g1 = { modo: 'lista', trabMax: '4', trab: '', prova: '', extra: '', itens: [{ id: 'p1', nome: 'Prova', tipo: 'prova', nota: '8', max: '10', data: '2026-11-01' }] };
  db.lista[1].webAluno = { g1: [{ nome: 'G1', peso: '10', nota: '9' }], g2: [{ nome: 'G2', peso: '10', nota: '' }] };
  db.lista[1].creditos = '4'; db.lista[1].valorCredito = '200'; db.lista[1].ef = '7'; db.lista[1].sub = '8';
  expect(lerBackup(JSON.stringify(db))).toEqual(db);
});

test('backups antigos continuam aceitos e recebem os campos novos', () => {
  const db = lerBackup(JSON.stringify({ lista: [{ nome: 'Lógica', g1: { modo: 'simples', trab: '3' }, g2: { modo: 'simples' } }] }));
  expect(db.lista[0].nome).toBe('Lógica');
  expect(db.lista[0].g1.trab).toBe('3');
  expect(db.lista[0].g1.itens).toEqual([]);
});

test.each([
  'não é JSON', '{}', '{"lista":[]}',
  JSON.stringify({ lista: [{ g1: 'inválido', g2: {} }] }),
  JSON.stringify({ lista: [{ g1: { itens: {} }, g2: {} }] }),
  JSON.stringify({ lista: [{ g1: { itens: [null] }, g2: {} }] }),
  JSON.stringify({ lista: [{ g1: {}, g2: {}, webAluno: { g1: 'inválido' } }] }),
  JSON.stringify({ lista: [{ g1: {}, g2: {} }], boletim: [null] }),
])('backup inválido é rejeitado sem produzir dados para substituir os atuais: %s', txt => {
  expect(() => lerBackup(txt)).toThrow('Esse arquivo não é um backup válido do Passei.');
});
