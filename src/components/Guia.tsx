// Passo a passo de como trazer as notas do AULA (Canvas) e do WebAluno, para quem nunca fez isso.
// As ilustrações são desenhadas em CSS (sem print real): não expõem dados de ninguém e não envelhecem com o Canvas.
import { useId, useState, type ReactNode } from 'react';
import { Seg } from './ui';

type Aba = 'pdf' | 'copiar' | 'celular';
const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
const TOQUE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const CTRL = MAC ? '⌘ Cmd' : 'Ctrl';

const Tecla = ({ children, anim }: { children: ReactNode; anim?: string }) => <kbd className={'g-key' + (anim ? ' ' + anim : '')}>{children}</kbd>;
const Atalho = ({ letra }: { letra: string }) => <span className="g-combo" aria-hidden="true"><Tecla anim="g-press">{CTRL}</Tecla><span>+</span><Tecla anim="g-press g-press-2">{letra}</Tecla></span>;
const Impressora = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 3h10v4H7zM5 8h14a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2zm4 8v2h6v-2zm8-5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /></svg>;

// Página de notas genérica, usada em várias cenas
function Pagina({ selecao, children }: { selecao?: boolean; children?: ReactNode }) {
  return <div className={'g-page' + (selecao ? ' g-select' : '')}>
    <div className="g-bar"><i /><i /><i /><span>ulbra.instructure.com</span></div>
    <div className="g-body">
      <div className="g-nav"><span>Página inicial</span><span>Módulos</span><span className="on">Notas</span><span>Pessoas</span></div>
      <div className="g-grades">
        <b>Notas</b>
        {[['Trabalho 01', '1 / 1'], ['Atividade 02', '1,5 / 2'], ['Prova G1', '4,6 / 6']].map(([n, v]) => <div className="g-row" key={n}><span>{n}</span><span>{v}</span></div>)}
        {children}
      </div>
    </div>
  </div>;
}

const CENAS: Record<string, ReactNode> = {
  notas: <Pagina />,
  imprimir: <div className="g-stage"><Pagina><span className="g-print g-pulse"><Impressora />Imprimir notas</span></Pagina><span className="g-cursor g-cursor-print" /></div>,
  salvar: <div className="g-dialog">
    <b>Imprimir</b>
    <div className="g-field"><span>Destino</span><span className="g-select-box g-pulse">Salvar como PDF ▾</span></div>
    <div className="g-field"><span>Páginas</span><span className="g-select-box">Todas ▾</span></div>
    <div className="g-actions"><span className="g-btn-ghost">Cancelar</span><span className="g-btn-blue">Salvar</span></div>
  </div>,
  enviar: <div className="g-drop"><span className="g-file g-fly">PDF<small>Banco de Dados</small></span><span className="g-file g-fly g-fly-2">PDF<small>Front-end</small></span><div className="g-drop-zone">Solte aqui no Passei</div></div>,
  ctrlA: <div className="g-stack"><Pagina selecao /><Atalho letra="A" /></div>,
  ctrlC: <div className="g-stack"><Pagina selecao /><Atalho letra="C" /><span className="g-toast">Copiado!</span></div>,
  ctrlV: <div className="g-stack"><div className="g-textarea"><span className="g-typed">Notas para Aluno · Trabalho 01 1 / 1 · Prova G1 4,6 / 6 …</span></div><Atalho letra="V" /></div>,
  segurar: <div className="g-phone"><Pagina /><span className="g-finger" /><div className="g-menu g-menu-a"><span>Copiar</span><span className="on">Selecionar tudo</span></div></div>,
  copiarCel: <div className="g-phone"><Pagina selecao /><div className="g-menu g-menu-b"><span className="on">Copiar</span><span>Compartilhar</span></div></div>,
  colarCel: <div className="g-phone g-phone-app"><div className="g-textarea"><span className="g-typed">Notas para Aluno · Trabalho 01 1 / 1 …</span></div><div className="g-menu g-menu-c"><span className="on">Colar</span></div></div>,
};

