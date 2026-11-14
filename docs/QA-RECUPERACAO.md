# QA — reset e recuperação

Verificação em 14/11/2026, servidor local e navegador automatizado.

- Reset: cancelar preserva os dados; confirmar limpa apenas a disciplina selecionada e seu boletim associado, mantendo nome/semestre e demais matérias.
- Dados locais corrompidos: tela de recuperação sem sobrescrever o conteúdo original; download preserva o JSON bruto.
- Backup na recuperação: confirmação com foco em Cancelar; restaurar retorna ao painel com as disciplinas.
- Armazenamento bloqueado: aviso persistente e exportação das alterações em memória.
- Offline: aviso sem impedir acesso às notas locais.
- Carregamento de arquivos: indicador e progresso visíveis em 320 × 568, sem atraso artificial.
- Telas de erro: layout responsivo, links de retorno e tratamento de movimento reduzido.
- Leitor: testes de falha/repetição, timeout, encerramento do OCR e liberação do PDF.
- 68 testes passaram; 1 teste OCR privado ignorado. TypeScript e build passaram; fallback 404 gerado.

Limites: celular em viewport emulada, sem aparelho físico. OCR real não repetido. Falha de download do módulo inicial coberta por teste automatizado do handler; bloqueio de rede no navegador indisponível. Os códigos HTTP dependem da hospedagem. Verificação usa as dependências disponíveis localmente; instalação limpa pelo lockfile não repetida por restrição de rede.


## Complemento: disciplinas e importação

- Menu próprio no cartão: clique em ⋯, evento de botão direito, foco inicial, navegação por setas e Escape conferidos.
- Seleção em lote: duas disciplinas removidas mediante confirmação; preservado um cartão vazio para recomeçar.
- Reset global: cancelar preservou os dados; confirmar limpou boletim, notas e créditos, mantendo o app utilizável.
- Importação de boletim: criou disciplina e abriu simulador com G1 = 9.
- Parciais de Engenharia de Requisitos: G1 = 9 e G2 pendente conferidos no navegador e em teste de regressão.
- Modal de importação: backup recolhido, área de arquivos compacta e scrollbar com cores do app; inspecionado em 390 × 844.
- 75 testes passaram; um OCR privado ignorado. Build aprovado.
