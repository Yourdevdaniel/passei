// Tela de uma disciplina: trilha, resultado, G1/G2 e simulador
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { calcGrau, EPS, fmt, itemPendente, num, simular, uid, type Aval, type Disc, type Grau as TGrau, type GrauCalc, type Item as TItem, type Tipo } from '../logic';
import { tom } from '../store';
import { Ic, Img, Inp, Num, Ring, Seg, T, useAnim } from './ui';

type SetDisc = (fn: (d: Disc) => Disc) => void;

// ---------- trilha: G1 → G2 → média → exame → resultado ----------
export function Trilha({ r, d }: { r: Aval; d: Disc }) {
  const exame = ['exame', 'impossivel', 'aprovado-exame', 'reprovado'].includes(r.status);
  const ok = r.status === 'aprovado' || r.status === 'aprovado-exame' || (r.status === 'falta' && r.precisa!.valor <= EPS);
  const bad = r.status === 'reprovado' || r.status === 'impossivel';
  const steps: { k: string; v: number | null | undefined; sub: string }[] =
    [{ k: 'G1', v: r.G1, sub: 'peso 1' }, { k: 'G2', v: r.G2, sub: 'peso 2' }, { k: 'Média', v: r.mp, sub: 'mínimo ' + fmt(r.min) }];
  if (exame) steps.push({ k: 'Exame', v: num(d.ef), sub: 'vale 10' });
  const cur = ok || bad ? -1 : steps.findIndex(s => s.v == null);
  return <section className="card trilha anim-in" aria-label="Etapas da disciplina"><div className="tr">
    {steps.map((s, i) => <div key={s.k} className={'tr-step' + (s.v != null ? ' done' : '') + (i === cur ? ' cur' : '')}>
      <div className="tr-node">{s.v != null ? fmt(s.v) : '?'}</div><b>{s.k}</b><small>{i === cur ? 'falta esta' : s.sub}</small>
    </div>)}
    <div className={'tr-step fim' + (ok ? ' done ok' : bad ? ' done bad' : '')}>
      <div className="tr-node">{ok ? '✓' : bad ? '✕' : '?'}</div><b>{ok ? 'Aprovado' : bad ? 'Reprovado' : 'Resultado'}</b><small>{ok || bad ? 'fim' : 'no fim do semestre'}</small>
    </div>
  </div></section>;
}

