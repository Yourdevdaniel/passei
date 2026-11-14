import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

test('nota acima do máximo expõe erro e descrição para tecnologia assistiva', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const { Inp } = await import('./components/ui');
  const html = renderToStaticMarkup(createElement(Inp, { label: 'Nota de Prova', value: '12', max: 10, onChange: () => {} }));
  expect(html).toContain('aria-invalid="true"');
  const id = /aria-describedby="([^"]+)"/.exec(html)?.[1];
  expect(id).toBeTruthy();
  expect(html).toContain(`id="${id}"`);
  expect(html).toContain('O valor máximo deste campo é 10.');
});

test('as abas mantêm só a opção selecionada na sequência de Tab', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const { Seg } = await import('./components/ui');
  const html = renderToStaticMarkup(createElement(Seg, { label: 'Seção', value: 'notas', options: [['notas', 'Notas'], ['sim', 'Simulador']], onChange: () => {} }));
  expect(html).toMatch(/aria-selected="true"[^>]*tabindex="0"/);
  expect(html).toMatch(/aria-selected="false"[^>]*tabindex="-1"/);
});
