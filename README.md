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
- **Disciplina de teste**: no painel, "Carregar disciplina de teste" adiciona um exemplo com avaliações, datas, notas, créditos e WebAluno preenchidos. Os dados são fictícios; clicar novamente abre o exemplo existente, preservando suas edições.
- **Onboarding visual**: a personagem apresenta importação, fontes, simulação, semestres, créditos e backup em cinco cenas animadas. O controle de nota demonstra o cálculo sem alterar seus dados. Dá para pausar o movimento, navegar pelo teclado e abrir o exemplo ou a importação no final. Aparece uma vez nesta versão e pode ser revisto em "Como funciona", inclusive no celular; respeita a preferência de movimento reduzido.
- **Semestres**: as disciplinas ficam separadas por semestre.
- **Notas** em dois modos: simples (trabalhos + prova) ou nota por nota, com nome, valor e data opcional.
- **Quanto falta**: deixe vazio o que ainda não saiu e o sistema calcula a nota necessária.
- **Simulador**: escolha uma nota para a G1 e veja o que sobra para a prova da G2.
- **Importar notas**: selecione, cole ou arraste vários PDFs, imagens ou arquivos de texto, inclusive de matérias diferentes. Cada arquivo é identificado e lido no navegador; uma falha não interrompe os demais.
- **Páginas juntas**: cole AULA, Notas e Avaliações Parciais do WebAluno no mesmo campo, inclusive os dois cortes. Use a identificação automática ou a opção "As três páginas juntas"; cada fonte continua separada.
- **AULA / Canvas**: avaliações e simulações por disciplina.
- Na importação do Canvas, pesos dos grupos (33% e 67%) não são notas. `N/A` deixa o grau pendente, substituindo uma nota anterior desse grau; graus ausentes de um recorte são preservados. Percentuais sem pontuação também ficam pendentes. Tarefas 0/0 não afetam o fechamento; crédito positivo com denominador zero entra como bônus. Cole uma disciplina do AULA por vez ou envie PDFs separados. Após corrigir uma importação antiga, cole novamente a página para atualizar os dados salvos.
- Notas fora do valor da avaliação e graus com valores acima de 10 pontos exigem correção antes do resultado ou da simulação. Listas vazias ou incompletas mantêm os pontos restantes pendentes.
- **WebAluno**: boletim de Notas separado no painel, com médias, exame, situação e frequência; Avaliações Parciais separadas por matéria e por 1º/2º corte. Pode colar os dois cortes juntos ou importar um depois do outro, preservando o anterior. As Avaliações Parciais mantêm sua tabela e também alimentam G1/G2. No boletim de Notas, 1º e 2º preenchem G1 e G2 de todas as disciplinas importadas no semestre selecionado, substituindo as avaliações desses graus por notas totais de 10 pontos; “-” fica pendente. Para outras matérias, “Usar no simulador” cria ou atualiza a disciplina no semestre selecionado. O boletim não informa o semestre original de cada matéria: revise o semestre selecionado antes de importar.
- **Créditos**: você informa os créditos de cada disciplina e o valor do crédito, e vê uma estimativa do custo do semestre. Nenhum valor vem preenchido.
- **Ponto extra, substituição e exame final.**
- **Backup do Passei**: use "Exportar dados" no painel ou na janela de importação para baixar `passei-backup.json`, com todas as disciplinas, notas, semestres, créditos, boletim e cortes do WebAluno. Para recuperar, use "Importar backup do Passei", arraste o JSON ou cole seu conteúdo no campo de texto. A restauração valida o arquivo e pede confirmação antes de substituir os dados atuais. Importe um backup por vez, separado dos PDFs.
- Exclusão de disciplina e restauração de backup usam modais do Passei, com foco inicial em "Cancelar", navegação por teclado e Escape. Cancelar volta à janela anterior sem alterar os dados; o app não usa `alert`, `confirm` ou `prompt` nativos.

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
npm test         testa cálculos e importação do AULA e do WebAluno
npm run build    confere os tipos e gera a pasta dist
```

## Estrutura

Vite, React e TypeScript. Animações com GSAP e rolagem suave com Lenis.

- `src/logic.ts`: regras de cálculo e leitor do Canvas, sem dependência de tela.
- `src/importacao.ts`: identificação das fontes, leitura do WebAluno e aplicação das importações sem misturar as fontes.
- `src/store.ts`: dados no navegador, semestres e resumo de cada disciplina.
- `src/importar.ts`: leitura de PDF e imagem (pdf.js e tesseract.js, baixados só na hora de importar).
- `src/components/`: as telas.
- `public/img/`: as ilustrações.

## Recuperação e estados da interface

Em Ajustes, **Resetar dados da disciplina** limpa avaliações, simulações, créditos, exame, substituição e dados associados do WebAluno. Preserva nome, semestre e as outras disciplinas. O modal pede confirmação; exporte um backup antes caso queira desfazer.

O carregamento inicial e a leitura de arquivos têm indicadores animados, com movimento reduzido respeitado. Falhas ao salvar mostram um aviso com exportação dos dados em memória. Dados salvos inválidos não são sobrescritos: a tela de recuperação permite baixar o conteúdo original e restaurar um backup validado mediante confirmação. Falhas no leitor permitem tentar novamente; downloads das bibliotecas expiram após 20 segundos.

Endereços desconhecidos mostram a tela 404; `/500`, `/503` e `/505` permitem visualizar os outros estados. O build gera `dist/404.html`. São telas do frontend: os códigos HTTP reais e as páginas de erro de infraestrutura dependem da configuração da hospedagem.


No painel, use o botão “⋯” ou o botão direito sobre um cartão para abrir o menu de ações. Setas navegam pelo menu e Escape fecha. Selecione várias disciplinas para remover de uma vez, sempre mediante confirmação. “Resetar tudo” limpa todos os dados acadêmicos locais de todos os semestres; exporte um backup antes.

Ao importar notas, o Passei abre o simulador de uma matéria com nota publicada. O boletim também oferece “Aplicar todas aos simuladores”. Uma parcial publicada é preservada quando o boletim ainda mostra “-”; uma nota preenchida no boletim prevalece. A importação não inventa divisão entre trabalhos e provas para uma nota total do portal.

O painel abre na **Visão geral**, com tabela de G1, G2, média e situação das disciplinas de todos os semestres, identificadas por período. O filtro **Período** permite restringir ao semestre selecionado no menu. A aba **Cartões** preserva a visualização anterior. Notas pendentes não viram zero; a tabela mostra dados salvos, sem alterações temporárias do simulador. No celular, deslize a tabela para ver as demais colunas.

Trocar o semestre pelo menu lateral também restringe o dashboard ao período escolhido. Para voltar ao histórico completo, selecione **Todos os semestres** no filtro **Período**. No celular, o seletor lateral ocupa uma linha inteira para manter o campo e o botão de adicionar acessíveis.

O boletim também preenche a nota do exame. Dentro da disciplina, **Resultado no WebAluno** mostra média parcial, exame, média final e situação publicadas pelo portal, preservando seus valores. O cálculo do Passei continua derivado das notas salvas; reimporte boletins antigos para preencher o exame.
