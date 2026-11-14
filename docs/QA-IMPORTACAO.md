# Revisão de notas e importações

14/11/2026. Casos reproduzidos em testes antes da correção.

| Caso | Comportamento corrigido |
| --- | --- |
| Peso 33%/67% no rodapé do Canvas | Não entra como nota do grau. |
| G2 ou substituição com N/A | Limpa a nota anterior desse campo; não transforma N/A em zero. |
| Percentual sem pontuação | Mantém o grau pendente. |
| Substituição em percentual ou fora de uma escala confirmada de 10 | Não converte o percentual em nota; fica pendente. |
| Grau ausente de um recorte | Preserva os dados anteriores; não apaga sem evidência de N/A. |
| Lista vazia ou com pontos não cadastrados | Não fecha o grau como zero; mantém os pontos restantes pendentes. |
| Nota maior que o valor de uma avaliação, exame ou substituição fora de 0–10 | Não usa o valor inválido para aprovar. |
| Soma dos valores das avaliações acima de 10 | Pede correção dos valores e bloqueia conclusões e simulação até corrigir a escala. |
| Palavra “Extração” no nome | Não classifica como bônus. |
| Crédito positivo com denominador zero | Preserva como ponto extra; tarefas 0/0 não afetam o fechamento. |
| Disciplina com nota zero confirmado | Não é reaproveitada como disciplina vazia. |
| Duas disciplinas do Canvas no mesmo texto | Recusa a fusão e orienta importar separadamente. Vários PDFs continuam aceitos. |

Também foram comparadas 363 combinações de G1, G2 e substituição com a média máxima entre manter as notas e substituir cada grau. Zero confirmado, separação entre AULA e WebAluno, ambos os cortes e o caso de Banco de Dados Avançado permanecem cobertos.

Limites: testes com os formatos de texto disponíveis e navegação local. Sem novo teste de OCR de PDF real; um teste privado depende de arquivo não disponível. Não há correção automática dos dados já salvos: importações antigas precisam ser refeitas. As regras seguem o modelo do projeto; não certificam as regras particulares de cada disciplina.
