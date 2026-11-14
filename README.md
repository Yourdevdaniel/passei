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

- **Painel** com todas as disciplinas, a situação de cada uma e as próximas avaliações.
- **Notas** em dois modos: simples (trabalhos + prova) ou nota por nota, com nome, valor e data opcional.
- **Quanto falta**: deixe vazio o que ainda não saiu e o sistema calcula a nota necessária.
- **Simulador**: escolha uma nota para a G1 e veja o que sobra para a prova da G2.
- **Importar do Canvas**: solte o PDF de "Imprimir notas" ou um print da tela. A leitura é feita no próprio navegador.
- **Ponto extra, substituição e exame final.**
- **Backup** em arquivo, para levar as notas a outro aparelho.

As notas ficam salvas só no navegador (`localStorage`). Nada é enviado para servidor.

## Rodar

Não tem build. Sirva a pasta com qualquer servidor estático:

```
python -m http.server 5173
```

Depois abra `http://localhost:5173`.

## Teste

```
node teste.js
```

Confere o cálculo das médias e a leitura da página de notas do Canvas.

## Arquivos

- `index.html`: a interface (React, GSAP e Lenis carregados por CDN).
- `logic.js`: as regras de cálculo e o leitor do Canvas, sem dependências.
- `teste.js`: o teste do `logic.js`.
- `img/`: as ilustrações.
