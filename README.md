# Passei

Calculadora de notas para quem estuda na ULBRA. Você coloca as notas que já saíram e ela mostra quanto falta para passar.

Projeto de aluno, sem vínculo oficial com a ULBRA.

## O modelo de notas

```
MP = (G1 + G2 × 2) ÷ 3      média parcial, mínimo 6 para passar direto
MF = (MP + EF × 2) ÷ 3      média final, se for para o exame (EF)
```

Cada grau vale 10 pontos, divididos entre trabalhos e prova do jeito que o professor definir (4 + 6, 6 + 4 ou qualquer outra divisão).

## O que dá para fazer

- **Painel** do semestre, com a situação de cada disciplina e as próximas avaliações.
- **Semestres**: as disciplinas ficam separadas por semestre.
- **Notas** em dois modos: simples (trabalhos + prova) ou nota por nota, com nome, valor e data opcional.
- **Quanto falta**: deixe vazio o que ainda não saiu e o sistema calcula a nota necessária.
- **Simulador**: escolha uma nota para a G1 e veja o que sobra para a prova da G2.
- **Importar do Canvas**: solte o PDF de "Imprimir notas" ou um print da tela. A leitura é feita no próprio navegador.
- **Créditos**: você informa os créditos de cada disciplina e o valor do crédito, e vê uma estimativa do custo do semestre. Nenhum valor vem preenchido.
- **Ponto extra, substituição e exame final.**
- **Backup** em arquivo, para levar as notas a outro aparelho.

As notas ficam salvas só no navegador (`localStorage`). Nada é enviado para servidor.

## Rodar

Precisa do Node 18 ou mais novo.

```
npm install
npm run dev
```

Depois abra `http://localhost:5173`.

Outros comandos:

```
npm test         testa o cálculo das médias e a leitura da página do Canvas
npm run build    confere os tipos e gera a pasta dist
```

## Estrutura

Vite, React e TypeScript. Animações com GSAP e rolagem suave com Lenis.

- `src/logic.ts`: regras de cálculo e leitor do Canvas, sem dependência de tela.
- `src/store.ts`: dados no navegador, semestres e resumo de cada disciplina.
- `src/importar.ts`: leitura de PDF e imagem (pdf.js e tesseract.js, baixados só na hora de importar).
- `src/components/`: as telas.
- `public/img/`: as ilustrações.
