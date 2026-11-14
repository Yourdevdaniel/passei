// Apresentação de primeira visita: 5 telas curtas, com a mascote
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Ic, Img, Painel, T } from './ui';

const KEY = 'passei-tour';
export const jaViuTour = () => { try { return !!localStorage.getItem(KEY); } catch { return true; } };
export const marcarTour = () => { try { localStorage.setItem(KEY, '1'); } catch { /* navegador sem armazenamento */ } };

const PASSOS = [
  { img: 'hero', t: 'Bem-vindo ao Passei', p: 'Aqui você descobre quanto precisa tirar para passar. A conta segue o modelo de notas da ULBRA: (G1 + G2 × 2) ÷ 3, com mínimo 6.' },
  { img: 'passo1', t: 'Traga suas notas', p: 'Importe o PDF de notas do Canvas ou crie a disciplina e digite. Cada grau tem trabalhos e prova, do jeito que o professor dividiu.' },
  { img: 'passo2', t: 'Deixe vazio o que não saiu', p: 'Campo vazio é nota que ainda não existe. O Passei calcula quanto você precisa nela para fechar a média.' },
  { img: 'passo3', t: 'Simule antes da prova', p: 'No simulador, escolha uma nota para a G1 e veja o que sobra para a prova da G2. Se cair no exame, ele mostra quanto precisa lá.' },
  { img: 'creditos', t: 'Semestres e créditos', p: 'Separe as disciplinas por semestre no menu. Em Créditos, informe os créditos e o valor para ter uma estimativa do custo.' },
];

export function Onboarding({ open, onClose, importar }: { open: boolean; onClose: () => void; importar: () => void }) {
  const [i, setI] = useState(0);
  const corpo = useRef<HTMLDivElement>(null);
  const s = PASSOS[i], ultimo = i === PASSOS.length - 1;
  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => { // troca de tela
    if (!open || !T || !corpo.current) return;
    const tw = gsap.fromTo(corpo.current.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .06, ease: 'power3.out' });
    return () => { tw.kill(); };
  }, [i, open]);
  useEffect(() => { // setas do teclado
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI(x => Math.min(PASSOS.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI(x => Math.max(0, x - 1));
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [open]);
  return <Painel open={open} onClose={onClose} className="modal">
    <div className="tour">
      <button className="ico tour-x" onClick={onClose} aria-label="Fechar">{Ic.x}</button>
      <div className="tour-corpo" ref={corpo} aria-live="polite">
        <div className="tour-img"><Img name={s.img} /></div>
        <small>{i + 1} de {PASSOS.length}</small>
        <h3>{s.t}</h3>
        <p>{s.p}</p>
      </div>
      <div className="tour-dots" role="tablist" aria-label="Etapas">
        {PASSOS.map((x, j) => <button key={x.img} role="tab" aria-selected={j === i} aria-label={`Etapa ${j + 1}: ${x.t}`} className={j === i ? 'on' : ''} onClick={() => setI(j)} />)}
      </div>
      <div className="tour-act">
        {i > 0 ? <button className="btn line" onClick={() => setI(i - 1)}>Voltar</button> : <button className="btn" onClick={onClose}>Pular</button>}
        {ultimo ? <>
          <button className="btn line" onClick={onClose}>Digitar minhas notas</button>
          <button className="btn peach" onClick={importar}>{Ic.up} Importar do Canvas</button>
        </> : <button className="btn peach" onClick={() => setI(i + 1)}>Próximo</button>}
      </div>
    </div>
  </Painel>;
}
