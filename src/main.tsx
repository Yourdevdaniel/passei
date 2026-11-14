import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Inicio, LimiteErro } from './components/Estados';
import './styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><LimiteErro><Inicio /></LimiteErro></StrictMode>);
