# Verificação mobile e acessibilidade

Data: 14/11/2026. Navegador Chromium do gstack, localhost. Esta verificação não certifica conformidade integral com WCAG.

## Dimensões verificadas

| Área | 320 × 568 | 360 × 640 | 390 × 844 | 430 × 932 | 844 × 390 |
| --- | --- | --- | --- | --- | --- |
| Créditos sem rolagem horizontal | OK | OK | OK | OK | OK |
| Cabeçalho sem sobreposição | OK | OK | OK | OK | OK |

Em 320 × 568 também foram verificados o formulário da disciplina, o simulador, a importação e a terceira etapa do onboarding. Os botões de navegação do tour permanecem visíveis; seu conteúdo possui rolagem independente. A tabela do boletim tem rolagem horizontal própria.

## Correções verificadas

- Cabeçalho em grid: semestre, importação e ajuda não se sobrepõem.
- Formulário das avaliações: nome legível, data em linha separada e controles com altura mínima de 44 px no celular.
- Cartões financeiros: valores monetários ocupam a largura disponível em telas estreitas.
- Controle deslizante do onboarding com trilho preenchido, área de toque e atualização do resultado.
- Janelas com nome acessível, foco inicial, contenção de Tab/Shift+Tab, Escape, restauração de foco e fundo inerte.
- Abas com setas, Home/End e apenas a opção selecionada na sequência de Tab.
- Avaliações com nomes específicos nos campos e na remoção; valor acima do máximo expõe `aria-invalid` e descrição vinculada.
- Movimento reduzido verificado em modo escuro: animação da personagem desativada. Pausa manual disponível.
- Cores semânticas de texto separadas das cores decorativas. Exemplos no tema claro, calculados pela luminância relativa: roxo sobre fundo suave 6,37:1; verde sobre fundo de sucesso 5,81:1; laranja sobre aviso 5,71:1; vermelho sobre erro 5,93:1.
- Avisos GSAP por seleção vazia evitados nas trocas de tela.

## Heurísticas consideradas

| Princípio | Evidência no fluxo |
| --- | --- |
| Visibilidade do estado | Progresso por arquivo, resultado da importação e etapa atual do tour. |
| Controle e liberdade | Voltar, cancelar, fechar com Escape, pausar movimento e restaurar a simulação. |
| Prevenção e recuperação de erros | Backup validado antes de confirmar a substituição; arquivos inválidos identificados; erros de campos descritos. |
| Consistência | Mesmos componentes para campos, abas e janelas, inclusive navegação por teclado. |
| Reconhecimento e ajuda | Exemplos visuais, nomes das fontes e demonstração sem alterar as notas. |

## Limites

- Não houve teste em aparelho físico, Safari/iOS, TalkBack ou VoiceOver. Toque e teclado virtual reais permanecem pendentes.
- Não houve auditoria automatizada integral nem teste com usuários; os contrastes acima não representam todos os estados possíveis.
- Fonte externa do Google bloqueada pela rede deste ambiente; a interface foi conferida com a fonte de fallback.
- Instalação exata do lockfile bloqueada pela rede. Testes e build executados com ferramentas locais: Vite 8.3.4 e Vitest 5.0.5. O lockfile não foi alterado.
- O teste privado de OCR é pulado quando seu arquivo de referência não está disponível.
