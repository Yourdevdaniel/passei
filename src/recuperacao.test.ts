import { afterEach, expect, test, vi } from 'vitest';
import { carregar, novaDisc, resetarDisciplina, salvar } from './store';
import type { Db } from './logic';

afterEach(() => vi.unstubAllGlobals());

test('reset limpa todos os dados da disciplina e preserva identidade e outras matérias', () => {
  const d = { ...novaDisc('Banco de Dados', '2026/2'), creditos: '4', valorCredito: '250', sub: '8', ef: '7', minimo: '5', limitar: false, webAluno: { g1: [{ nome: 'G1', peso: '10', nota: '9' }] } };
  d.g1.prova = '6';
  const outra = novaDisc('Cálculo', '2026/1');
  const db: Db = { cur: 0, lista: [d, outra], semestre: '2026/2', valorCredito: '300', boletim: [
    { nome: 'BANCO DE DADOS', g1: '9', g2: '', media: '9', exame: '', final: '9', situacao: 'APR', frequencia: '100' },
    { nome: 'CÁLCULO', g1: '8', g2: '', media: '8', exame: '', final: '8', situacao: 'APR', frequencia: '100' },
  ] };
  const r = resetarDisciplina(db, d.id);
  expect(r.lista[0]).toEqual({ ...novaDisc(d.nome, d.semestre), id: d.id });
  expect(r.lista[1]).toEqual(outra);
  expect(r.valorCredito).toBe('300');
  expect(r.boletim?.map(n => n.nome)).toEqual(['CÁLCULO']);
  expect(db.lista[0].g1.prova).toBe('6');
  expect(resetarDisciplina(db, 'inexistente')).toBe(db);
});

test('falha no armazenamento é sinalizada e não finge que salvou', () => {
  vi.stubGlobal('localStorage', { setItem: () => { throw new Error('quota'); } });
  expect(salvar({ cur: 0, lista: [novaDisc('Teste', '2026/2')], semestre: '2026/2', valorCredito: '' })).toBe(false);
});

test('dados corrompidos não são descartados silenciosamente ao carregar', () => {
  const raw = '{"lista":[{"g1":{"itens":[null]},"g2":{}}]}';
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => raw, setItem });
  expect(() => carregar()).toThrow();
  expect(setItem).not.toHaveBeenCalled();
});
