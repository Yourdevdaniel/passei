import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

test('confirmação tem nome, descrição e cancelamento antes da ação destrutiva', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const { Confirmar } = await import('./components/Dialogos');
  const html = renderToStaticMarkup(createElement(Confirmar, { open: true, titulo: 'Apagar disciplina?', texto: 'As notas serão removidas.', rotulo: 'Apagar disciplina', onClose: () => {}, onConfirmar: () => {} }));
  expect(html).toContain('role="alertdialog"');
  expect(html).toContain('aria-label="Apagar disciplina?"');
  const id = /aria-describedby="([^"]+)"/.exec(html)?.[1];
  expect(id).toBeTruthy(); expect(html).toContain(`id="${id}"`);
  expect(html).toContain('As notas serão removidas.');
  expect(html.indexOf('>Cancelar<')).toBeLessThan(html.indexOf('>Apagar disciplina<'));
});
