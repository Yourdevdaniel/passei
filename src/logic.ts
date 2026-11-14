// Regras de cálculo no modelo de notas da ULBRA. Sem dependências de tela.
//   MP = (G1 + 2·G2) / 3      MF = (MP + 2·EF) / 3      mínimo 6

export type Tipo = 'trab' | 'prova' | 'extra';
export interface Item { id: string; nome: string; tipo: Tipo; nota: string; max: string; data: string }
export interface Grau { modo: 'simples' | 'lista'; trabMax: string; trab: string; prova: string; extra: string; itens: Item[] }
export interface Disc {
  id: string; nome: string; semestre: string; g1: Grau; g2: Grau;
  ef: string; sub: string; minimo: string; limitar: boolean;
  creditos: string; valorCredito: string;
  webAluno?: Partial<Record<'g1' | 'g2', ParcialWeb[]>>;
}
export interface ParcialWeb { nome: string; peso: string; nota: string }
export interface NotaWeb { nome: string; g1: string; g2: string; media: string; exame: string; final: string; situacao: string; frequencia: string }
export interface Db { cur: number; lista: Disc[]; semestre: string; valorCredito: string; boletim?: NotaWeb[] }

export interface Pend { nome: string; max: number; tipo: Tipo }
export interface GrauCalc { v: number | null; known: number; e: number; pend: Pend[]; trabMax: number; provaMax: number; trabTem: number; invalido: boolean }
export interface Precisa { valor: number; max: number; pend: Pend[] }
export type Status = 'vazio' | 'falta' | 'aprovado' | 'exame' | 'impossivel' | 'aprovado-exame' | 'reprovado';
export interface Aval {
  g1: GrauCalc; g2: GrauCalc; G1: number | null; G2: number | null;
  subUsada: 'G1' | 'G2' | null; min: number; status: Status;
  mp?: number; mf?: number; efPrecisa?: number;
  falta?: 'G1' | 'G2'; alvo?: number; precisa?: Precisa;
}
type Notas = Pick<Disc, 'g1' | 'g2'> & Partial<Pick<Disc, 'ef' | 'sub' | 'minimo' | 'limitar'>>;

