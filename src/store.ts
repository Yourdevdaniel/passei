// Dados do aluno. Ficam só no navegador (localStorage), nada vai para servidor.
import { avaliar, EPS, fmt, uid, type Aval, type Db, type Disc, type Grau } from './logic';

const KEY = 'notas-v2';

// "2026/2": o semestre de agora, pelo calendário
export const semestreAtual = () => { const d = new Date(); return `${d.getFullYear()}/${d.getMonth() < 6 ? 1 : 2}`; };
export const proximoSemestre = (s: string) => { const m = /^(\d{4})\/([12])$/.exec(s); return m ? (m[2] === '1' ? `${m[1]}/2` : `${+m[1] + 1}/1`) : semestreAtual(); };

export const grauVazio = (): Grau => ({ modo: 'simples', trabMax: '4', trab: '', prova: '', extra: '', itens: [] });
export const novaDisc = (nome: string, semestre: string): Disc =>
  ({ id: uid(), nome, semestre, g1: grauVazio(), g2: grauVazio(), ef: '', sub: '', minimo: '', limitar: true, creditos: '', valorCredito: '' });

// Completa o que faltar: dados de versões antigas e backups não têm todos os campos
export function normalizar(v: any): Db | null {
  if (!Array.isArray(v?.lista) || !v.lista.length || !v.lista.every((x: any) => x?.g1 && x?.g2)) return null;
  const sem = typeof v.semestre === 'string' && v.semestre ? v.semestre : semestreAtual();
  const lista: Disc[] = v.lista.map((x: any) => ({
    ...novaDisc(String(x.nome ?? 'Sem nome'), sem), ...x,
    semestre: x.semestre || sem,
    g1: { ...grauVazio(), ...x.g1, trabMax: String(x.g1.trabMax ?? '4'), itens: x.g1.itens ?? [] },
    g2: { ...grauVazio(), ...x.g2, trabMax: String(x.g2.trabMax ?? '4'), itens: x.g2.itens ?? [] },
  }));
  return { lista, cur: Math.min(Math.max(0, v.cur | 0), lista.length - 1), semestre: sem, valorCredito: String(v.valorCredito ?? ''), boletim: Array.isArray(v.boletim) ? v.boletim : undefined };
}

export function lerBackup(txt: string): Db {
  const objeto = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const campos = (v: any, nomes: string[]) => objeto(v) && nomes.every(k => v[k] === undefined || typeof v[k] === 'string');
  const grau = (g: any) => campos(g, ['trab', 'prova', 'extra']) &&
    (g.modo === undefined || g.modo === 'simples' || g.modo === 'lista') &&
    (g.trabMax === undefined || typeof g.trabMax === 'string' || typeof g.trabMax === 'number') &&
    (g.itens === undefined || Array.isArray(g.itens) && g.itens.every((i: any) =>
      objeto(i) && ['id', 'nome', 'nota', 'max', 'data'].every(k => typeof i[k] === 'string') && ['trab', 'prova', 'extra'].includes(i.tipo)));
  try {
    const v = JSON.parse(txt);
    if (!campos(v, ['semestre', 'valorCredito']) || !Array.isArray(v.lista) || !v.lista.length ||
      !v.lista.every((d: any) => campos(d, ['id', 'nome', 'semestre', 'ef', 'sub', 'minimo', 'creditos', 'valorCredito']) && grau(d.g1) && grau(d.g2) &&
        (d.limitar === undefined || typeof d.limitar === 'boolean') &&
        (d.webAluno === undefined || objeto(d.webAluno) && Object.entries(d.webAluno).every(([k, itens]: [string, any]) =>
          ['g1', 'g2'].includes(k) && Array.isArray(itens) && itens.every((i: any) => objeto(i) && ['nome', 'peso', 'nota'].every(k => typeof i[k] === 'string'))))) ||
      (v.boletim !== undefined && (!Array.isArray(v.boletim) || !v.boletim.every((n: any) => objeto(n) && ['nome', 'g1', 'g2', 'media', 'exame', 'final', 'situacao', 'frequencia'].every(k => typeof n[k] === 'string'))))) {
      throw new Error('Dados inválidos');
    }
    const db = normalizar(v);
    if (db) return db;
  } catch { /* mantém os dados atuais quando o backup não é válido */ }
  throw new Error('Esse arquivo não é um backup válido do Passei.');
}

