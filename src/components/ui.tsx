// Peças pequenas usadas em todas as telas
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { EPS, fmt, num } from '../logic';

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const T = RM ? 0 : 1; // multiplica as durações: 0 para quem pediu menos movimento

// Animação de entrada com limpeza: sem o revert, o StrictMode roda duas vezes e o elemento fica invisível
export function useAnim(fn: () => void, deps: unknown[]) {
  useLayoutEffect(() => {
    if (!T) return;
    const ctx = gsap.context(fn);
    return () => ctx.revert();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

declare global {
  interface Window { __lenis?: { stop(): void; start(): void; scrollTo(y: number, o?: { immediate?: boolean }): void } }
}

// Ilustração opcional: se o arquivo não existir em /img, o espaço some
export function Img({ name, className = '' }: { name: string; className?: string }) {
  const [ok, setOk] = useState(true);
  return ok ? <img className={'slot ' + className} src={`/img/${name}.webp`} alt="" onError={() => setOk(false)} /> : null;
}

// Número que conta até o valor
export function Num({ v }: { v: number | null | undefined }) {
  const ref = useRef<HTMLSpanElement>(null), o = useRef({ v: v ?? 0 });
  useLayoutEffect(() => {
    const el = ref.current!;
    if (v == null || !isFinite(v)) { el.textContent = '–'; return; }
    if (!T) { o.current.v = v; el.textContent = fmt(v); return; }
    const tw = gsap.to(o.current, { v, duration: .9, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.current.v); } });
    return () => { tw.kill(); };
  }, [v]);
  return <span ref={ref}>{v == null ? '–' : fmt(v)}</span>;
}

export function Ring({ v, max = 10, size = 140, stroke = 12, tone = '', children }:
  { v: number | null | undefined; max?: number; size?: number; stroke?: number; tone?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r, ref = useRef<SVGCircleElement>(null);
  useLayoutEffect(() => {
    const f = v == null || !max ? 0 : Math.max(0, Math.min(1, v / max));
    gsap.to(ref.current, { strokeDashoffset: C * (1 - f), opacity: f > 0 ? 1 : 0, duration: 1.1 * T, ease: 'power3.out' }); // sem o ponto solto quando é 0
  }, [v, max, C]);
  return <div className={'ring ' + tone} style={{ width: size, height: size }}>
    <svg viewBox={`0 0 ${size} ${size}`}>
      <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      <circle ref={ref} className="ring-fg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={C} strokeDashoffset={C} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
    <div className="ring-in">{children}</div>
  </div>;
}

// Abas com o indicador que desliza
export function Seg<V extends string>({ value, options, onChange, small, label }:
  { value: V; options: [V, string][]; onChange: (v: V) => void; small?: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null), ind = useRef<HTMLElement>(null), first = useRef(true);
  useLayoutEffect(() => {
    const move = () => {
      const b = ref.current?.querySelector<HTMLElement>(`[data-v="${value}"]`);
      if (b) gsap.to(ind.current, { x: b.offsetLeft - 4, width: b.offsetWidth, duration: first.current ? 0 : .5 * T, ease: 'power3.inOut' });
      first.current = false;
    };
    move(); document.fonts?.ready.then(move);
    addEventListener('resize', move);
    return () => removeEventListener('resize', move);
  }, [value]);
  return <div className={'seg' + (small ? ' small' : '')} ref={ref} role="tablist" aria-label={label}>
    <i className="seg-ind" ref={ind} style={{ left: 4 }} />
    {options.map(([v, l]) => <button key={v} role="tab" aria-selected={v === value} data-v={v} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}

// Campo de número: aceita vírgula, seleciona tudo ao clicar, Enter confirma
export function Inp({ value, onChange, className = '', placeholder = '–', label, max }:
  { value: string | undefined; onChange: (v: string) => void; className?: string; placeholder?: string; label: string; max?: number | null }) {
  const passou = max != null && (num(value) ?? 0) > max + EPS;
  return <input type="text" inputMode="decimal" aria-label={label} className={'inp ' + className + (passou ? ' over' : '')}
    value={value ?? ''} placeholder={placeholder}
    onFocus={e => e.target.select()} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    onChange={e => onChange(e.target.value.replace(/[^\d.,]/g, ''))} />;
}

const svg = (d: ReactNode, w = 18, sw = 2.2) =>
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
export const Ic = {
  cal: svg(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>, 16, 2),
  x: svg(<path d="M6 6l12 12M18 6L6 18" />, 16, 2.4),
  gear: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>, 18, 2),
  up: svg(<path d="M12 16V4M6 10l6-6 6 6M4 20h16" />),
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15123a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-11" /></svg>,
  home: svg(<path d="M3 11l9-8 9 8M5 10v10h14V10" />),
  plus: svg(<path d="M12 5v14M5 12h14" />, 16, 2.6),
  cred: svg(<><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 11h18M7 15h4" /></>),
  volta: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ verticalAlign: -1 }}><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>,
};

// Gaveta lateral ou janela central, com véu, Esc e rolagem travada atrás
export function Painel({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className: 'drawer' | 'modal' }) {
  const veu = useRef<HTMLDivElement>(null), box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    window.__lenis?.stop();
    const ctx = gsap.context(() => {
      gsap.from(veu.current, { opacity: 0, duration: .3 * T });
      gsap.from(box.current, className === 'drawer' ? { x: '100%', duration: .5 * T, ease: 'power4.out' } : { y: 30, opacity: 0, scale: .96, duration: .4 * T, ease: 'back.out(1.6)' });
    });
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', esc);
    return () => { ctx.revert(); removeEventListener('keydown', esc); window.__lenis?.start(); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return <div>
    <div className="veu" ref={veu} onClick={onClose} />
    <div className={className + (className === 'modal' ? ' card' : '')} ref={box} role="dialog" aria-modal="true" data-lenis-prevent>{children}</div>
  </div>;
}

export function Toast({ t }: { t: { msg: string; err?: boolean } | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (t && ref.current) gsap.fromTo(ref.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .45 * T, ease: 'back.out(1.7)' }); }, [t]);
  return t ? <div ref={ref} className={'toast' + (t.err ? ' err' : '')} role="status">{t.msg}</div> : null;
}