// ---------- resultado ----------
export function Resultado({ r, d, set }: { r: Aval; d: Disc; set: SetDisc }) {
  const box = useRef<HTMLElement>(null), min = r.min;
  useLayoutEffect(() => { if (T) gsap.fromTo(box.current, { scale: .97 }, { scale: 1, duration: .9, ease: 'elastic.out(1,.5)' }); }, [r.status]);
  let ring: { v: number | null; max: number; tone: string; bottom: string } = { v: null, max: 10, tone: '', bottom: '' };
  let chip = ['', 'Comece aqui'], h: ReactNode = 'Coloque suas notas', sub: ReactNode = 'Deixe vazio o que ainda não saiu. A gente calcula quanto falta.';
  let form = 'MP = (G1 + G2 × 2) ÷ 3', img = 'vazio', ef = false;
  if (r.status === 'vazio' && r.g1.known + r.g1.e + r.g2.known + r.g2.e > 0) {
    chip = ['', 'Em andamento']; h = 'Notas em andamento';
    sub = 'G1 e G2 ainda têm notas pendentes. A média será calculada quando os graus estiverem completos.';
  }
  if (r.g1.invalido || r.g2.invalido) {
    chip = ['warn', 'Confira os valores']; h = 'Corrija as notas ou os valores';
    sub = 'Cada nota deve respeitar o valor da avaliação, e as avaliações de cada grau devem somar 10 pontos, sem contar os extras.';
  }
  if (r.status === 'falta') {
    const p = r.precisa!, falta = r.falta!, gr = falta === 'G1' ? r.g1 : r.g2;
    const onde = (p.pend.length > 2 ? 'notas que faltam' : p.pend.map(x => x.nome.toLowerCase()).join(' + ')) + ' do ' + falta;
    ring = { v: Math.max(0, p.valor), max: p.max, tone: 'peach', bottom: '/ ' + fmt(p.max) };
    form = falta === 'G2' ? `G2 ≥ (${fmt(3 * min)} − ${fmt(r.G1!)}) ÷ 2 = ${fmt(r.alvo!)}` : `G1 ≥ ${fmt(3 * min)} − ${fmt(r.G2!)} × 2 = ${fmt(r.alvo!)}`;
    if (p.valor <= EPS) { chip = ['ok', 'Garantido']; h = 'Você já passou'; sub = `Mesmo tirando 0 no que falta do ${falta}.`; img = 'aprovado'; ring.tone = 'ok'; }
    else if (p.valor <= p.max + EPS) { chip = [p.valor / p.max > .8 ? 'warn' : '', 'Falta pouco']; h = `Precisa de ${fmt(p.valor)}`; sub = <>Onde: <b>{onde}</b>, que vale {fmt(p.max)}.</>; img = 'simulador'; }
    else {
      const melhor = Math.min(d.limitar ? 10 : Infinity, gr.known + gr.e + p.max);
      const mp = falta === 'G2' ? (r.G1! + 2 * melhor) / 3 : (melhor + 2 * r.G2!) / 3, efp = (3 * min - mp) / 2;
      chip = ['warn', 'Em andamento']; h = 'Ainda há notas pendentes'; img = 'exame'; ring.tone = 'warn';
      sub = efp <= 10 ? <>Se fechar as pendências com nota máxima, precisará de <b>{fmt(efp)}</b> no exame.</> : 'Com estas notas, mesmo o melhor cenário exigiria substituição. Confira as pendências.';
    }
  } else if (r.mp != null) {
    const final = r.mf ?? r.mp;
    ring = { v: final, max: 10, tone: tom(final, min), bottom: r.mf != null ? 'média final' : 'média' };
    form = r.mf != null ? `MF = (${fmt(r.mp)} + ${fmt(num(d.ef)!)} × 2) ÷ 3 = ${fmt(r.mf)}` : `MP = (${fmt(r.G1!)} + ${fmt(r.G2!)} × 2) ÷ 3 = ${fmt(r.mp)}`;
    if (r.status === 'aprovado') { chip = ['ok', 'Aprovado']; h = 'Passou direto!'; sub = r.mp - min > EPS ? <>Sobrou <b>{fmt(r.mp - min)}</b> de folga.</> : 'Na conta certinha.'; img = 'aprovado'; }
    else {
      ef = true;
      const efp = fmt(r.efPrecisa!);
      if (r.status === 'exame') { chip = ['warn', 'Exame final']; h = `Precisa de ${efp} no exame`; sub = 'Coloque a nota do exame quando sair.'; img = 'exame'; }
      else if (r.status === 'impossivel') { chip = ['bad', 'Exame não salva']; h = 'Só com substituição'; sub = `O exame pediria ${efp}. Abra os ajustes.`; img = 'reprovado'; }
      else if (r.status === 'aprovado-exame') { chip = ['ok', 'Aprovado']; h = 'Passou no exame!'; sub = <>Média final <b>{fmt(r.mf!)}</b>.</>; img = 'aprovado'; }
      else { chip = ['bad', 'Reprovado']; h = 'Não deu dessa vez'; sub = `Precisava de ${efp} no exame.`; img = 'reprovado'; }
    }
    if (r.subUsada) sub = <>{sub} Substituição no lugar do {r.subUsada}.</>;
  }
  return <section className="card result anim-in" ref={box} aria-live="polite">
    <Ring v={ring.v} max={ring.max} tone={ring.tone} size={150} stroke={13}>
      <strong style={{ fontSize: 40 }}><Num v={ring.v} /></strong><small>{ring.bottom || 'de 10'}</small>
    </Ring>
    <div>
      <span className={'chip ' + chip[0]}>{chip[1]}</span>
      <h2>{h}</h2>
      <p className="sub">{sub}</p>
      {ef && <div className="ef"><span>Nota do exame</span>
        <div style={{ width: 90 }}><Inp label="Nota do exame" value={d.ef} placeholder="?" max={10} onChange={v => set(x => ({ ...x, ef: v }))} /></div>
        <span className="sub" style={{ margin: 0 }}>/ 10</span></div>}
      <div className="mono">{form}</div>
    </div>
    <Img name={img} className="res-img" />
  </section>;
}

