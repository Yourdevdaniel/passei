import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { fmt, simular } from '../logic';
import { Ic, Img, Painel, T } from './ui';

const KEY = 'passei-tour-visual-v1';
export const jaViuTour = () => { try { return !!localStorage.getItem(KEY); } catch { return true; } };
export const marcarTour = () => { try { localStorage.setItem(KEY, '1'); } catch { /* navegador sem armazenamento */ } };

const PASSOS = [
  { img: 'hero', tema: 'Boas-vindas', t: 'Menos contas. Mais tranquilidade.', p: 'Vamos organizar suas notas e descobrir o que falta para a próxima aprovação.', itens: ['G1, G2 e média em um lugar.', 'Suas notas ficam salvas neste navegador.'] },
  { img: 'passo1', tema: 'Importe do seu jeito', t: 'Pode trazer tudo junto.', p: 'PDFs de várias matérias ou texto copiado das páginas. O Passei organiza as informações para você.', itens: ['Cole AULA, Notas e Parciais de uma vez.', 'AULA e WebAluno ficam separados, com os dois cortes.'] },
  { img: 'passo3', tema: 'Experimente uma nota', t: 'E se eu tirar…?', p: 'Mexa na nota abaixo e veja quanto precisaria na G2 para chegar à média 6.', itens: ['Deixe vazio o que ainda não saiu.', 'Simular não altera suas notas salvas.'] },
  { img: 'creditos', tema: 'Tudo bem guardado', t: 'Seu semestre vai com você.', p: 'Organize as matérias por semestre e preencha os créditos para estimar o custo. Para levar tudo a outro aparelho, baixe seu backup.', itens: ['Exportar dados guarda notas, créditos e WebAluno.', 'Importar backup recupera os dados após confirmação.'] },
  { img: 'aprovado', tema: 'Agora é com você', t: 'Vamos ver na prática?', p: 'Abra uma disciplina de teste com tudo preenchido. Explore, mude as notas e descubra como o Passei funciona.', itens: ['O exemplo usa dados fictícios.', 'Suas disciplinas continuam como estão.'] },
];

function Cena({ etapa, g1 }: { etapa: number; g1: number }) {
  const s = PASSOS[etapa];
  return <div className="tour-stage-content" key={etapa} aria-hidden="true">
    <div className="tour-orbit" />
    <span className="tour-spark tour-spark-one">✦</span><span className="tour-spark tour-spark-two">✧</span>
    <div className="tour-personagem"><Img name={s.img} className="tour-loop" /></div>
    <div className={'tour-preview tour-preview-' + etapa}>
      {etapa === 0 && <><div className="tour-preview-label">Seu semestre, mais leve</div><div className="tour-mini-grades"><span>G1<b>7</b></span><span>G2<b>8</b></span><span>Média<b>7,67 {Ic.check}</b></span></div></>}
      {etapa === 1 && <><div className="tour-preview-label">Cada fonte no seu lugar</div><div className="tour-docs">{['AULA.pdf', 'WebAluno', '1º + 2º corte'].map((n, j) => <span className="tour-doc tour-loop" key={n} style={{ animationDelay: `${j * .25}s` }}>{Ic.up}<b>{n}</b><i>✓</i></span>)}</div></>}
      {etapa === 2 && <><div className="tour-preview-label">Um teste antes da prova</div><div className="tour-mini-grades"><span>Se G1 for<b>{fmt(g1)}</b></span><span className="tour-grade-target">Precisa na G2<b>{fmt(simular(g1, 0, 0, 10, 6).alvo)}</b></span></div><div className="tour-demo-track"><i style={{ transform: `scaleX(${simular(g1, 0, 0, 10, 6).alvo / 10})` }} /></div></>}
      {etapa === 3 && <><div className="tour-preview-label">Uma cópia de tudo que importa</div><div className="tour-backup-file"><i className="tour-save-check tour-loop">✓</i><span><b>passei-backup.json</b><small>Notas · Semestres · Créditos</small></span></div></>}
      {etapa === 4 && <><div className="tour-preview-label">Pronta para explorar</div><div className="tour-backup-file"><i className="tour-save-check">✓</i><span><b>Disciplina de teste</b><small>Notas + WebAluno + créditos</small></span></div></>}
    </div>
  </div>;
}

