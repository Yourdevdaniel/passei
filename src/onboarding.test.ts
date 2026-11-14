import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

test('quem viu o onboarding antigo pode conhecer o novo tour visual uma vez', async () => {
  const dados = new Map([['passei-tour', '1']]);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('localStorage', { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => dados.set(k, v) });
  const { jaViuTour, marcarTour } = await import('./components/Onboarding');
  expect(jaViuTour()).toBe(false);
  marcarTour();
  expect(jaViuTour()).toBe(true);
});

test('armazenamento bloqueado não quebra o app nem a conclusão do tour', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } });
  const { jaViuTour, marcarTour } = await import('./components/Onboarding');
  expect(() => marcarTour()).not.toThrow();
  expect(jaViuTour()).toBe(true);
});