// ---------- G1 / G2 ----------
const NOMES: Record<Tipo, string> = { trab: 'Trabalho', prova: 'Prova', extra: 'Extra' };
const PROX: Record<Tipo, Tipo> = { trab: 'prova', prova: 'extra', extra: 'trab' };

function Item({ it, onChange, onDel }: { it: TItem; onChange: (p: Partial<TItem>) => void; onDel: () => void }) {
  const ref = useRef<HTMLLIElement>(null), [cal, setCal] = useState(!!it.data);
  useAnim(() => { gsap.from(ref.current, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: .35, ease: 'power2.out', clearProps: 'all' }); }, []);
  const del = () => gsap.to(ref.current, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: -8, duration: .3 * T, ease: 'power2.in', onComplete: onDel });
  return <li ref={ref} className={'item t-' + it.tipo}>
    <button className="tipo" title="Clique para trocar o tipo" onClick={() => onChange({ tipo: PROX[it.tipo] })}>{NOMES[it.tipo]}</button>
    <input className="nome" value={it.nome} placeholder={NOMES[it.tipo]} aria-label={`Nome da avaliação: ${it.nome || NOMES[it.tipo]}`} onChange={e => onChange({ nome: e.target.value })} />
    <div className="nota">
      <Inp label={`Nota de ${it.nome || NOMES[it.tipo]}`} value={it.nota} placeholder="?" max={it.tipo === 'extra' ? null : num(it.max)} onChange={v => onChange({ nota: v })} />
      {it.tipo !== 'extra' && <><span>/</span><Inp label={`Valor máximo de ${it.nome || NOMES[it.tipo]}`} value={it.max} placeholder="vale" onChange={v => onChange({ max: v })} /></>}
    </div>
    {cal ? <input type="date" className="data" aria-label="Data" value={it.data} onChange={e => onChange({ data: e.target.value })} />
      : <button className="ico cal" title="Adicionar data (opcional)" onClick={() => setCal(true)}>{Ic.cal}</button>}
    <button className="ico del" title="Remover" aria-label={`Remover avaliação: ${it.nome || NOMES[it.tipo]}`} onClick={del}>{Ic.x}</button>
    {itemPendente(it) && <small className="item-feedback">{num(it.nota) === 0 ? 'Avaliação futura: este zero está sendo tratado como pendente.' : 'Nota pendente. Preencha quando sair; use 0 somente para uma nota confirmada.'}</small>}
  </li>;
}

