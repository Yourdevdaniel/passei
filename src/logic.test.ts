import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { avaliar, calcGrau, parseCanvas, simular, type Grau, type Importado, type Item } from './logic';

const simples = (trabMax: string, trab: string, prova: string, extra = ''): Grau => ({ modo: 'simples', trabMax, trab, prova, extra, itens: [] });
const lista = (...itens: Partial<Item>[]): Grau => ({ modo: 'lista', trabMax: '4', trab: '', prova: '', extra: '', itens: itens as Item[] });

const confere = (r: Importado) => {
  const a = avaliar({ g1: r.g1!, g2: r.g2!, limitar: true });
  expect(a.G1).toBeCloseTo(7.15);
  expect(a.G2).toBeCloseTo(9.15);
  expect(a.status).toBe('aprovado');
  expect(r.curso).toBe('25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO');
};

// O PDF "Imprimir notas" (Microsoft Print to PDF) não tem texto; este é o texto real que o OCR tirou dele.
// O arquivo tem dados pessoais e fica fora do git, então o teste só roda onde ele existe.
test.skipIf(!existsSync('teste-ocr.txt'))('lê o texto do OCR do PDF impresso', () => {
  confere(parseCanvas(readFileSync('teste-ocr.txt', 'utf8')));
});

test('lê PDF com texto, tudo numa linha', () => {
  confere(parseCanvas('Notas para X: 25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO Imprimir Prova G2 - Parte Prática 3,0 Pontos Tarefas 18 de Jun 2,75 / 3 G1 - Prova G1 3,9 / 6 G1 - Questionários, Participações e Apresentação de Slides G1 3,25 / 4 G2 - Atividades G2 4 / 4 G2 - Prova G2 5,15 / 6 Tarefas 96,43% 6,75 / 7,00 G1 71,5% 7,15 / 10,00 G2 91,5% 9,15 / 10,00 Substituição N/A 0,00 / 0,00'));
});

test('lê a página copiada (Ctrl+A, Ctrl+C)', () => {
  confere(parseCanvas('Notas para X: 25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO\nProva G2 - Parte Prática 3,0 Pontos\nTarefas\n\t2,75 / 3\nG1 - Prova\nG1\n\t3,9 / 6\nG1 - Questionários, Participações e Apresentação de Slides\nG1\n3,25 / 4\nG2 - Atividades\nG2\n4 / 4\nG2 - Prova\nG2\n5,15 / 6\nG1\t71,5%\t7,15 / 10,00\nG2\t91,5%\t9,15 / 10,00'));
});

test('modo simples: falta a prova da G2', () => {
  const a = avaliar({ g1: simples('4', '3', '2'), g2: simples('4', '4', '', '0,5'), limitar: true });
  expect(a.status).toBe('falta');
  expect(a.precisa!.valor).toBeCloseTo(2);
  expect(a.precisa!.max).toBe(6);
});

test('modo lista: G1 = 0,5 + 2 + 4,5 = 7 e G2 sem notas', () => {
  const a = avaliar({
    g1: lista({ tipo: 'trab', nota: '0,5', max: '1' }, { tipo: 'trab', nota: '2', max: '3' }, { tipo: 'prova', nota: '4,5', max: '6' }),
    g2: lista({ tipo: 'trab', nota: '', max: '4' }, { tipo: 'prova', nota: '', max: '6' }), limitar: true,
  });
  expect(a.G1).toBe(7);
  expect(a.status).toBe('falta');
  expect(a.precisa!.valor).toBeCloseTo(5.5);
  expect(a.precisa!.max).toBe(10);
});

test('exame e substituição', () => {
  const base = { g1: simples('0', '', '8'), g2: simples('0', '', '3'), limitar: true };
  const a = avaliar(base);
  expect(a.status).toBe('exame');
  expect(a.efPrecisa).toBeCloseTo((18 - 14 / 3) / 2);
  const b = avaliar({ ...base, sub: '9' });
  expect(b.subUsada).toBe('G2');
  expect(b.status).toBe('aprovado');
});

test('ponto extra trava em 10 só quando pedido', () => {
  expect(calcGrau(simples('4', '4', '6', '1'), true).v).toBe(10);
  expect(calcGrau(simples('4', '4', '6', '1'), false).v).toBe(11);
});

test('simulador: G1 = 7 e 2 pontos de trabalho na G2 pedem 3,5 na prova', () => {
  expect(simular(7, 2, 0, 6, 6).prova).toBeCloseTo(3.5);
});

test('zero em prova futura fica pendente, sem antecipar o exame', () => {
  const a = avaliar({
    g1: simples('0', '', '9,64'),
    g2: lista({ tipo: 'prova', nome: 'Prova', nota: '0', max: '6', data: '2099-11-20' }, { tipo: 'trab', nota: '4', max: '4' }),
    limitar: true,
  });
  expect(a.G2).toBeNull();
  expect(a.status).toBe('falta');
  expect(a.precisa!.valor).toBeCloseTo(0.18);
});

