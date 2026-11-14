import { Component, lazy, Suspense, useRef, useState, type ReactNode } from 'react';
import { lerBackup, salvar } from '../store';
import type { Db } from '../logic';
import { Confirmar } from './Dialogos';

const App = lazy(() => import('../App'));
const PAGINAS = {
  404: { titulo: 'Não encontramos esta página.', texto: 'O endereço pode ter mudado ou ter sido digitado errado. Suas notas continuam no painel.', imagem: 'vazio' },
  500: { titulo: 'Algo saiu do esperado.', texto: 'Não foi possível abrir esta tela. Você pode tentar novamente ou baixar uma cópia dos dados salvos neste navegador.', imagem: 'exame' },
  503: { titulo: 'Um intervalo inesperado.', texto: 'Este serviço está temporariamente indisponível. Tente novamente em instantes ou volte ao painel.', imagem: 'passo2' },
  505: { titulo: 'A conexão não foi aceita.', texto: 'O servidor não aceitou a versão da conexão. Tente atualizar o navegador ou acessar novamente mais tarde.', imagem: 'vazio' },
};
type Codigo = keyof typeof PAGINAS;

export function codigoDaRota(path: string): Codigo | null {
  if (path === '/' || path === '/index.html') return null;
  if (path === '/500') return 500;
  if (path === '/503') return 503;
  if (path === '/505') return 505;
  return 404;
}

export function Carregando() {
  return <main className="system-screen"><div className="loading-card" role="status" aria-live="polite" aria-busy="true">
    <img src="/img/hero.webp" alt="" width="150" height="150" />
    <span className="loading-spinner" aria-hidden="true" /><h1>Carregando o Passei</h1><p>Preparando seu semestre…</p>
  </div></main>;
}

export function TelaErro({ codigo, tentar }: { codigo: Codigo; tentar?: () => void }) {
  const pagina = PAGINAS[codigo], [aviso, setAviso] = useState('');
  const [backup, setBackup] = useState<Db | null>(null), [lendo, setLendo] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const ler = async (file: File) => {
    setLendo(true); setAviso('');
    try { setBackup(lerBackup(await file.text())); }
    catch (e) { setAviso(e instanceof Error ? e.message : 'Não foi possível ler este backup.'); }
    finally { setLendo(false); }
  };
  const restaurar = () => {
    if (backup && salvar(backup)) location.href = '/';
    else { setBackup(null); setAviso('Não foi possível salvar o backup. Verifique o armazenamento e as permissões do navegador.'); }
  };
  const recuperar = () => {
    try {
      const raw = localStorage.getItem('notas-v2') ?? localStorage.getItem('calc-media');
      if (raw === null) { setAviso('Não há dados salvos neste navegador.'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      a.download = 'passei-recuperacao.json'; a.click(); URL.revokeObjectURL(a.href);
    } catch { setAviso('Não foi possível acessar os dados salvos. Verifique as permissões do navegador.'); }
  };
  return <><main className="system-screen"><section className="system-card" aria-labelledby="system-title">
    <div className="system-art" aria-hidden="true"><span>{codigo}</span><img src={`/img/${pagina.imagem}.webp`} alt="" width="250" height="250" /></div>
    <div className="system-copy"><span className="system-brand">PASSEI · SEU SEMESTRE</span><h1 id="system-title">{pagina.titulo}</h1><p>{pagina.texto}</p>
      <div className="system-actions">{tentar && <button className="btn peach" onClick={tentar}>Tentar novamente</button>}<a className={'btn ' + (tentar ? 'line' : 'peach')} href="/">Voltar ao painel</a></div>
      {codigo === 500 && <div className="system-recovery-actions"><button className="system-recovery" onClick={recuperar}>Baixar dados salvos</button><button className="system-recovery" disabled={lendo} onClick={() => arquivo.current?.click()}>{lendo ? 'Lendo backup…' : 'Importar backup'}</button><input ref={arquivo} type="file" hidden accept="application/json,.json" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void ler(file); }} /></div>}
      {aviso && <p className="system-feedback" role="status">{aviso}</p>}
    </div>
  </section></main><Confirmar open={!!backup} titulo="Restaurar backup?" rotulo="Restaurar backup" texto={`Este backup contém ${backup?.lista.length ?? 0} disciplinas e substituirá todos os dados salvos neste navegador. Baixe uma cópia dos dados atuais antes de continuar se quiser guardá-los.`} onClose={() => setBackup(null)} onConfirmar={restaurar} /></>;
}

export class LimiteErro extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };
  static getDerivedStateFromError() { return { falhou: true }; }
  capturar = (evento: ErrorEvent | PromiseRejectionEvent) => {
    if ('reason' in evento || evento.error) this.setState({ falhou: true });
  };
  componentDidMount() {
    window.addEventListener('error', this.capturar);
    window.addEventListener('unhandledrejection', this.capturar);
  }
  componentWillUnmount() {
    window.removeEventListener('error', this.capturar);
    window.removeEventListener('unhandledrejection', this.capturar);
  }
  render() { return this.state.falhou ? <TelaErro codigo={500} tentar={() => location.reload()} /> : this.props.children; }
}

export function Inicio() {
  const codigo = codigoDaRota(location.pathname);
  return codigo ? <TelaErro codigo={codigo} /> : <Suspense fallback={<Carregando />}><App /></Suspense>;
}
