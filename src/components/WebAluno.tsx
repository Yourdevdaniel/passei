import type { Disc, NotaWeb } from '../logic';
import { nomeBonito } from '../store';

export function ParciaisWeb({ notas }: { notas: Disc['webAluno'] }) {
  if (!notas) return null;
  return <section className="web-aluno card anim-in" aria-label="Avaliações parciais do WebAluno">
    <h3>WebAluno · Avaliações parciais</h3>
    <p className="hint">Notas do portal por corte. Estas avaliações também preenchem G1 e G2 abaixo.</p>
    <div className="web-cortes">{(['g1', 'g2'] as const).map((k, i) => <div key={k}>
      <h4>{i + 1}º corte</h4>
      {notas[k] ? <table><thead><tr><th>Avaliação</th><th>Peso</th><th>Nota</th></tr></thead><tbody>
        {notas[k]!.map((n, j) => <tr key={j}><th scope="row">{n.nome}</th><td>{n.peso}</td><td>{n.nota || 'Pendente'}</td></tr>)}
      </tbody></table> : <p className="hint">Ainda não importado.</p>}
    </div>)}</div>
  </section>;
}

export function BoletimWeb({ notas, usar, usarTodas }: { notas?: NotaWeb[]; usarTodas?: () => void; usar?: (nota: NotaWeb) => void }) {
  if (!notas?.length) return null;
  return <section className="web-aluno card anim-in" aria-label="Boletim do WebAluno">
    <h3>WebAluno · Notas</h3>
    <p className="hint">1º e 2º preenchem G1 e G2. As disciplinas entram no semestre selecionado; o portal não informa o semestre original de cada matéria.</p>
    {usarTodas && <button className="btn line" onClick={usarTodas}>Aplicar todas aos simuladores</button>}
    <div className="web-scroll" tabIndex={0} role="region" aria-label="Tabela de notas do WebAluno">
      <table><thead><tr>{['Disciplina', 'G1 (1º corte)', 'G2 (2º corte)', 'Média', 'Exame', 'Média final', 'Situação', 'Frequência'].map(s => <th key={s} scope="col">{s}</th>)}{usar && <th scope="col">Simulador</th>}</tr></thead>
        <tbody>{notas.map((n, i) => <tr key={i}><th scope="row">{nomeBonito(n.nome)}</th>{[n.g1, n.g2, n.media, n.exame, n.final, n.situacao, n.frequencia ? n.frequencia + '%' : ''].map((v, j) => <td key={j}>{v || '—'}</td>)}{usar && <td><button className="btn line" onClick={() => usar(n)} aria-label={'Usar ' + nomeBonito(n.nome) + ' no simulador'}>Usar no simulador</button></td>}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}
