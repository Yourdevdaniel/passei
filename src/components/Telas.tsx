// Telas gerais: painel do semestre e créditos
import { fmt, num, type Db, type Disc } from '../logic';
import { chipTom, doSemestre } from '../store';
import { Ic, Img, Inp, Ring } from './ui';

interface Nav { abrir: (i: number) => void; nova: () => void }

// ---------- painel (tela inicial) ----------
export function PainelView({ db, abrir, nova, importar }: Nav & { db: Db; importar: () => void }) {
  const rs = doSemestre(db);
  const comNota = rs.filter(x => x.r.status !== 'vazio');
  const medias = rs.filter(x => x.r.mp != null).map(x => x.r.mf ?? x.r.mp!);
  const hoje = new Date().toISOString().slice(0, 10);
  const agenda = rs.flatMap(x => (['g1', 'g2'] as const).flatMap(k => x.d[k].modo !== 'lista' ? [] :
    x.d[k].itens.filter(it => it.data && num(it.nota) === null).map(it => ({ ...it, grau: k.toUpperCase(), disc: x.d.nome, i: x.i }))))
    .sort((a, b) => a.data.localeCompare(b.data));
  const dia = (s: string) => new Date(s + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '');
  return <div>
    <section className="banner anim-in">
      <div>
        <h1>Quanto eu preciso <em>tirar?</em></h1>
        <span className="selo">Segue o modelo de notas da ULBRA: (G1 + G2 × 2) ÷ 3, mínimo 6</span>
        <p>Suas notas de G1 e G2 em um lugar. Veja quanto falta para passar em cada disciplina.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn peach" onClick={importar}>{Ic.up} Importar do Canvas</button>
          <button className="btn glass" onClick={nova}>{Ic.plus} Nova disciplina</button>
        </div>
      </div>
      <Img name="hero" />
    </section>

    {!comNota.length ? <div>
      <div className="sec-h"><h2>Como funciona</h2></div>
      <div className="passos">
        <div className="card passo anim-in"><Img name="passo1" /><i>1</i><h3>Traga suas notas</h3><p>Importe o PDF de notas do Canvas ou digite na disciplina.</p></div>
        <div className="card passo anim-in"><Img name="passo2" /><i>2</i><h3>Deixe vazio o que não saiu</h3><p>O sistema calcula quanto você precisa nessa nota.</p></div>
        <div className="card passo anim-in"><Img name="passo3" /><i>3</i><h3>Simule</h3><p>Teste notas da G1 e veja o que sobra para a prova da G2.</p></div>
      </div>
    </div> : <div className="stats">
      <div className="card stat anim-in"><small>Disciplinas em {db.semestre}</small><b>{rs.length}</b></div>
      <div className="card stat ok anim-in"><small>Aprovadas</small><b>{rs.filter(x => x.c.tone === 'ok').length}</b></div>
      <div className="card stat warn anim-in"><small>Pedem atenção</small><b>{rs.filter(x => x.c.tone === 'warn' || x.c.tone === 'bad').length}</b></div>
      <div className="card stat anim-in"><small>Média geral</small><b>{medias.length ? fmt(medias.reduce((a, b) => a + b, 0) / medias.length) : '–'}</b></div>
    </div>}

    <div className="sec-h"><h2>Disciplinas de {db.semestre}</h2><span>clique para abrir</span></div>
    <div className="dgrid">
      {rs.map(({ d, i, r, c }) => <button key={d.id} className="card dcard anim-in" onClick={() => abrir(i)}>
        <span className={'chip ' + chipTom(c.tone)}>{c.label}</span>
        <h3>{d.nome || 'Sem nome'}</h3>
        <p>{c.txt}</p>
        <Ring v={c.v} max={c.max} size={74} stroke={8} tone={c.tone}><strong style={{ fontSize: 18 }}>{c.show || (c.v == null ? '–' : fmt(c.v))}</strong></Ring>
        <div className="mini">
          <span>G1 <b>{r.G1 == null ? '–' : fmt(r.G1)}</b></span><span>G2 <b>{r.G2 == null ? '–' : fmt(r.G2)}</b></span><span>Média <b>{r.mp == null ? '–' : fmt(r.mp)}</b></span>
        </div>
      </button>)}
      <button className="card dcard novo anim-in" onClick={nova}>{Ic.plus} Nova disciplina</button>
    </div>

    <div className="sec-h"><h2>Próximas avaliações</h2><span>notas com data e ainda sem valor</span></div>
    <section className="card agenda anim-in">
      {agenda.length ? agenda.slice(0, 8).map(a => <button key={a.id} className="ag" onClick={() => abrir(a.i)}>
        <span className={'dt' + (a.data < hoje ? ' late' : '')}>{dia(a.data)}</span>
        <span><b>{a.nome || 'Avaliação'}</b><small>{a.disc} · {a.grau}</small></span>
        <em>{a.max ? 'vale ' + a.max : ''}</em>
      </button>) : <div className="ag-vazio"><Img name="agenda" />
        <p className="vazio-txt">Nada marcado. No modo "Nota por nota", clique no calendário de uma nota para ela aparecer aqui.</p></div>}
    </section>
  </div>;
}