export const EPS = 1e-9;
export const num = (s: unknown): number | null => {
  if (s == null) return null;
  const t = String(s).trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return isFinite(n) ? n : null;
};
export const fmt = (n: number) => (Math.round(n * 100 + 1e-7) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export const uid = () => Math.random().toString(36).slice(2, 9);

// Um zero em uma avaliação agendada ainda não é uma nota definitiva.
export function itemPendente(it: Pick<Item, 'nota' | 'data'>): boolean {
  const hoje = new Date();
  const dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return num(it.nota) === null || (num(it.nota) === 0 && !!it.data && it.data > dia);
}

// Um grau no modo "simples" (trabalhos + prova) ou "lista" (cada nota separada).
// Campo vazio = nota que ainda não saiu (pendente).
export function calcGrau(g: Pick<Grau, 'modo'> & Partial<Grau>, limitar?: boolean): GrauCalc {
  let known = 0, e = 0, trabMax = 0, provaMax = 0, trabTem = 0;
  let invalido = false;
  const pend: Pend[] = [];
  if (g.modo === 'lista') {
    for (const it of g.itens ?? []) {
      const n = num(it.nota), m = Math.max(0, num(it.max) || 0);
      if (it.tipo === 'extra') { if (n !== null && n < 0) invalido = true; else e += n || 0; continue; }
      if (it.tipo === 'trab') trabMax += m; else provaMax += m;
      if ((num(it.max) ?? 0) < 0 || n !== null && (n < 0 || n > m + EPS)) invalido = true;
      if (itemPendente(it) || n! < 0 || n! > m + EPS) pend.push({ nome: it.nome || (it.tipo === 'trab' ? 'Trabalho' : 'Prova'), max: m, tipo: it.tipo });
      else { known += n!; if (it.tipo === 'trab') trabTem += n!; }
    }
    const faltando = 10 - trabMax - provaMax;
    if (faltando > EPS) pend.push({ nome: 'Pontos ainda não cadastrados', max: faltando, tipo: 'prova' });
    if (faltando < -EPS) {
      invalido = true;
      pend.push({ nome: 'Confira os valores: avaliações acima de 10 pontos', max: 0, tipo: 'prova' });
    }
  } else {
    trabMax = Math.min(10, Math.max(0, num(g.trabMax) ?? 0)); provaMax = 10 - trabMax; e = num(g.extra) || 0;
    const t = num(g.trab), p = num(g.prova);
    invalido = (num(g.trabMax) ?? 0) < 0 || (num(g.trabMax) ?? 0) > 10 || (trabMax > 0 && t !== null && (t < 0 || t > trabMax + EPS)) || (provaMax > 0 && p !== null && (p < 0 || p > provaMax + EPS)) || e < 0;
    if (trabMax > 0) { if (t === null || t < 0 || t > trabMax + EPS) pend.push({ nome: 'Trabalhos', max: trabMax, tipo: 'trab' }); else { known += t; trabTem = t; } }
    if (provaMax > 0) { if (p === null || p < 0 || p > provaMax + EPS) pend.push({ nome: 'Prova', max: provaMax, tipo: 'prova' }); else known += p; }
  }
  let v = pend.length || invalido ? null : known + e;
  if (v !== null && limitar) v = Math.min(10, v);
  return { v, known, e, pend, trabMax, provaMax, trabTem, invalido };
}

const precisa = (alvo: number, gr: GrauCalc): Precisa =>
  ({ valor: alvo - gr.known - gr.e, max: gr.pend.reduce((s, p) => s + p.max, 0), pend: gr.pend });

export function avaliar(d: Notas): Aval {
  const min = num(d.minimo) ?? 6;
  const g1 = calcGrau(d.g1, d.limitar), g2 = calcGrau(d.g2, d.limitar);
  let G1 = g1.v, G2 = g2.v, subUsada: Aval['subUsada'] = null;
  const subDigitada = num(d.sub);
  const sub = subDigitada !== null && subDigitada >= 0 && subDigitada <= 10 ? subDigitada : null;
  if (sub !== null && G1 !== null && G2 !== null) {
    const base = (G1 + 2 * G2) / 3, trocaG1 = (sub + 2 * G2) / 3, trocaG2 = (G1 + 2 * sub) / 3;
    if (trocaG2 >= trocaG1 && trocaG2 > base) { G2 = sub; subUsada = 'G2'; }
    else if (trocaG1 > base) { G1 = sub; subUsada = 'G1'; }
  }
  const r: Aval = { g1, g2, G1, G2, subUsada, min, status: 'vazio' };
  if (g1.invalido || g2.invalido) return r;
  if (G1 !== null && G2 !== null) {
    r.mp = (G1 + 2 * G2) / 3;
    if (r.mp >= min - EPS) r.status = 'aprovado';
    else {
      r.efPrecisa = (3 * min - r.mp) / 2;
      const ef = num(d.ef);
      if (ef !== null && ef >= 0 && ef <= 10) { r.mf = (r.mp + 2 * ef) / 3; r.status = r.mf >= min - EPS ? 'aprovado-exame' : 'reprovado'; }
      else r.status = r.efPrecisa > 10 + EPS ? 'impossivel' : 'exame';
    }
  } else if (G1 !== null) { r.status = 'falta'; r.falta = 'G2'; r.alvo = (3 * min - G1) / 2; r.precisa = precisa(r.alvo, g2); }
  else if (G2 !== null) { r.status = 'falta'; r.falta = 'G1'; r.alvo = 3 * min - 2 * G2; r.precisa = precisa(r.alvo, g1); }
  return r;
}

// Simulador: com G1 = x e y pontos de trabalho na G2, quanto falta na prova da G2
export function simular(G1: number, g2Trab: number, g2Extra: number, g2ProvaMax: number, min: number) {
  const alvo = (3 * min - G1) / 2;
  return { alvo, prova: alvo - g2Trab - g2Extra, provaMax: g2ProvaMax };
}

const tipoDe = (nome: string): Tipo => /(?:^|[^\p{L}\p{N}])(?:extra|b[ôo]nus)(?=$|[^\p{L}\p{N}])/iu.test(nome) ? 'extra' : /^G[12]$|prova|exame|avalia[çc][ãa]o|teste/i.test(nome) ? 'prova' : 'trab';

export interface Importado { g1?: Grau; g2?: Grau; sub?: string; curso?: string; avisos: string[] }

// Lê a página de notas do Canvas: texto copiado, PDF com texto ou texto vindo do OCR
export function parseCanvas(txt: string): Importado {
  const cursos = [...txt.matchAll(/(\d{4,6} - [A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 ,.()&-]{2,80}?)(?=\s+G[12]\b|\s+[A-Z]?[a-z]|\s*$|\s+https?|\s+\d)/gm)];
  if (new Set(cursos.map(m => m[1].split(' - ')[0])).size > 1) throw new Error('Cole uma disciplina do AULA por vez ou envie PDFs separados para cada disciplina.');
  const notas = txt.split(/As tarefas são ponderadas por grupo|Grupo\s+Peso/i)[0];
  const N = '(\\d+(?:[.,]\\d+)?)';
  const SC = new RegExp(`${N}\\s*\\/\\s*${N}`);
  const itens: Record<'g1' | 'g2', Item[]> = { g1: [], g2: [] };
  const add = (grau: string, nome: string, nota: string, max: string) => {
    const bonus = num(max) === 0 && (num(nota) ?? 0) > 0;
    if (num(max) === 0 && !bonus) return;
    nome = nome.split(/\||\d+(?:[.,]\d+)?\s*\//)[0];
    for (let i = 0; i < 3; i++) nome = nome.replace(/[^\p{L}\p{N})]+$/u, '').replace(/\s+[^\s\d]{1,2}$/, ''); // lixo do OCR no fim
    nome = nome.trim() || 'Item';
    itens[grau.toLowerCase() as 'g1' | 'g2'].push({ id: uid(), nome, tipo: bonus ? 'extra' : tipoDe(nome), nota: nota === '-' ? '' : fmt(num(nota)!), max: fmt(num(max)!), data: '' });
  };
  const lines = txt.split(/\r?\n/).map(l => l.trim());
  const titulo = (l: string) => /^(G[12])\s*[-–—]\s*(.*)$/.exec(l);
  const resumo = (l: string) => /\d\s*%|N\/A/.test(l);
  // Página atual do Canvas: nome da tarefa, grupo em outra linha e pontuação.
  for (let i = 1; i < lines.length; i++) {
    if (!/^G[12]$/.test(lines[i])) continue;
    let anterior = i - 1;
    while (anterior >= 0 && !lines[anterior]) anterior--;
    if (anterior < 0 || resumo(lines[anterior])) continue;
    for (let j = i + 1; j < lines.length && j < i + 14; j++) {
      if (/^G[12]$/.test(lines[j]) || titulo(lines[j]) || resumo(lines[j])) break;
      const sc = /(-|\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/.exec(lines[j]);
      if (sc) { add(lines[i], titulo(lines[anterior])?.[2] ?? lines[anterior], sc[1], sc[2]); break; }
    }
  }
  const detalhados = { g1: !!itens.g1.length, g2: !!itens.g2.length };
  for (let i = 0; i < lines.length; i++) {
    const m = titulo(lines[i]); if (!m) continue;
    if (detalhados[m[1].toLowerCase() as 'g1' | 'g2']) continue;
    let sc = SC.exec(m[2]);
    for (let j = i + 1; !sc && j < lines.length && j < i + 6 && !titulo(lines[j]) && !resumo(lines[j]); j++) sc = SC.exec(lines[j]);
    if (sc) add(m[1], m[2], sc[1], sc[2]);
  }
  if (!itens.g1.length && !itens.g2.length) { // tudo numa linha só (PDF com texto)
    const s = txt.replace(/\s+/g, ' ');
    for (const m of s.matchAll(new RegExp(`(G[12]) ?[-–] ?([^/]{1,90}?) \\1 [^/]{0,40}?${N} ?\\/ ?${N}`, 'g'))) add(m[1], m[2], m[3], m[4]);
  }
  const pct: Partial<Record<'g1' | 'g2' | 'sub', number>> = {};
  for (const m of notas.matchAll(/(?:^|\s)(G1|G2|Substitui\S*)\s+(\d+(?:[.,]\d+)?)\s*%/g)) pct[m[1].startsWith('S') ? 'sub' : m[1].toLowerCase() as 'g1' | 'g2'] = num(m[2])! / 10;
  // O percentual do Canvas normaliza pelo total cadastrado (ex.: 3,60/8 = 45%).
  // Preserve os pontos, pois esse percentual não equivale a 4,5 pontos no grau.
  const pontos: Partial<Record<'g1' | 'g2', { nota: number; max: number }>> = {};
  for (const m of notas.matchAll(/(?:^|\s)(G1|G2)\s+\d+(?:[.,]\d+)?\s*%\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/g)) {
    pontos[m[1].toLowerCase() as 'g1' | 'g2'] = { nota: num(m[2])!, max: num(m[3])! };
  }
  const semNota = new Set<string>();
  for (const m of notas.matchAll(/(?:^|\s)(G1|G2|Substitui\S*)\s+N\/A\b/g)) semNota.add(m[1].startsWith('S') ? 'sub' : m[1].toLowerCase());
  const out: Importado = { avisos: [] };
  for (const k of ['g1', 'g2'] as const) {
    const resumo = pontos[k], p = resumo?.nota;
    const lista: Item[] | null = itens[k].length ? itens[k] : p != null || pct[k] !== undefined || semNota.has(k) ? [{ id: uid(), nome: 'Nota do ' + k.toUpperCase(), tipo: 'prova', nota: p == null ? '' : fmt(p), max: fmt(resumo?.max ?? 10), data: '' }] : null;
    if (!lista) continue;
    const total = lista.filter(i => i.tipo !== 'extra').reduce((s, i) => s + (num(i.max) || 0), 0);
    if (total < 10 - EPS) {
      lista.push({ id: uid(), nome: 'Pontos a conferir', tipo: 'prova', nota: '', max: fmt(10 - total), data: '' });
      out.avisos.push(`${k.toUpperCase()}: foram identificados ${fmt(total)} de 10 pontos. Confira os ${fmt(10 - total)} pontos restantes; eles ficaram pendentes.`);
    }
    if (!resumo && !itens[k].length && pct[k] !== undefined) out.avisos.push(`${k.toUpperCase()}: percentual sem pontuação. O grau ficou pendente; confira os pontos no Canvas.`);
    out[k] = { modo: 'lista', trabMax: '4', trab: '', prova: '', extra: '', itens: lista };
    const soma = lista.reduce((s, i) => s + (num(i.nota) || 0), 0);
    if (p != null && Math.abs(soma - p) > 0.06) out.avisos.push(`${k.toUpperCase()}: itens somam ${fmt(soma)}, o Canvas diz ${fmt(p)}`);
  }
  if (semNota.has('sub')) out.sub = '';
  else if (pct.sub !== undefined) {
    const sc = /Substitui\S*\s+\d+(?:[.,]\d+)?\s*%\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/.exec(notas);
    out.sub = sc && num(sc[2]) === 10 ? fmt(num(sc[1])!) : '';
    if (!sc || num(sc[2]) !== 10) out.avisos.push('Substituição sem pontuação completa de 10 pontos. A nota ficou pendente.');
  }
  out.curso = cursos[0]?.[1];
  return out;
}

export const tomSimulacao = (prova: number, max: number) => prova <= EPS ? 'ok' : prova > max + EPS ? 'bad' : prova > max * .8 + EPS ? 'warn' : 'mid';