export function Onboarding({ open, onClose, importar, testar }: { open: boolean; onClose: () => void; importar: () => void; testar: () => void }) {
  const [i, setI] = useState(0), [g1, setG1] = useState(7), [pausado, setPausado] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const s = PASSOS[i], ultimo = i === PASSOS.length - 1;
  useEffect(() => {
    if (!open) return;
    setI(0); setG1(7);
    const teclado = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setI(x => Math.min(PASSOS.length - 1, x + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setI(x => Math.max(0, x - 1)); }
    };
    addEventListener('keydown', teclado);
    return () => removeEventListener('keydown', teclado);
  }, [open]);
  return <Painel open={open} onClose={onClose} className="modal" label="Conheça o Passei">
    <div className="tour-visual" ref={root} data-paused={pausado}>
      <aside className="tour-stage">
        <div className="tour-brand"><i>{Ic.check}</i><span>Passei<small>Seu semestre tem companhia.</small></span></div>
        <Cena etapa={i} g1={g1} />
        {T ? <button className="tour-motion" aria-pressed={pausado} onClick={() => setPausado(v => !v)}>{pausado ? '▶ Retomar animações' : 'Ⅱ Pausar animações'}</button> : <span className="tour-motion">Movimento reduzido</span>}
      </aside>
      <section className="tour-guide" aria-labelledby="tour-title">
        <button className="ico tour-close" onClick={onClose} aria-label="Fechar apresentação">{Ic.x}</button>
        <div className="tour-step-counter"><span>CONHEÇA O PASSEI</span><b>{String(i + 1).padStart(2, '0')}<i> / 05</i></b></div>
        <div className="tour-copy" key={i}>
          <div aria-live="polite" aria-atomic="true"><span className="tour-eyebrow">{s.tema}</span><h3 id="tour-title">{s.t}</h3><p>{s.p}</p></div>
          {i === 2 && <div className="tour-playground"><label htmlFor="tour-g1">Minha G1 seria <output htmlFor="tour-g1">{fmt(g1)}</output></label><input id="tour-g1" type="range" min="0" max="10" step="0.5" value={g1} style={{ '--p': `${g1 * 10}%` } as CSSProperties} onChange={e => setG1(+e.target.value)} /><p>Para passar direto, G2 ≥ <strong>{fmt(simular(g1, 0, 0, 10, 6).alvo)}</strong><small>Exemplo de simulação. Suas notas não mudam.</small></p></div>}
          <ul className="tour-list">{s.itens.map(t => <li key={t}><i>✓</i>{t}</li>)}</ul>
        </div>
        <div className="tour-guide-bottom">
          <nav className="tour-progress" aria-label="Etapas da apresentação">{PASSOS.map((x, j) => <button key={x.img} aria-current={j === i ? 'step' : undefined} aria-label={`Etapa ${j + 1}: ${x.tema}`} className={(j === i ? 'on ' : '') + (j < i ? 'done' : '')} onClick={() => setI(j)}><span>{j < i ? '✓' : j + 1}</span></button>)}</nav>
          <div className="tour-actions">
            {ultimo ? <><button className="btn peach" onClick={testar}>Explorar exemplo <span aria-hidden="true">→</span></button><button className="btn line" onClick={importar}>Importar minhas notas</button><button className="tour-skip" onClick={onClose}>Começar do zero</button></>
              : <><button className="tour-skip" onClick={i ? () => setI(i - 1) : onClose}>{i ? 'Voltar' : 'Pular por enquanto'}</button><button className="btn peach" onClick={() => setI(i + 1)}>Próximo <span aria-hidden="true">→</span></button></>}
          </div>
        </div>
      </section>
    </div>
  </Painel>;
}
