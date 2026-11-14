// Gaveta de ajustes e janela de importação
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Disc } from '../logic';
import type { Fonte } from '../importacao';
import { Ic, Img, Inp, Painel, T } from './ui';

export function Ajustes({ open, onClose, d, set, apagar, exportar, restaurar }: {
  open: boolean; onClose: () => void; d: Disc; set: (fn: (d: Disc) => Disc) => void;
  apagar: () => void; exportar: () => void; restaurar: (f: File) => void;
}) {
  const arq = useRef<HTMLInputElement>(null);
  return <Painel open={open} onClose={onClose} className="drawer" label="Ajustes da disciplina">
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

export function Importar({ open, onClose, onArquivo, onTexto, exportar, prog }: {
  open: boolean; onClose: () => void; onArquivo: (f: File[]) => void; onTexto: (t: string, fonte?: Fonte | 'passei') => void; exportar: () => void; prog: { p: number; msg: string } | null;
}) {
  const inp = useRef<HTMLInputElement>(null), bar = useRef<HTMLElement>(null), [on, setOn] = useState(false), [txt, setTxt] = useState('');
  const backup = useRef<HTMLInputElement>(null);
  const [fonte, setFonte] = useState<Fonte | 'passei' | ''>('');
  useLayoutEffect(() => { if (bar.current) gsap.to(bar.current, { width: (prog?.p ?? 0) * 100 + '%', duration: .4 * T }); }, [prog?.p]);
  return <Painel open={open} onClose={onClose} className="modal" label="Importar e exportar dados">
    <h3>Importar e exportar</h3>
    <section className="backup-actions" aria-label="Seus dados no Passei">
      <h4>Seus dados no Passei</h4>
      <p>Leve todas as notas, semestres, créditos e dados do WebAluno para outro navegador ou aparelho.</p>
      <div><button className="btn line" disabled={!!prog} onClick={exportar}>Exportar dados</button>
        <button className="btn line" disabled={!!prog} onClick={() => backup.current?.click()}>Importar backup do Passei</button></div>
      <input ref={backup} type="file" hidden disabled={!!prog} accept="application/json,.json" onChange={e => { const f = e.target.files?.[0]; if (f) onArquivo([f]); e.target.value = ''; }} />
    </section>
    <div className="or">notas do AULA e WebAluno</div>
    <p>Traga PDFs de várias matérias, imagens ou textos do AULA e do WebAluno. A fonte é identificada por arquivo.</p>
    <p className="hint">Pode haver erros na leitura. Confira as notas após importar.</p>
    <div className={'drop' + (on ? ' on' : '')} role="button" tabIndex={prog ? -1 : 0} aria-disabled={!!prog} aria-label="Escolher arquivos de notas" onClick={() => { if (!prog) inp.current?.click(); }}
      onKeyDown={e => { if (!prog && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); inp.current?.click(); } }}
      onDragOver={e => { e.preventDefault(); setOn(true); }} onDragLeave={() => setOn(false)}
      onDrop={e => { e.preventDefault(); setOn(false); if (!prog) onArquivo(Array.from(e.dataTransfer.files)); }}>
      <Img name="importar" />
      <b>{Ic.up} Solte arquivos de notas ou um backup</b><span>PDFs, imagens, textos ou backup JSON do Passei</span>
      <input ref={inp} type="file" hidden multiple disabled={!!prog} accept="application/pdf,image/*,.txt,application/json,.json" onChange={e => { onArquivo(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
    </div>
    {prog && <div role="status" aria-live="polite"><div className="prog" role="progressbar" aria-label="Importando arquivos" aria-valuenow={Math.round(prog.p * 100)} aria-valuemin={0} aria-valuemax={100}><i ref={bar} /></div><p className="hint" style={{ color: 'var(--mut)', fontSize: 13, margin: '8px 0 0' }}>{prog.msg}</p></div>}
    <div className="or">ou cole o texto da página</div>
    <label className="import-source">Página de origem<select value={fonte} disabled={!!prog} onChange={e => setFonte(e.target.value as Fonte | 'passei' | '')}>
      <option value="">Identificar automaticamente</option><option value="passei">Passei · Backup dos seus dados (JSON)</option><option value="misto">As três páginas juntas · AULA + WebAluno</option><option value="aula">AULA / Canvas · Notas</option><option value="web-notas">WebAluno · Notas</option><option value="web-parciais">WebAluno · Avaliações parciais (1º e 2º corte)</option>
    </select></label>
    <textarea aria-label="Texto da página de notas" disabled={!!prog} placeholder="Cole páginas do AULA e WebAluno ou o conteúdo de um backup JSON do Passei." value={txt} onChange={e => setTxt(e.target.value)} />
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
      <button className="btn" disabled={!!prog} onClick={onClose}>Cancelar</button>
      <button className="btn peach" disabled={!!prog || !txt.trim()} onClick={() => onTexto(txt, fonte || undefined)}>Importar texto</button>
    </div>
  </Painel>;
}
