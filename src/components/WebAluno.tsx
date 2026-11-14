import type { Disc, NotaWeb } from '../logic';
import { nomeBonito } from '../store';

export function ParciaisWeb({ notas }: { notas: Disc['webAluno'] }) {
  if (!notas) return null;
  return <section className="web-aluno card anim-in" aria-label="Avaliações parciais do WebAluno">
    <h3>WebAluno · Avaliações parciais</h3>
    <p className="hint">Notas do portal, separadas das avaliações e simulações do AULA.</p>
    <div className="web-cortes">{(['g1', 'g2'] as const).map((k, i) => <div key={k}>
      <h4>{i + 1}º corte</h4>
      {notas[k] ? <table><thead><tr><th>Avaliação</th><th>Peso</th><th>Nota</th></tr></thead><tbody>
        {notas[k]!.map((n, j) => <tr key={j}><th scope="row">{n.nome}</th><td>{n.peso}</td><td>{n.nota || 'Pendente'}</td></tr>)}
      </tbody></table> : <p className="hint">Ainda não importado.</p>}
    </div>)}</div>
  </section>;
}

export function BoletimWeb({ notas }: { notas?: NotaWeb[] }) {
  if (!notas?.length) return null;
  return <section className="web-aluno card anim-in" aria-label="Boletim do WebAluno">
    <h3>WebAluno · Notas</h3>
    <p className="hint">Histórico conforme o portal. Esta página não informa o semestre de cada matéria.</p>
    <div className="web-scroll" tabIndex={0} role="region" aria-label="Tabela de notas do WebAluno">
      <table><thead><tr>{['Disciplina', '1º corte', '2º corte', 'Média', 'Exame', 'Média final', 'Situação', 'Frequência'].map(s => <th key={s} scope="col">{s}</th>)}</tr></thead>
        <tbody>{notas.map((n, i) => <tr key={i}><th scope="row">{nomeBonito(n.nome)}</th>{[n.g1, n.g2, n.media, n.exame, n.final, n.situacao, n.frequencia ? n.frequencia + '%' : ''].map((v, j) => <td key={j}>{v || '—'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}
