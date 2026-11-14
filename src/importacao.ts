import { fmt, num, parseCanvas, type Db, type Importado, type NotaWeb, type ParcialWeb } from './logic';
import { nomeBonito, novaDisc } from './store';

export type Fonte = 'aula' | 'web-notas' | 'web-parciais' | 'misto';
interface Materia extends Importado { webAluno?: Partial<Record<'g1' | 'g2', ParcialWeb[]>> }
export interface Importacao { fonte: Fonte; materias: Materia[]; boletim?: NotaWeb[]; avisos: string[] }
const chave = (s: string) => nomeBonito(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function parseImportacao(txt: string, fonte?: Fonte): Importacao {
  const fontes = ([
    ['aula', /Notas para|G[12]\s+\d+(?:[.,]\d+)?\s*%/i],
    ['web-notas', /Situação\s+Freq|\bFreq\b/i],
    ['web-parciais', /corte\s*\)/i],
  ] as const).filter(([, marcador]) => marcador.test(txt));
  const origem = fonte ?? (fontes.length > 1 ? 'misto' : fontes[0]?.[0] ?? (/WebAluno/i.test(txt) ? 'web-notas' : 'aula'));
  const out: Importacao = { fonte: origem, materias: [], avisos: [] };
  if (origem === 'misto') {
    for (const [origem] of fontes) {
      try {
        const p = parseImportacao(txt, origem);
        out.materias.push(...p.materias);
        if (p.boletim) out.boletim = p.boletim;
        out.avisos.push(...p.avisos);
      } catch (e) { out.avisos.push(`${origem}: ${e instanceof Error ? e.message : 'Não consegui ler esta página.'}`); }
    }
  } else if (origem === 'aula') {
    const p = parseCanvas(txt);
    if (p.g1 || p.g2) { out.materias.push(p); out.avisos = p.avisos; }
  } else if (origem === 'web-parciais') {
    const texto = txt.replace(/MÉDIA\s+PARCIAL\s+(?:-|\d+(?:[.,]\d+)?)/gi, '\n');
    const blocos = [...texto.matchAll(/([\p{Lu}][\p{Lu}\s.,&-]*?)\s*\(\s*([12])[º°o]?\s*corte\s*\)/gu)];
    for (let i = 0; i < blocos.length; i++) {
      const m = blocos[i], corpo = texto.slice(m.index! + m[0].length, blocos[i + 1]?.index ?? texto.length).split(/WebAluno|Notas para|Pular para Conteúdos/i)[0].split(/Avaliação\s+Peso\s+Nota/i).at(-1)!;
      const itens: ParcialWeb[] = [];
      for (const linha of corpo.matchAll(/([\p{L}][\p{L}\p{N} .,-]*?)\s+(\d+(?:[.,]\d+)?)\s+(-|\d+(?:[.,]\d+)?)(?=\s|$)/gu)) {
        const peso = num(linha[2])!, nota = linha[3] === '-' ? '' : fmt(num(linha[3])!);
        if (/MÉDIA|Avaliação/i.test(linha[1]) || peso <= 0 || (nota && (num(nota)! < 0 || num(nota)! > peso))) continue;
        itens.push({ nome: linha[1].trim(), peso: fmt(peso), nota });
      }
      if (!itens.length) continue;
      let materia = out.materias.find(p => chave(p.curso!) === chave(m[1]));
      if (!materia) { materia = { curso: m[1].trim(), avisos: [], webAluno: {} }; out.materias.push(materia); }
      materia.webAluno![m[2] === '1' ? 'g1' : 'g2'] = itens;
    }
  } else {
    out.boletim = [];
    const n = '(-|\\d+(?:[.,]\\d+)?)';
    const tabela = txt.replace(/^[\s\S]*?\bFreq\b\s*/i, '');
    const re = new RegExp(`([\\p{Lu}][\\p{Lu}\\p{N}\\s.,&-]*?)\\s+${n}\\s+${n}\\s+${n}\\s+${n}\\s+${n}\\s+([A-Z-]+)\\s+(\\d+(?:[.,]\\d+)?)(?=\\s|$)`, 'gu');
    for (const m of tabela.matchAll(re)) {
      if (m.slice(2, 7).some(v => v !== '-' && (num(v)! < 0 || num(v)! > 10)) || num(m[8])! > 100) continue;
      const valor = (i: number) => m[i] === '-' ? '' : m[i];
      out.boletim.push({ nome: m[1].trim(), g1: valor(2), g2: valor(3), media: valor(4), exame: valor(5), final: valor(6), situacao: valor(7), frequencia: valor(8) });
    }
  }
  if (!out.materias.length && !out.boletim?.length) throw new Error('Não encontrei notas nesse formato. Confira a fonte e copie a página completa.');
  return out;
}

export function materiaDoBoletim(nota: NotaWeb): Materia {
  const grau = (nota: string) => ({ modo: 'simples' as const, trabMax: '0', trab: '', prova: nota, extra: '', itens: [] });
  return { curso: nota.nome, g1: grau(nota.g1), g2: grau(nota.g2), avisos: [] };
}

export function aplicarImportacao(db: Db, p: Importacao): Db {
  let boletim = db.boletim;
  if (p.boletim) {
    const notas = new Map((boletim ?? []).map(n => [chave(n.nome), n]));
    for (const nota of p.boletim) notas.set(chave(nota.nome), nota);
    boletim = [...notas.values()];
  }
  const lista = db.lista.slice();
  let cur = db.cur;
  const doBoletim = (p.boletim ?? []).filter(n => lista.some(d => d.semestre === db.semestre && chave(d.nome) === chave(n.nome)) || p.materias.some(m => m.curso && chave(m.curso) === chave(n.nome))).map(materiaDoBoletim);
  // No lote misto, as notas oficiais do boletim prevalecem sobre os totais do AULA.
  for (const materia of [...p.materias, ...doBoletim]) {
    const nome = materia.curso ? nomeBonito(materia.curso) : '';
    let i = nome ? lista.findIndex(d => chave(d.nome) === chave(nome) && d.semestre === db.semestre) : -1;
    if (i < 0) i = lista.findIndex(d => /^(Minha|Nova) disciplina$/.test(d.nome) && !d.webAluno && d.semestre === db.semestre && (['g1', 'g2'] as const).every(k => d[k].modo === 'simples' && d[k].trabMax === '4' && !d[k].itens.length && [d[k].trab, d[k].prova, d[k].extra].every(n => !String(n ?? '').trim())));
    if (i < 0) { i = lista.length; lista.push(novaDisc(nome || 'Disciplina importada', db.semestre)); }
    const alvo = { ...lista[i] };
    if (nome) alvo.nome = nome;
    if (materia.g1) alvo.g1 = materia.g1;
    if (materia.g2) alvo.g2 = materia.g2;
    if (materia.sub !== undefined) alvo.sub = materia.sub;
    if (materia.webAluno) alvo.webAluno = { ...alvo.webAluno, ...materia.webAluno };
    lista[i] = alvo; cur = i;
  }
  return { ...db, lista, cur, boletim };
}
