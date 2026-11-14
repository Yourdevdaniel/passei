import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { avaliar, fmt, type Db, type Disc, type Grau as TGrau } from './logic';
import { carregar, doSemestre, lerBackup, novaDisc, proximoSemestre, salvar, semestres } from './store';
import { aplicarImportacao, parseImportacao, type Fonte, type Importacao } from './importacao';
import { adicionarDisciplinaTeste } from './exemplo';
import { BoletimWeb, ParciaisWeb } from './components/WebAluno';
import { lerArquivo } from './importar';
import { Ic, RM, Toast, Seg, useAnim } from './components/ui';
import { Grau, Resultado, Simulador, Trilha } from './components/Disciplina';
import { CreditosView, PainelView } from './components/Telas';
import { Ajustes, Importar } from './components/Dialogos';
import { jaViuTour, marcarTour, Onboarding } from './components/Onboarding';

type Tela = 'painel' | 'creditos' | 'disc';
type Aba = 'notas' | 'sim';

export default function App() {
  const [db, setDb] = useState<Db>(carregar);
  const [tela, setTela] = useState<Tela>('painel');
  const [aba, setAba] = useState<Aba>('notas');
  const [ajustes, setAjustes] = useState(false);
  const [imp, setImp] = useState(false);
  const [avisosImportacao, setAvisosImportacao] = useState<string[]>([]);
  const [prog, setProg] = useState<{ p: number; msg: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [tour, setTour] = useState(() => !jaViuTour()); // abre sozinho só na primeira visita
  const fecharTour = () => { marcarTour(); setTour(false); };
  const toastT = useRef(0);
  const d = db.lista[db.cur];
  const r = avaliar(d);
  const linhas = doSemestre(db);

  useEffect(() => salvar(db), [db]);
  const set = (fn: (d: Disc) => Disc) => setDb(p => ({ ...p, lista: p.lista.map((x, i) => i === p.cur ? fn(x) : x) }));
  const setGrau = (k: 'g1' | 'g2') => (fn: (g: TGrau) => TGrau) => set(x => ({ ...x, [k]: fn(x[k]) }));
  const avisar = (msg: string, err?: boolean) => { setToast({ msg, err }); clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(null), 4200); };
  const topo = () => window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0);
  const ir = (t: Tela) => { setTela(t); topo(); };
  const abrir = (i: number) => { setAvisosImportacao([]); setDb(p => ({ ...p, cur: i, semestre: p.lista[i].semestre })); setAba('notas'); ir('disc'); };
  const trocarSemestre = (s: string) => { setDb(p => ({ ...p, semestre: s })); if (tela === 'disc') ir('painel'); };

  const ocupada = useRef(false);
  const concluirImportacao = (lote: Importacao[], avisos: string[]) => {
    if (lote.length) {
      setDb(prev => lote.reduce(aplicarImportacao, prev));
      setImp(false); setAba('notas');
      ir(['web-notas', 'misto'].includes(lote.at(-1)!.fonte) ? 'painel' : 'disc');
    }
    setAvisosImportacao(avisos);
  };
  const importarTexto = (txt: string, fonte?: Fonte | 'passei') => {
    if (ocupada.current) return;
    if (fonte === 'passei' || (!fonte && /^\s*\{/.test(txt))) { void restaurar(txt); return; }
    try {
      const p = parseImportacao(txt, fonte);
      concluirImportacao([p], p.avisos);
      avisar('Notas importadas. Confira no portal da faculdade.');
    } catch (e) { avisar(e instanceof Error ? e.message : 'Não consegui importar o texto.', true); }
  };
  const importarArquivo = async (files: File[]) => {
    if (ocupada.current || !files.length) return;
    ocupada.current = true; setImp(true);
    const lote: Importacao[] = [], avisos: string[] = [];
    try {
      if (files.some(f => /\.json$/i.test(f.name) || f.type === 'application/json')) {
        if (files.length !== 1) { avisar('Importe o backup do Passei sozinho, separado dos PDFs e de outros backups.', true); return; }
        await restaurar(files[0]); return;
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProg({ p: i / files.length, msg: `${i + 1}/${files.length} · ${file.name}` });
        try {
          const txt = await lerArquivo(file, (p, msg) => setProg({ p: (i + p) / files.length, msg: `${i + 1}/${files.length} · ${file.name} · ${msg}` }));
          if (/^\s*\{/.test(txt)) {
            if (files.length !== 1) throw new Error('Importe o backup do Passei sozinho.');
            await restaurar(txt); return;
          }
          const p = parseImportacao(txt); lote.push(p);
          avisos.push(...p.avisos.map(a => `${file.name}: ${a}`));
        } catch (e) { avisos.push(`${file.name}: ${e instanceof Error ? e.message : 'Não consegui ler o arquivo.'}`); }
      }
      concluirImportacao(lote, avisos);
      avisar(`${lote.length} de ${files.length} arquivos importados.${lote.length < files.length ? ' Confira os detalhes da importação.' : ''}`, lote.length < files.length);
    } finally { setProg(null); ocupada.current = false; }
  };
  const acoes = useRef({ importarTexto, importarArquivo });
  acoes.current = { importarTexto, importarArquivo };

  useEffect(() => { // colar e arrastar em qualquer lugar
    const paste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) { e.preventDefault(); acoes.current.importarArquivo(files); return; }
      const t = e.clipboardData?.getData('text') ?? '';
      if (t.length > 40 && /G[12]|WebAluno|"lista"\s*:/.test(t) && !['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) { e.preventDefault(); acoes.current.importarTexto(t); }
    };
    let n = 0;
    const enter = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) { n++; setArrastando(true); } };
    const leave = () => { if (--n <= 0) { n = 0; setArrastando(false); } };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => { e.preventDefault(); n = 0; setArrastando(false); const files = Array.from(e.dataTransfer?.files ?? []); if (files.length) acoes.current.importarArquivo(files); };
    addEventListener('paste', paste); addEventListener('dragenter', enter); addEventListener('dragleave', leave); addEventListener('dragover', over); addEventListener('drop', drop);
    return () => { removeEventListener('paste', paste); removeEventListener('dragenter', enter); removeEventListener('dragleave', leave); removeEventListener('dragover', over); removeEventListener('drop', drop); };
  }, []);

  useEffect(() => { // rolagem suave
    if (RM) return;
    const l = new Lenis({ lerp: .09 }); window.__lenis = l;
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); l.destroy(); window.__lenis = undefined; };
  }, []);

  useAnim(() => { gsap.from('.side .anim-top', { x: -18, opacity: 0, duration: .6, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity' }); }, []);
  const corpo = useRef<HTMLDivElement>(null);
  useAnim(() => { // entrada de cada tela
    if (!corpo.current) return;
    const entradas = corpo.current.querySelectorAll('.anim-in'), barras = corpo.current.querySelectorAll('.barra');
    if (entradas.length) gsap.from(entradas, { y: 22, opacity: 0, duration: .5, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity' });
    if (barras.length) gsap.from(barras, { scaleX: 0, duration: 1.1, delay: .4, ease: 'power3.inOut', clearProps: 'transform' });
  }, [tela, aba, db.cur, db.semestre]);

  const nova = () => {
    setAvisosImportacao([]);
    setDb(p => ({ ...p, lista: [...p.lista, novaDisc('Nova disciplina', p.semestre)], cur: p.lista.length }));
    setAba('notas'); ir('disc');
    setTimeout(() => document.querySelector<HTMLInputElement>('.titulo')?.select(), 60);
  };
  const testar = () => {
    setDb(adicionarDisciplinaTeste); setAvisosImportacao([]); setAba('notas'); ir('disc');
    avisar('Disciplina de teste com dados fictícios. Você pode editar ou apagar.');
  };
  const apagar = () => {
    if (!confirm(`Apagar "${d.nome}"? As notas dela somem deste navegador.`)) return;
    setDb(p => { const lista = p.lista.filter((_, i) => i !== p.cur); return { ...p, lista: lista.length ? lista : [novaDisc('Minha disciplina', p.semestre)], cur: 0 }; });
    setAjustes(false); ir('painel');
  };
  const exportar = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
    a.download = 'passei-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  const restaurar = async (conteudo: File | string) => {
    let novo: Db;
    try { novo = lerBackup(typeof conteudo === 'string' ? conteudo : await conteudo.text()); }
    catch (e) { avisar(e instanceof Error ? e.message : 'Não consegui ler o backup.', true); return; }
    if (!confirm(`Restaurar este backup substituirá todos os dados atuais deste navegador: ${db.lista.length} disciplinas, notas, semestres, créditos e WebAluno. Serão carregadas ${novo.lista.length} disciplinas do backup. Deseja continuar?`)) return;
    setDb(novo); setAjustes(false); setImp(false); setAvisosImportacao([]); ir('painel'); avisar('Dados do Passei restaurados.');
  };

  return <div className="shell">
    <aside className="side">
      <svg className="deco" viewBox="0 0 272 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" fill="none">
        <path d="M0 78 H150 L190 118" stroke="#48d1e0" strokeWidth="1.2" />
        <path d="M272 520 L200 600 V760" stroke="#8c84ff" strokeWidth="1.2" />
        <circle cx="250" cy="880" r="90" stroke="#48d1e0" strokeWidth="1.2" />
        <circle cx="250" cy="880" r="58" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
      </svg>
      <div className="logo anim-top"><i>{Ic.check}</i><span>Passei<small>modelo de notas da ULBRA</small></span></div>
      <div className="sem anim-top">
        <label htmlFor="sem">Semestre</label>
        <select id="sem" value={db.semestre} onChange={e => trocarSemestre(e.target.value)}>
          {semestres(db).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button title="Criar o próximo semestre" aria-label="Criar o próximo semestre" onClick={() => trocarSemestre(proximoSemestre(semestres(db).at(-1)!))}>{Ic.plus}</button>
      </div>
      <nav className="side-list" aria-label="Menu" data-lenis-prevent>
        <button className={'nav anim-top' + (tela === 'painel' ? ' on' : '')} onClick={() => ir('painel')}>{Ic.home}<span className="nm">Painel</span></button>
        <button className={'nav anim-top' + (tela === 'creditos' ? ' on' : '')} onClick={() => ir('creditos')}>{Ic.cred}<span className="nm">Créditos</span></button>
        <div className="side-lbl anim-top">Disciplinas de {db.semestre}</div>
        {linhas.map(({ d: x, i, r: rx, c }) => <button key={x.id} className={'nav anim-top' + (tela === 'disc' && i === db.cur ? ' on' : '')} onClick={() => abrir(i)} title={x.nome}>
          <i className={'dot ' + c.tone} /><span className="nm">{x.nome || 'Sem nome'}</span>{rx.mp != null && <span className="mp">{fmt(rx.mf ?? rx.mp)}</span>}
        </button>)}
        <button className="nav add anim-top" onClick={nova}>{Ic.plus}<span className="nm">Nova disciplina</span></button>
      </nav>
      <div className="side-foot anim-top">
        <button className="btn peach" onClick={() => setImp(true)}>{Ic.up} Importar</button>
        <button className="btn glass" onClick={() => setTour(true)}>Como funciona</button>
        <small>Salvo só neste navegador.<br />Projeto de aluno, sem vínculo oficial com a ULBRA.</small>
      </div>
    </aside>

    <main className="content"><div className="wrap" ref={corpo}>
      <p className="system-hint">Pode haver erros. Confira sempre as informações no portal da faculdade.</p>
      {avisosImportacao.length > 0 && <details className="import-details"><summary>Detalhes da importação ({avisosImportacao.length})</summary><ul>{avisosImportacao.map((a, i) => <li key={i}>{a}</li>)}</ul></details>}
      {tela === 'painel' ? <><PainelView db={db} abrir={abrir} nova={nova} importar={() => setImp(true)} exportar={exportar} testar={testar} /><BoletimWeb notas={db.boletim} /></>
        : tela === 'creditos' ? <CreditosView db={db} setDb={setDb} abrir={abrir} nova={nova} />
        : <div>
          <div className="ph anim-in">
            <div className="ph-main">
              <div className="crumb"><button onClick={() => ir('painel')}>Painel</button> / {d.semestre}</div>
              <input className="titulo" aria-label="Nome da disciplina" title="Clique para renomear" value={d.nome}
                onChange={e => set(x => ({ ...x, nome: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
            </div>
            <div className="ph-act">
              <button className="btn line" onClick={() => setImp(true)}>{Ic.up} Importar</button>
              <button className="btn line" onClick={() => setAjustes(true)}>{Ic.gear} Ajustes</button>
            </div>
          </div>
          <ParciaisWeb notas={d.webAluno} />
          {d.webAluno && <div className="sec-h"><h2>AULA · Notas e simulação</h2><span>Avaliações separadas do WebAluno</span></div>}
          <Trilha r={r} d={d} />
          <Resultado r={r} d={d} set={set} />
          <div className="tabs"><Seg label="Seção" value={aba} onChange={setAba} options={[['notas', 'Minhas notas'], ['sim', 'Simulador']]} /></div>
          {aba === 'notas' ? <div className="graus">
            <Grau key={d.id + 'g1'} k="g1" g={d.g1} gr={r.g1} setG={setGrau('g1')} min={r.min} usado={r.subUsada === 'G1'} />
            <Grau key={d.id + 'g2'} k="g2" g={d.g2} gr={r.g2} setG={setGrau('g2')} min={r.min} usado={r.subUsada === 'G2'} />
          </div> : r.g1.invalido || r.g2.invalido ? <p className="aviso">Corrija os valores das avaliações antes de simular.</p> : <Simulador key={d.id} r={r} />}
          <div className="sec-h" style={{ marginTop: 40 }}><h2>Como é calculado</h2><span>modelo de notas da ULBRA</span></div>
          <div className="forms" style={{ marginTop: 0 }}>
            <div className="card fc anim-in">
              <div className="eq"><div className="frac"><span>G1 + (G2 × 2)</span><i className="barra" style={{ background: 'var(--mint)' }} /><span>3</span></div><span>=</span><span className="res">MP</span></div>
              <p>Média parcial. Precisa de {fmt(r.min)} para passar direto.</p>
            </div>
            <div className="card fc anim-in">
              <div className="eq"><div className="frac"><span>MP + (EF × 2)</span><i className="barra" style={{ background: 'var(--peach)' }} /><span>3</span></div><span>=</span><span className="res">MF</span></div>
              <p>Média final, se for para o exame. Também precisa de {fmt(r.min)}.</p>
            </div>
          </div>
        </div>}
    </div></main>

    <Ajustes open={ajustes} onClose={() => setAjustes(false)} d={d} set={set} apagar={apagar} exportar={exportar} restaurar={restaurar} />
    <Importar open={imp} onClose={() => { if (!ocupada.current) setImp(false); }} onArquivo={importarArquivo} onTexto={importarTexto} exportar={exportar} prog={prog} />
    <Onboarding open={tour} onClose={fecharTour} importar={() => { fecharTour(); setImp(true); }} testar={() => { fecharTour(); testar(); }} />
    {arrastando && <div className="dragzone">Solte para importar</div>}
    <Toast t={toast} />
  </div>;
}
