import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { PainelView } from './components/Telas';
import { novaDisc } from './store';

test('dashboard exibe zero e pendencias do semestre selecionado sem notas de outro semestre', () => {
  const atual = novaDisc('Disciplina atual', '2026/2');
  atual.g1 = { ...atual.g1, trabMax: '0', prova: '0' };
  const html = renderToStaticMarkup(createElement(PainelView, {
    db: { cur: 0, semestre: '2026/2', valorCredito: '', lista: [atual, novaDisc('Disciplina antiga', '2026/1')] },
    abrir() {}, nova() {}, importar() {}, exportar() {}, testar() {}, remover() {}, resetarTudo() {},
  }));
  expect(html).toContain('Disciplina atual');
  expect(html).not.toContain('Disciplina antiga');
  expect(html).toContain('<td>0</td>');
  expect(html).toContain('grade-pending');
  expect(html).toContain('Selecionar Disciplina atual');
});