type Passo = { cena: keyof typeof CENAS; t: ReactNode; p?: ReactNode };
const PASSOS: Record<Aba, { intro: string; passos: Passo[] }> = {
  pdf: {
    intro: 'O jeito mais fácil no computador. Funciona com várias matérias de uma vez.',
    passos: [
      { cena: 'notas', t: <>Abra a disciplina no AULA e clique em <b>Notas</b></>, p: 'Fica no menu da esquerda, dentro da matéria.' },
      { cena: 'imprimir', t: <>Clique em <b>Imprimir notas</b></>, p: 'O botão fica no lado direito, acima da tabela.' },
      { cena: 'salvar', t: <>Em <b>Destino</b>, escolha <b>Salvar como PDF</b> e clique em <b>Salvar</b></>, p: 'No Edge, o campo se chama Impressora. Guarde o arquivo onde for fácil achar.' },
      { cena: 'enviar', t: <>Volte aqui e envie o PDF</>, p: 'Arraste os arquivos para a área tracejada ou clique nela para escolher. Repita o processo para cada matéria.' },
    ],
  },
  copiar: {
    intro: 'Serve para o AULA e para as páginas do WebAluno (Notas e Avaliações parciais).',
    passos: [
      { cena: 'notas', t: <>Abra a página com as suas notas</>, p: 'No AULA, a página Notas da disciplina. No WebAluno, Notas ou Avaliações parciais.' },
      { cena: 'ctrlA', t: <>Aperte <b>{CTRL} + A</b> para selecionar tudo</>, p: `Segure a tecla ${CTRL} e aperte A. A página inteira fica azul: é isso mesmo, o azul mostra o que foi selecionado.` },
      { cena: 'ctrlC', t: <>Aperte <b>{CTRL} + C</b> para copiar</>, p: 'Nada muda na tela, mas o texto já está guardado para colar.' },
      { cena: 'ctrlV', t: <>Volte aqui, clique na caixa de texto e aperte <b>{CTRL} + V</b></>, p: 'O texto aparece na caixa. Depois clique em Importar texto. Pode colar várias páginas, uma depois da outra.' },
    ],
  },
  celular: {
    intro: 'Pelo navegador do celular, com o dedo.',
    passos: [
      { cena: 'notas', t: <>Abra a página com as suas notas no navegador</>, p: 'No AULA, a página Notas da disciplina. No WebAluno, Notas ou Avaliações parciais.' },
      { cena: 'segurar', t: <>Segure o dedo sobre um texto e toque em <b>Selecionar tudo</b></>, p: 'Segure até aparecer um menu pequeno em cima do texto.' },
      { cena: 'copiarCel', t: <>Com tudo azul, toque em <b>Copiar</b></>, p: 'O azul mostra o que foi selecionado.' },
      { cena: 'colarCel', t: <>Volte aqui, segure o dedo na caixa de texto e toque em <b>Colar</b></>, p: 'Depois toque em Importar texto.' },
    ],
  },
};

export function Guia({ voltar }: { voltar: () => void }) {
  const [aba, setAba] = useState<Aba>(TOQUE ? 'celular' : 'pdf');
  const id = useId(), atual = PASSOS[aba];
  return <div className="guia">
    <button className="link guia-back" onClick={voltar}>← Voltar para importar</button>
    <h3>Como trazer suas notas</h3>
    <p className="hint">Escolha um jeito. Leva menos de um minuto por matéria.</p>
    <div className="guia-tabs"><Seg small label="Jeito de importar" value={aba} onChange={setAba} options={[['pdf', 'PDF'], ['copiar', 'Copiar e colar'], ['celular', 'Celular']]} /></div>
    <div role="tabpanel" aria-labelledby={id} key={aba}>
      <p className="guia-intro" id={id}>{atual.intro}</p>
      <ol className="guia-passos">
        {atual.passos.map((s, i) => <li key={i} className="guia-passo" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="guia-cena" aria-hidden="true">{CENAS[s.cena]}</div>
          <div className="guia-texto"><span className="guia-num">{i + 1}</span><div><strong>{s.t}</strong>{s.p && <p>{s.p}</p>}</div></div>
        </li>)}
      </ol>
    </div>
    <button className="btn peach guia-ok" onClick={voltar}>Entendi, vou importar</button>
  </div>;
}
