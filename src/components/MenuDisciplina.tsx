import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function MenuDisciplina({ x, y, fechar, abrir, nova, remover }: { x: number; y: number; fechar: () => void; abrir: () => void; nova: () => void; remover: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    el.style.left = Math.max(8, Math.min(x, innerWidth - 248)) + 'px';
    el.style.top = Math.max(8, Math.min(y, innerHeight - 180)) + 'px';
    // popover/toggle via DOM: @types/react 18 (versão do lockfile) não tipa `popover` nem `ToggleEvent`.
    el.popover = 'auto';
    const aoAlternar = (e: Event) => { if ((e as ToggleEvent).newState === 'closed') fechar(); };
    el.addEventListener('toggle', aoAlternar);
    el.showPopover(); el.querySelector('button')?.focus();
    return () => { el.removeEventListener('toggle', aoAlternar); anterior?.focus(); };
  }, []);
  const acao = (fn: () => void) => { fechar(); fn(); };
  return createPortal(<div ref={ref} className="discipline-menu" role="menu" aria-label="Ações da disciplina" onKeyDown={e => {
    const botoes = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
    const i = botoes.indexOf(document.activeElement as HTMLButtonElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault(); botoes[e.key === 'Home' ? 0 : e.key === 'End' ? botoes.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + botoes.length) % botoes.length]?.focus();
    }
    if (e.key === 'Tab') fechar();
  }}>
    <button role="menuitem" onClick={() => acao(abrir)}>Abrir disciplina</button>
    <button role="menuitem" onClick={() => acao(nova)}>Nova disciplina</button>
    <button role="menuitem" className="menu-danger" onClick={() => acao(remover)}>Remover disciplina</button>
  </div>, document.body);
}
