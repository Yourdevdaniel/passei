import { avaliar, fmt, num, uid, type Db, type Grau } from './logic';
import { novaDisc } from './store';

export function adicionarDisciplinaTeste(db: Db): Db {
  const id = `exemplo-${db.semestre}`, existente = db.lista.findIndex(d => d.id === id);
  if (existente >= 0) return { ...db, cur: existente };
  const ano = /^\d{4}/.exec(db.semestre)?.[0] ?? String(new Date().getFullYear());
  const grau = (mes: string, notas: string[]): Grau => ({
    modo: 'lista', trabMax: '4', trab: fmt(num(notas[0])! + num(notas[1])!), prova: notas[2], extra: notas[3],
    itens: ['Lista de exercícios', 'Projeto prático', 'Prova', 'Participação extra'].map((nome, i) => ({
      id: uid(), nome, tipo: i < 2 ? 'trab' : i === 2 ? 'prova' : 'extra',
      nota: notas[i], max: ['2', '2', '6', '1'][i], data: `${ano}-${mes}-${['05', '12', '19', '26'][i]}`,
    })),
  });
  const primeiroSemestre = db.semestre.endsWith('/1');
  const d = {
    ...novaDisc('Disciplina de teste', db.semestre), id,
    g1: grau(primeiroSemestre ? '04' : '09', ['1,5', '1,8', '4,5', '0,2']),
    g2: grau(primeiroSemestre ? '06' : '11', ['1,7', '1,8', '4,5', '0,3']),
    ef: '7', sub: '8,5', minimo: '6', creditos: '4', valorCredito: '250',
    webAluno: { g1: [{ nome: 'G1', peso: '10', nota: '8,5' }], g2: [{ nome: 'G2', peso: '10', nota: '8,3' }] },
  };
  const boletim = db.boletim ?? [];
  const media = fmt(avaliar(d).mp!);
  return {
    ...db, lista: [...db.lista, d], cur: db.lista.length,
    boletim: boletim.some(n => n.nome === d.nome) ? boletim : [...boletim, {
      nome: d.nome, g1: '8,5', g2: '8,3', media, exame: '7', final: media, situacao: 'APR', frequencia: '97',
    }],
  };
}
