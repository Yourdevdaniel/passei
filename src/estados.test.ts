import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { codigoDaRota, Carregando, TelaErro, LimiteErro } from './components/Estados';

test('somente a raiz abre o app; rotas inexistentes têm uma tela 404', () => {
  expect(codigoDaRota('/')).toBeNull();
  expect(codigoDaRota('/index.html')).toBeNull();
  expect(codigoDaRota('/nao-existe')).toBe(404);
  expect(codigoDaRota('/500')).toBe(500);
  expect(codigoDaRota('/503')).toBe(503);
  expect(codigoDaRota('/505')).toBe(505);
});

test('erro apresenta recuperação e carregamento expõe estado acessível', () => {
  const erro = renderToStaticMarkup(createElement(TelaErro, { codigo: 500, tentar: () => {} }));
  expect(erro).toContain('Tentar novamente');
  expect(erro).toContain('Baixar dados salvos');
  const vazio = renderToStaticMarkup(createElement(TelaErro, { codigo: 404 }));
  expect(vazio).toContain('href="/"');
  const loading = renderToStaticMarkup(createElement(Carregando));
  expect(loading).toContain('role="status"');
  expect(loading).toContain('aria-busy="true"');
  expect(LimiteErro.getDerivedStateFromError()).toEqual({ falhou: true });
});