export function carregar(): Db {
  for (const k of [KEY, 'calc-media']) { // 'calc-media' = primeira versão
    try { const db = normalizar(JSON.parse(localStorage.getItem(k)!)); if (db) return db; } catch { /* dado ausente ou corrompido */ }
  }
  const sem = semestreAtual();
  return { cur: 0, lista: [novaDisc('Minha disciplina', sem)], semestre: sem, valorCredito: '' };
}
export const salvar = (db: Db) => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* navegador sem armazenamento */ } };

// ---------- resumo de uma disciplina (menu, cartões do painel) ----------
export type Tom = '' | 'ok' | 'warn' | 'bad' | 'peach';
export interface Resumo { tone: Tom; label: string; txt: string; v: number | null; max: number; show?: string }

export const tom = (v: number | null | undefined, min: number): Tom => v == null ? '' : v >= min - EPS ? 'ok' : v >= min * .7 ? 'warn' : 'bad';
export const chipTom = (t: Tom) => t === 'peach' ? '' : t;

export function resumoCurto(r: Aval): Resumo {
  if (r.status === 'vazio') return { tone: '', label: 'Sem notas', txt: 'Comece colocando as notas.', v: null, max: 10 };
  if (r.status === 'falta') {
    const p = r.precisa!;
    if (p.valor <= EPS) return { tone: 'ok', label: 'Garantido', txt: `Já passou, mesmo com 0 no ${r.falta}.`, v: p.max, max: p.max, show: '✓' };
    if (p.valor <= p.max + EPS) return { tone: p.valor / p.max > .8 ? 'warn' : 'peach', label: 'Em andamento', txt: `Precisa de ${fmt(p.valor)} de ${fmt(p.max)} no ${r.falta}.`, v: p.valor, max: p.max };
    return { tone: 'bad', label: 'Direto não dá', txt: 'Vai para o exame.', v: p.max, max: p.max, show: '!' };
  }
  const porStatus = {
    aprovado: { tone: 'ok', label: 'Aprovado', txt: 'Passou direto.' },
    exame: { tone: 'warn', label: 'Exame final', txt: `Precisa de ${fmt(r.efPrecisa ?? 0)} no exame.` },
    impossivel: { tone: 'bad', label: 'Em risco', txt: 'Só com substituição.' },
    'aprovado-exame': { tone: 'ok', label: 'Aprovado', txt: 'Passou no exame.' },
    reprovado: { tone: 'bad', label: 'Reprovado', txt: 'Não fechou a média.' },
  } as const;
  return { ...porStatus[r.status], v: r.mf ?? r.mp ?? null, max: 10 };
}

export interface Linha { d: Disc; i: number; r: Aval; c: Resumo }
// Disciplinas de um semestre, com o índice na lista completa
export const doSemestre = (db: Db): Linha[] =>
  db.lista.map((d, i) => { const r = avaliar(d); return { d, i, r, c: resumoCurto(r) }; }).filter(x => x.d.semestre === db.semestre);
export const semestres = (db: Db) => [...new Set([...db.lista.map(d => d.semestre), db.semestre])].sort();

// "25078 - INTRODUÇÃO À CIÊNCIA DA COMPUTAÇÃO" → "Introdução à Ciência da Computação"
export const nomeBonito = (s: string) => s.replace(/^\d+\s*-\s*/, '').toLowerCase().replace(/(^|\s)(\S+)/g, (_m, sp: string, w: string) =>
  sp + (sp && /^(a|à|as|o|os|e|de|da|do|das|dos|em|na|no|para|com)$/.test(w) ? w : /^(i{1,3}|iv|v)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)));
