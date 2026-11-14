import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { PainelView } from './components/Telas';
import { doSemestre, novaDisc } from './store';

test('dashboard geral inclui todos os semestres e preserva zero e pendencias', () => {
  const atual = novaDisc('Disciplina atual', '2026/2');
  atual.g1 = { ...atual.g1, trabMax: '0', prova: '0' };
  const html = renderToStaticMarkup(createElement(PainelView, {
    db: { cur: 0, semestre: '2026/2', valorCredito: '', lista: [atual, novaDisc('Disciplina antiga', '2026/1')] },
    abrir() {}, nova() {}, importar() {}, exportar() {}, testar() {}, remover() {}, resetarTudo() {},
  }));
  expect(html).toContain('Disciplina atual');
  expect(html).toContain('Disciplina antiga');
  expect(html).toContain('<td>2026/1</td>');
  expect(html).toContain('<td>2026/2</td>');
  expect(html).toContain('<td>0</td>');
  expect(html).toContain('grade-pending');
  expect(html).toContain('Selecionar Disciplina atual');
});


test('filtro de semestre preserva indices para abrir a disciplina correta', () => {
  const db = { cur: 0, semestre: '2026/2', valorCredito: '', lista: [novaDisc('Antiga', '2026/1'), novaDisc('Atual', '2026/2')] };
  expect(doSemestre(db).map(x => x.i)).toEqual([1]);
  expect(doSemestre(db, true).map(x => x.i)).toEqual([0, 1]);
});
