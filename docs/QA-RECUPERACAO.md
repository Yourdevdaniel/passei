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
