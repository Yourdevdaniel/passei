import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';

test('falha do módulo inicial oferece recarregar e erro de recurso opcional não quebra o carregamento', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const script = /<script>\s*([\s\S]*?)<\/script>/.exec(html)![1];
  const attrs: Record<string, string> = {};
  const elementos: Record<string, any> = {
    'boot-loading': { setAttribute: (k: string, v: string) => { attrs[k] = v; } },
    'boot-spinner': { hidden: false }, 'boot-title': { textContent: '' }, 'boot-message': { textContent: '' }, 'boot-retry': { hidden: true },
  };
  const eventos: Record<string, (e: any) => void> = {};
  class ScriptModule { type = 'module'; }
  runInNewContext(script, { HTMLScriptElement: ScriptModule, document: { getElementById: (id: string) => elementos[id] }, window: { addEventListener: (nome: string, fn: (e: any) => void) => { eventos[nome] = fn; } } });
  eventos.error({ type: 'error', target: {} });
  expect(elementos['boot-retry'].hidden).toBe(true);
  eventos.error({ type: 'error', target: new ScriptModule() });
  expect(elementos['boot-spinner'].hidden).toBe(true);
  expect(elementos['boot-retry'].hidden).toBe(false);
  expect(attrs['aria-busy']).toBe('false');
  expect(attrs.role).toBe('alert');
  expect(elementos['boot-title'].textContent).toContain('Não foi possível');
});