// ---------- créditos ----------
// Estimativa: custo da disciplina = créditos × valor do crédito. Nada vem preenchido; o aluno informa tudo.
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CreditosView({ db, setDb, abrir, nova }: Nav & { db: Db; setDb: (fn: (p: Db) => Db) => void }) {
  const padrao = num(db.valorCredito);
  const linhas = doSemestre(db).map(l => {
    const cr = num(l.d.creditos), valor = num(l.d.valorCredito) ?? padrao;
    return { ...l, cr, custo: cr != null && valor != null ? cr * valor : null, ok: l.c.tone === 'ok' };
  });
  const soma = (f: (l: typeof linhas[number]) => number) => linhas.reduce((s, l) => s + f(l), 0);
  const total = soma(l => l.cr ?? 0), feitos = soma(l => l.ok ? l.cr ?? 0 : 0), custo = soma(l => l.custo ?? 0);
  const temCusto = linhas.some(l => l.custo != null);
  const campo = (i: number, f: keyof Pick<Disc, 'creditos' | 'valorCredito'>) => (v: string) =>
    setDb(p => ({ ...p, lista: p.lista.map((x, j) => j === i ? { ...x, [f]: v } : x) }));
  return <div>
    <div className="ph anim-in">
      <div className="ph-main"><div className="crumb">Passei / créditos</div><h1 className="pg-h">Créditos de {db.semestre}</h1></div>
      <Img name="creditos" className="ph-img" />
    </div>
    <p className="nota-est anim-in"><b>São estimativas.</b> Você preenche os créditos de cada disciplina e o valor do crédito. Os valores oficiais são os do seu boleto e do portal da ULBRA.</p>
    <div className="stats">
      <div className="card stat anim-in"><small>Valor do crédito (R$)</small>
        <Inp className="big" label="Valor do crédito em reais" placeholder="digite" value={db.valorCredito} onChange={v => setDb(p => ({ ...p, valorCredito: v }))} /></div>
      <div className="card stat anim-in"><small>Créditos no semestre</small><b>{fmt(total)}</b></div>
      <div className="card stat ok anim-in"><small>Créditos já aprovados</small><b>{fmt(feitos)}</b></div>
      <div className="card stat anim-in"><small>Total estimado</small><b>{temCusto ? reais(custo) : '–'}</b></div>
    </div>
    <section className="card agenda anim-in">
      <div className="ag cr cr-h"><span>Disciplina</span><span>Créditos</span><span>R$ por crédito</span><em>Estimativa</em></div>
      {linhas.map(l => <div key={l.d.id} className="ag cr">
        <button className="cr-nome" onClick={() => abrir(l.i)} title="Abrir disciplina"><i className={'dot ' + (l.ok ? 'ok' : '')} /> <b>{l.d.nome || 'Sem nome'}</b></button>
        <Inp label={'Créditos de ' + l.d.nome} placeholder="?" value={l.d.creditos} onChange={campo(l.i, 'creditos')} />
        <Inp label={'Valor do crédito de ' + l.d.nome} placeholder={db.valorCredito || '?'} value={l.d.valorCredito} onChange={campo(l.i, 'valorCredito')} />
        <em>{l.custo != null ? reais(l.custo) : '–'}</em>
      </div>)}
      {!linhas.length && <p className="vazio-txt">Nenhuma disciplina em {db.semestre}.</p>}
    </section>
    <p className="hint-cr">O valor do topo vale para todas. Se uma disciplina tiver outro valor por crédito, digite na linha dela.</p>
    <button className="btn line" onClick={nova}>{Ic.plus} Nova disciplina</button>
  </div>;
}
