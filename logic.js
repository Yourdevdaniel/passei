// Regras de cálculo. Sem dependências: roda no navegador e no Node (teste.js).
const num = s => { if (s == null) return null; s = String(s).trim().replace(',', '.'); if (s === '') return null; const n = Number(s); return isFinite(n) ? n : null; };
const fmt = n => (Math.round(n * 100 + 1e-7) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const EPS = 1e-9;
const uid = () => Math.random().toString(36).slice(2, 9);

// Um grau no modo "simples" (trabalhos + prova) ou "lista" (cada nota separada).
// Campo vazio = nota que ainda não saiu (pendente).
function calcGrau(g, limitar) {
  let known = 0, e = 0, trabMax = 0, provaMax = 0, trabTem = 0;
  const pend = [];
  if (g.modo === 'lista') {
    for (const it of g.itens) {
      const n = num(it.nota), m = num(it.max) || 0;
      if (it.tipo === 'extra') { e += n || 0; continue; }
      if (it.tipo === 'trab') trabMax += m; else provaMax += m;
      if (n === null) pend.push({ nome: it.nome || (it.tipo === 'trab' ? 'Trabalho' : 'Prova'), max: m, tipo: it.tipo });
      else { known += n; if (it.tipo === 'trab') trabTem += n; }
    }
  } else {
    trabMax = Math.min(10, Math.max(0, num(g.trabMax) ?? 0)); provaMax = 10 - trabMax; e = num(g.extra) || 0;
    const t = num(g.trab), p = num(g.prova);
    if (trabMax > 0) { if (t === null) pend.push({ nome: 'Trabalhos', max: trabMax, tipo: 'trab' }); else { known += t; trabTem = t; } }
    if (provaMax > 0) { if (p === null) pend.push({ nome: 'Prova', max: provaMax, tipo: 'prova' }); else known += p; }
  }
  let v = pend.length ? null : known + e;
  if (v !== null && limitar) v = Math.min(10, v);
  return { v, known, e, pend, trabMax, provaMax, trabTem };
}

function precisa(alvo, gr) {
  return { valor: alvo - gr.known - gr.e, max: gr.pend.reduce((s, p) => s + p.max, 0), pend: gr.pend };
}

// MP = (G1 + 2·G2) / 3   |   MF = (MP + 2·EF) / 3
function avaliar(d) {
  const min = num(d.minimo) ?? 6;
  const g1 = calcGrau(d.g1, d.limitar), g2 = calcGrau(d.g2, d.limitar);
  let G1 = g1.v, G2 = g2.v, subUsada = null;
  const sub = num(d.sub);
  if (sub !== null && G1 !== null && G2 !== null) {
    const base = (G1 + 2 * G2) / 3, trocaG1 = (sub + 2 * G2) / 3, trocaG2 = (G1 + 2 * sub) / 3;
    if (trocaG2 >= trocaG1 && trocaG2 > base) { G2 = sub; subUsada = 'G2'; }
    else if (trocaG1 > base) { G1 = sub; subUsada = 'G1'; }
  }
  const r = { g1, g2, G1, G2, subUsada, min };
  if (G1 !== null && G2 !== null) {
    r.mp = (G1 + 2 * G2) / 3;
    if (r.mp >= min - EPS) r.status = 'aprovado';
    else {
      r.efPrecisa = (3 * min - r.mp) / 2;
      const ef = num(d.ef);
      if (ef !== null) { r.mf = (r.mp + 2 * ef) / 3; r.status = r.mf >= min - EPS ? 'aprovado-exame' : 'reprovado'; }
      else r.status = r.efPrecisa > 10 + EPS ? 'impossivel' : 'exame';
    }
  } else if (G1 !== null) { r.status = 'falta'; r.falta = 'G2'; r.alvo = (3 * min - G1) / 2; r.precisa = precisa(r.alvo, g2); }
  else if (G2 !== null) { r.status = 'falta'; r.falta = 'G1'; r.alvo = 3 * min - 2 * G2; r.precisa = precisa(r.alvo, g1); }
  else r.status = 'vazio';
  return r;
}

// Simulador: com G1 = x e y pontos de trabalho na G2, quanto falta na prova da G2
function simular(G1, g2Trab, g2Extra, g2ProvaMax, min) {
  const alvo = (3 * min - G1) / 2;
  return { alvo, prova: alvo - g2Trab - g2Extra, provaMax: g2ProvaMax };
}

const tipoDe = nome => /extra|b[ôo]nus/i.test(nome) ? 'extra' : /prova|exame|avalia[çc][ãa]o|teste/i.test(nome) ? 'prova' : 'trab';

// Lê a página de notas do Canvas: texto copiado, PDF com texto ou texto vindo do OCR
function parseCanvas(txt) {
  const N = '(\\d+(?:[.,]\\d+)?)';
  const SC = new RegExp(`${N}\\s*\\/\\s*${N}`);
  const itens = { g1: [], g2: [] };
  const add = (grau, nome, nota, max) => {
    nome = nome.split(/\||\d+(?:[.,]\d+)?\s*\//)[0];
    for (let i = 0; i < 3; i++) nome = nome.replace(/[^\p{L}\p{N})]+$/u, '').replace(/\s+[^\s\d]{1,2}$/, ''); // lixo do OCR no fim
    nome = nome.trim() || 'Item';
    itens[grau].push({ id: uid(), nome, tipo: tipoDe(nome), nota: fmt(num(nota)), max: fmt(num(max)), data: '' });
  };
  const lines = txt.split(/\r?\n/).map(l => l.trim());
  const titulo = l => /^(G[12])\s*[-–—]\s*(.*)$/.exec(l);
  const resumo = l => /\d\s*%|N\/A/.test(l);
  for (let i = 0; i < lines.length; i++) {
    const m = titulo(lines[i]); if (!m) continue;
    let sc = SC.exec(m[2]);
    for (let j = i + 1; !sc && j < lines.length && j < i + 6 && !titulo(lines[j]) && !resumo(lines[j]); j++) sc = SC.exec(lines[j]);
    if (sc) add(m[1].toLowerCase(), m[2], sc[1], sc[2]);
  }
  if (!itens.g1.length && !itens.g2.length) { // tudo numa linha só (PDF com texto)
    const s = txt.replace(/\s+/g, ' ');
    for (const m of s.matchAll(new RegExp(`(G[12]) ?[-–] ?([^/]{1,90}?) \\1 [^/]{0,40}?${N} ?\\/ ?${N}`, 'g'))) add(m[1].toLowerCase(), m[2], m[3], m[4]);
  }
  const pct = {};
  for (const m of txt.matchAll(/(?:^|\s)(G1|G2|Substitui\S*)\s+(\d+(?:[.,]\d+)?)\s*%/g)) pct[m[1].startsWith('S') ? 'sub' : m[1].toLowerCase()] = num(m[2]) / 10;
  const out = { avisos: [] };
  for (const k of ['g1', 'g2']) {
    const lista = itens[k].length ? itens[k] : pct[k] != null ? [{ id: uid(), nome: 'Nota do ' + k.toUpperCase(), tipo: 'prova', nota: fmt(pct[k]), max: '10', data: '' }] : null;
    if (!lista) continue;
    out[k] = { modo: 'lista', trabMax: 4, trab: '', prova: '', extra: '', itens: lista };
    const soma = lista.reduce((s, i) => s + (num(i.nota) || 0), 0);
    if (pct[k] != null && Math.abs(soma - pct[k]) > 0.06) out.avisos.push(`${k.toUpperCase()}: itens somam ${fmt(soma)}, o Canvas diz ${fmt(pct[k])}`);
  }
  if (pct.sub) out.sub = fmt(pct.sub);
  out.curso = (txt.match(/(\d{4,6} - [A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 ,.()&-]{2,80}?)(?=\s+[A-Z]?[a-z]|\s*$|\s+https?|\s+\d)/m) || [])[1];
  return out;
}

if (typeof module !== 'undefined') module.exports = { num, fmt, calcGrau, avaliar, simular, parseCanvas };