export function Grau({ k, g, gr, setG, min, usado }: { k: 'g1' | 'g2'; g: TGrau; gr: GrauCalc; setG: (fn: (g: TGrau) => TGrau) => void; min: number; usado: boolean }) {
  const [extra, setExtra] = useState(false);
  const tm = gr.trabMax, pm = gr.provaMax, K = k.toUpperCase();
  const trocar = (m: TGrau['modo']) => setG(g => {
    if (m === g.modo) return g;
    if (m === 'lista') {
      if (g.itens.length) return { ...g, modo: m };
      const t = num(g.trabMax) ?? 0, itens: TItem[] = [];
      if (t > 0) itens.push({ id: uid(), nome: 'Trabalhos', tipo: 'trab', nota: g.trab, max: fmt(t), data: '' });
      if (t < 10) itens.push({ id: uid(), nome: 'Prova', tipo: 'prova', nota: g.prova, max: fmt(10 - t), data: '' });
      if (num(g.extra)) itens.push({ id: uid(), nome: 'Ponto extra', tipo: 'extra', nota: g.extra, max: '', data: '' });
      return { ...g, modo: m, itens };
    }
    const soma = (tipo: Tipo) => { const xs = g.itens.filter(i => i.tipo === tipo && num(i.nota) !== null); return xs.length ? fmt(xs.reduce((s, i) => s + num(i.nota)!, 0)) : ''; };
    const cg = calcGrau({ ...g, modo: 'lista' }, false);
    return { ...g, modo: m, trab: soma('trab'), prova: soma('prova'), extra: soma('extra'), trabMax: Math.abs(cg.trabMax + cg.provaMax - 10) < EPS ? fmt(cg.trabMax) : g.trabMax };
  });
  const setItem = (id: string, p: Partial<TItem>) => setG(g => ({ ...g, itens: g.itens.map(i => i.id === id ? { ...i, ...p } : i) }));
  const add = (tipo: Tipo) => setG(g => {
    const usados = calcGrau({ ...g, modo: 'lista' }, false), sobra = Math.max(0, 10 - usados.trabMax - usados.provaMax);
    const n = g.itens.filter(i => i.tipo === tipo).length + 1;
    const nome = { trab: 'Trabalho ', prova: 'Prova ', extra: 'Ponto extra ' }[tipo] + n;
    return { ...g, itens: [...g.itens, { id: uid(), nome, tipo, nota: '', max: tipo === 'extra' || !sobra ? '' : fmt(sobra), data: '' }] };
  });
  const campo = (f: 'trab' | 'prova' | 'extra' | 'trabMax') => (v: string) => setG(g => ({ ...g, [f]: v }));
  return <section className="card gc anim-in">
    <div className="gc-head">
      <div><span className="gc-tag">{K}</span><span className="gc-peso">peso {k === 'g1' ? 1 : 2}</span></div>
      <Ring v={gr.v} size={64} stroke={7} tone={tom(gr.v, min)}><strong style={{ fontSize: 17 }}><Num v={gr.v} /></strong></Ring>
    </div>
    {gr.pend.length > 0 && <p className="aviso">{gr.pend.length} {gr.pend.length === 1 ? 'avaliação pendente' : 'avaliações pendentes'}. Já somou {fmt(gr.known + gr.e)} pontos. O grau ainda não está fechado.</p>}
    <Seg small label={'Modo do ' + K} value={g.modo} options={[['simples', 'Simples'], ['lista', 'Nota por nota']]} onChange={trocar} />
    {g.modo !== 'lista' ? <div>
      <div className="split">
        <label>Trabalhos valem <Inp className="mini" label="Pontos de trabalho" value={g.trabMax} max={10} onChange={campo('trabMax')} /></label>
        <span>Prova vale <b>{fmt(pm)}</b></span>
      </div>
      <div className="duo">
        {tm > 0 && <div className="fld"><span>Trabalhos</span><div className="fld-row"><Inp className="big" label="Nota dos trabalhos" placeholder="?" max={tm} value={g.trab} onChange={campo('trab')} /><em>/ {fmt(tm)}</em></div></div>}
        {pm > 0 && <div className="fld"><span>Prova</span><div className="fld-row"><Inp className="big" label="Nota da prova" placeholder="?" max={pm} value={g.prova} onChange={campo('prova')} /><em>/ {fmt(pm)}</em></div></div>}
      </div>
      {extra || g.extra ? <div className="fld extra"><span>Ponto extra</span><Inp label="Ponto extra" placeholder="0" value={g.extra} onChange={campo('extra')} /></div>
        : <button className="link" onClick={() => setExtra(true)}>+ ponto extra</button>}
    </div> : <div>
      <ul className="itens">{g.itens.map(it => <Item key={it.id} it={it} onChange={p => setItem(it.id, p)} onDel={() => setG(g => ({ ...g, itens: g.itens.filter(i => i.id !== it.id) }))} />)}</ul>
      <div className="adds"><button onClick={() => add('trab')}>+ Trabalho</button><button onClick={() => add('prova')}>+ Prova</button><button onClick={() => add('extra')}>+ Extra</button></div>
      {g.itens.some(i => i.tipo !== 'extra') && Math.abs(tm + pm - 10) > EPS && <p className="aviso">Os itens valem {fmt(tm + pm)} de 10.</p>}
    </div>}
    {usado && <p className="aviso" style={{ color: 'var(--ok-ink)' }}>Trocado pela substituição.</p>}
  </section>;
}

