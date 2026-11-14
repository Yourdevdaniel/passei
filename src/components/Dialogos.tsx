// Gaveta de ajustes e janela de importação
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Disc } from '../logic';
import { Ic, Img, Inp, Painel } from './ui';

export function Ajustes({ open, onClose, d, set, apagar, exportar, restaurar }: {
  open: boolean; onClose: () => void; d: Disc; set: (fn: (d: Disc) => Disc) => void;
  apagar: () => void; exportar: () => void; restaurar: (f: File) => void;
}) {
  const arq = useRef<HTMLInputElement>(null);
  return <Painel open={open} onClose={onClose} className="drawer">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3>Ajustes da disciplina</h3><button className="ico" onClick={onClose} aria-label="Fechar">{Ic.x}</button>
    </div>
    <label className="row"><span>Semestre</span>
      <input className="inp" value={d.semestre} placeholder="2026/2" onChange={e => set(x => ({ ...x, semestre: e.target.value }))} />
      <p className="hint">Troque para mover a disciplina para outro semestre.</p></label>
    <label className="row"><span>Média para passar</span><Inp label="Média mínima" placeholder="6" value={d.minimo} max={10} onChange={v => set(x => ({ ...x, minimo: v }))} /></label>
    <label className="row"><span>Nota da substituição</span><Inp label="Substituição" value={d.sub} max={10} onChange={v => set(x => ({ ...x, sub: v }))} />
      <p className="hint">Entra no lugar do grau que mais ajuda a sua média.</p></label>
    <label className="row switch">Nota do grau para em 10<input type="checkbox" checked={d.limitar} onChange={e => set(x => ({ ...x, limitar: e.target.checked }))} /></label>
    <p className="hint" style={{ marginTop: -10 }}>Desligue se o professor deixa o ponto extra passar de 10.</p>
    <button className="danger" onClick={apagar}>Apagar esta disciplina</button>
    <h3 style={{ margin: '34px 0 6px', fontSize: 17 }}>Seus dados</h3>
    <p className="hint" style={{ margin: '0 0 12px' }}>Tudo fica salvo só neste navegador. Faça um backup para levar a outro aparelho.</p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn line" onClick={exportar}>Baixar backup</button>
      <button className="btn line" onClick={() => arq.current?.click()}>Restaurar backup</button>
      <input ref={arq} type="file" hidden accept="application/json,.json" onChange={e => { const f = e.target.files?.[0]; if (f) restaurar(f); e.target.value = ''; }} />
    </div>
  </Painel>;
}

export function Importar({ open, onClose, onArquivo, onTexto, prog }: {
  open: boolean; onClose: () => void; onArquivo: (f: File) => void; onTexto: (t: string) => void; prog: { p: number; msg: string } | null;
}) {
  const inp = useRef<HTMLInputElement>(null), bar = useRef<HTMLElement>(null), [on, setOn] = useState(false), [txt, setTxt] = useState('');
  useLayoutEffect(() => { if (bar.current) gsap.to(bar.current, { width: (prog?.p ?? 0) * 100 + '%', duration: .4 }); }, [prog?.p]);
  return <Painel open={open} onClose={onClose} className="modal">
    <h3>Importar do Canvas</h3>
    <p>Imprima as notas como PDF (ou tire um print) e solte aqui.</p>
    <p className="aviso">Após importar, revise cada nota e o valor de cada avaliação. A leitura automática pode errar ou deixar avaliações de fora.</p>
    <div className={'drop' + (on ? ' on' : '')} onClick={() => inp.current?.click()}
      onDragOver={e => { e.preventDefault(); setOn(true); }} onDragLeave={() => setOn(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setOn(false); const f = e.dataTransfer.files[0]; if (f) onArquivo(f); }}>
      <Img name="importar" />
      <b>{Ic.up} Solte o PDF ou a imagem</b><span>ou clique para escolher</span>
      <input ref={inp} type="file" hidden accept="application/pdf,image/*,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) onArquivo(f); e.target.value = ''; }} />
    </div>
    {prog && <div><div className="prog"><i ref={bar} /></div><p className="hint" style={{ color: 'var(--mut)', fontSize: 13, margin: '8px 0 0' }}>{prog.msg}</p></div>}
    <div className="or">ou cole o texto da página</div>
    <textarea placeholder="Ctrl+A na página de notas, Ctrl+C e cole aqui" value={txt} onChange={e => setTxt(e.target.value)} />
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn peach" disabled={!txt.trim()} onClick={() => onTexto(txt)}>Importar texto</button>
    </div>
  </Painel>;
}