test('zero confirmado em avaliação passada continua valendo zero', () => {
  expect(calcGrau(lista({ tipo: 'prova', nota: '0', max: '10', data: '2000-01-01' })).v).toBe(0);
});

test.each(['G1 92,4% 9,24 / 10,00\nG2 45% 3,60 / 8,00', 'G1 92,4% 9,24 / 10,00 G2 45% 3,60 / 8,00'])('preserva 3,60/8 do Canvas e deixa os pontos restantes pendentes: %s', txt => {
  const p = parseCanvas(txt);
  expect(p.g2!.itens[0].nota).toBe('3,6');
  expect(p.g2!.itens[0].max).toBe('8');
  const a = avaliar({ g1: p.g1!, g2: p.g2!, limitar: true });
  expect(a.status).toBe('falta');
  expect(a.g2.known).toBeCloseTo(3.6);
  expect(a.g2.pend[0].max).toBe(2);
  expect(p.avisos.length).toBeGreaterThan(0);
});

test('percentuais sem pontuação não fecham graus nem inventam aprovação', () => {
  const p = parseCanvas('G1 80%\nG2 90%');
  const r = avaliar({ g1: p.g1!, g2: p.g2! });
  expect(r.G1).toBeNull(); expect(r.G2).toBeNull();
  expect(r.status).toBe('vazio');
});

test('substituição usa pontos de 10, sem transformar percentual em nota', () => {
  expect(parseCanvas('Substituição 80% 8 / 10').sub).toBe('8');
  expect(parseCanvas('Substituição 80% 4 / 5').sub).toBe('');
  expect(parseCanvas('Substituição 80%').sub).toBe('');
});

test('lista vazia ou incompleta mantém os pontos não cadastrados pendentes', () => {
  expect(calcGrau(lista()).v).toBeNull();
  const g = calcGrau(lista({ tipo: 'trab', nota: '4', max: '4' }));
  expect(g.v).toBeNull(); expect(g.known).toBe(4);
  expect(g.pend.map(p => p.max)).toEqual([6]);
});

test('nota maior que o valor da avaliação não produz aprovação', () => {
  const g = calcGrau(lista({ tipo: 'prova', nota: '20', max: '10' }), true);
  expect(g.v).toBeNull(); expect(g.known).toBe(0);
  expect(calcGrau(simples('4', '5', '6')).v).toBeNull();
});

test('avaliações que somam mais de 10 não fecham um grau com pontos sem escala', () => {
  const g = lista({ tipo: 'trab', nota: '4', max: '5' }, { tipo: 'prova', nota: '5', max: '10' });
  expect(calcGrau(g).v).toBeNull();
  expect(avaliar({ g1: g, g2: simples('0', '', '5') }).status).toBe('vazio');
});

test('substituição e exame fora de 0 a 10 não aprovam o aluno', () => {
  const base = { g1: simples('0', '', '3'), g2: simples('0', '', '3') };
  expect(avaliar({ ...base, sub: '20' }).subUsada).toBeNull();
  expect(avaliar({ ...base, sub: '20' }).status).toBe('exame');
  expect(avaliar({ ...base, ef: '20' }).status).toBe('exame');
});

test('campos inativos do modo simples não invalidam o grau ao mudar a divisão', () => {
  expect(calcGrau(simples('10', '8', '6')).v).toBe(8);
  expect(calcGrau(simples('0', '4', '7')).v).toBe(7);
});

test('extração não é bônus e nota positiva em atividade de zero pontos é crédito extra', () => {
  const p = parseCanvas('Trabalho de Extração de Dados\nG1\n4 / 4\nProva\nG1\n5 / 6\nParticipação\nG1\n0,5 / 0\nG1 95% 9,5 / 10');
  expect(p.g1!.itens.find(i => i.nome.includes('Extração'))!.tipo).toBe('trab');
  expect(calcGrau(p.g1!).v).toBeCloseTo(9.5);
});

test('zero publicado no Canvas continua sendo zero confirmado', () => {
  const p = parseCanvas('G1 0% 0 / 10\nG2 N/A 0 / 0');
  expect(calcGrau(p.g1!).v).toBe(0);
  expect(calcGrau(p.g2!).v).toBeNull();
});

test('combinações válidas preservam a média e escolhem a melhor substituição', () => {
  for (let g1 = 0; g1 <= 10; g1++) for (let g2 = 0; g2 <= 10; g2++) for (const sub of [0, 5, 10]) {
    const r = avaliar({ g1: simples('0', '', String(g1)), g2: simples('0', '', String(g2)), sub: String(sub) });
    const media = Math.max((g1 + 2 * g2) / 3, (sub + 2 * g2) / 3, (g1 + 2 * sub) / 3);
    expect(r.mp).toBeCloseTo(media);
    expect(r.status).toBe(media >= 6 ? 'aprovado' : 'exame');
  }
});