// ---------- simulador ----------
function Slider({ label, value, max, real, onChange, onReset }: { label: string; value: number; max: number; real: number | null; onChange: (v: number) => void; onReset: () => void }) {
  const pct = max ? (value / max) * 100 : 0, simulado = real == null || Math.abs(real - value) > EPS;
  const [txt, setTxt] = useState<string | null>(null); // texto enquanto digita ("3," ainda não é número)
  const digitar = (t: string) => { t = t.replace(/[^\d.,]/g, ''); setTxt(t); const n = num(t); if (n !== null) onChange(Math.min(max, Math.max(0, n))); };
  return <div className="sl">
    <div className="sl-top">
      <label>{label}{real != null && (simulado
        ? <button className="tag simu" title="Voltar para sua nota" onClick={onReset}>simulado {Ic.volta}</button>
        : <span className="tag real">sua nota</span>)}</label>
      <span className="sl-val">
        <input className="sl-inp" type="text" inputMode="decimal" aria-label={label + ' (digite)'} title="Clique e digite" value={txt ?? fmt(value)}
          onFocus={e => { setTxt(fmt(value)); e.target.select(); }} onChange={e => digitar(e.target.value)}
          onBlur={() => setTxt(null)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        <small>/ {fmt(max)}</small>
      </span>
    </div>
    <input type="range" min="0" max={max} step=".05" value={value} aria-label={label} style={{ '--p': pct + '%' } as CSSProperties} onChange={e => onChange(+e.target.value)} />
  </div>;
}

export function Simulador({ r }: { r: Aval }) {
  const min = r.min, g2 = r.g2;
  const [g1s, setG1] = useState<number | null>(null), [t2s, setT2] = useState<number | null>(null);
  const G1 = g1s ?? r.G1 ?? 6;
  const tMax = g2.trabMax, pMax = g2.provaMax;
  const T2 = Math.min(tMax, t2s ?? g2.trabTem);
  const s = simular(G1, T2, g2.e, pMax, min);
  let h: ReactNode, p: ReactNode, tone = 'peach';
  if (s.prova <= EPS) { h = 'Já garantido'; p = 'Pode tirar 0 na prova da G2.'; tone = 'ok'; }
  else if (s.prova <= pMax + EPS) { h = `${fmt(s.prova)} na prova da G2`; p = `Para fechar a G2 em ${fmt(s.alvo)}.`; tone = s.prova / pMax > .8 ? 'warn' : 'peach'; }
  else {
    const t = s.alvo - pMax - g2.e; tone = 'bad';
    h = 'Direto não dá';
    p = t <= tMax + EPS ? `Com prova cheia, precisa de ${fmt(t)} nos trabalhos.` : 'Com essa G1, vai pro exame.';
  }
  const tiles = Array.from({ length: 11 }, (_, i) => { const x = simular(i, T2, g2.e, pMax, min).prova; return { i, x, c: x <= EPS ? 'ok' : x > pMax + EPS ? 'bad' : x / pMax > .8 ? 'warn' : 'mid' }; });
  return <section className="card sim anim-in">
    <div className="sim-controls">
      <button className="btn line" onClick={() => { setG1(null); setT2(null); }}>Restaurar minhas notas</button>
      <p className="hint">A simulação não altera suas notas salvas.{r.G1 == null ? ' Sem G1 concluída, usamos 6 como ponto de partida.' : ''}</p>
    </div>
    <div>
      <Slider label="Se eu tirar na G1" value={G1} max={10} real={r.G1} onChange={setG1} onReset={() => setG1(null)} />
      {tMax > 0 && <Slider label="Trabalhos da G2 (já tenho)" value={T2} max={tMax} real={g2.trabTem} onChange={setT2} onReset={() => setT2(null)} />}
      <div className="grid-t">
        <h4>Nota da G1 → quanto precisa na prova da G2</h4>
        <div className="tiles">{tiles.map(t => <button key={t.i} className={'tile ' + t.c + (Math.round(G1) === t.i ? ' cur' : '')} onClick={() => setG1(t.i)} title={'Simular G1 = ' + t.i}>
          <small>{t.i}</small><b>{t.c === 'ok' ? '✓' : t.c === 'bad' ? '✕' : fmt(t.x)}</b></button>)}</div>
        <div className="legend">
          <span><i style={{ background: 'var(--ok)' }} />garantido</span><span><i style={{ background: 'var(--lav)' }} />tranquilo</span>
          <span><i style={{ background: 'var(--warn)' }} />apertado</span><span><i style={{ background: 'var(--bad)' }} />exame</span>
        </div>
      </div>
    </div>
    <div className="sim-out">
      <Img name="simulador" className="res-img" />
      <Ring v={Math.max(0, Math.min(pMax, s.prova))} max={pMax} tone={tone} size={170} stroke={14}>
        <strong style={{ fontSize: 44 }}><Num v={Math.max(0, s.prova)} /></strong><small>/ {fmt(pMax)} na prova</small>
      </Ring>
      <h3>{h}</h3><p>{p}</p>
      <p className="mono">G2 = ({fmt(3 * min)} − G1) ÷ 2 = {fmt(s.alvo)}</p>
    </div>
  </section>;
}
