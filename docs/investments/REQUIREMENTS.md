# Requisitos para Modulo de Investimentos

Baseado no benchmark publico do Investidor10/Investidor10 Pro em 2026-05-24 e no estado atual do FinanceBuddy.

> Historical planning artifact. These requirements capture the May 2026 product
> direction and are not a current implementation-status checklist. See the
> repository README and current source code for the implemented scope.

## Principios de produto

- Nao copiar UI, textos, relatorios, carteiras recomendadas ou organizacao proprietaria de concorrentes.
- Priorizar confiabilidade de carteira antes de conteudo premium.
- Todo calculo financeiro importante deve ter formula, fonte, data de referencia e trilha de auditoria.
- Todo dado externo deve indicar origem, horario de atualizacao e estado: atualizado, atrasado, estimado, incompleto ou manual.
- O usuario deve conseguir entender por que o FinanceBuddy diverge da corretora, B3 ou outro agregador.

## Requisitos funcionais

### 1. Carteira

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-CAR-001 | Permitir criar multiplas carteiras por usuario. | should-have | Usuario cria, renomeia, arquiva e alterna carteiras sem misturar posicoes. |
| INV-CAR-002 | Registrar transacoes de compra, venda, bonificacao, split, grupamento, subscricao, amortizacao, taxa e ajuste manual. | must-have | Cada evento altera posicao por regra explicita e fica auditavel. |
| INV-CAR-003 | Calcular quantidade atual, custo total, preco medio e lucro/prejuizo por ativo. | must-have | Calculo e recalculado a partir do livro de eventos e tem teste unitario por tipo de evento. |
| INV-CAR-004 | Calcular patrimonio total por carteira e por classe de ativo. | must-have | Tela mostra valor atual, custo, ganho absoluto e percentual. |
| INV-CAR-005 | Calcular rentabilidade com e sem proventos. | must-have | Usuario alterna visao e ve quais proventos foram incluidos. |
| INV-CAR-006 | Separar aportes de valorizacao. | must-have | Grafico de evolucao nao confunde novo dinheiro com performance. |
| INV-CAR-007 | Importar transacoes por CSV/planilha padronizada. | should-have | Usuario revisa pre-importacao, corrige erros e confirma lote. |
| INV-CAR-008 | Integrar B3 ou arquivo autorizado quando juridicamente viavel. | premium | Importacao exige consentimento, mostra origem e permite conciliacao. |
| INV-CAR-009 | Conciliar posicao esperada com posicao importada. | premium | Divergencias aparecem por ativo com possiveis causas. |
| INV-CAR-010 | Manter trilha de auditoria de edicoes. | must-have | Cada alteracao guarda usuario, data, campo anterior e campo novo. |

### 2. Ativos e cotacoes

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-ATI-001 | Criar cadastro canonico de ativos. | must-have | Ticker, nome, classe, mercado, moeda, status e fonte ficam normalizados. |
| INV-ATI-002 | Suportar acoes, FIIs, ETFs, BDRs, criptomoedas e renda fixa generica, em real ou em dolar. | must-have | Classes de bolsa e cripto usam cotacao externa; renda fixa preserva entrada manual e a moeda declarada. |
| INV-ATI-003 | Atualizar cotacoes por provedor externo com cache. | must-have | Cotacao mostra data/hora, fonte e flag stale. |
| INV-ATI-004 | Persistir historico de cotacoes. | should-have | Sistema consulta serie historica para graficos e rentabilidade. |
| INV-ATI-005 | Permitir fallback manual de cotacao. | should-have | Usuario pode inserir valor manual marcado como manual/estimado. |
| INV-ATI-006 | Armazenar eventos corporativos. | should-have | Split, grupamento e bonificacao ajustam quantidade/preco medio por evento. |

### 3. Dividendos e proventos

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-DIV-001 | Manter agenda de proventos por ativo. | must-have | Evento tem tipo, valor, data-com, data de pagamento, fonte e status. |
| INV-DIV-002 | Calcular proventos esperados para a carteira. | should-have | Valor esperado depende da quantidade elegivel na data-com. |
| INV-DIV-003 | Registrar proventos recebidos. | must-have | Usuario pode marcar recebido, editar valor liquido e anexar observacao. |
| INV-DIV-004 | Calcular dividend yield da carteira e yield on cost. | should-have | Periodo e formula aparecem na tela. |
| INV-DIV-005 | Diferenciar provento anunciado, estimado, provisionado e recebido. | must-have | Badges/estado evitam tratar previsao como caixa realizado. |

### 4. Rankings

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-RAN-001 | Criar rankings por classe de ativo. | should-have | Usuario filtra e ordena por indicadores aplicaveis a classe. |
| INV-RAN-002 | Exibir criterios e data de referencia do ranking. | must-have | Toda tabela mostra periodo, fonte e regras de exclusao. |
| INV-RAN-003 | Permitir filtros por setor, segmento, liquidez, DY, valuation e rentabilidade. | should-have | Filtros combinam sem recarregar a pagina inteira. |
| INV-RAN-004 | Salvar filtros como listas do usuario. | premium | Usuario nomeia filtro e recebe resultado atualizado. |

### 5. Comparador

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-COM-001 | Comparar ativos lado a lado. | should-have | Usuario seleciona 2 a 5 ativos e ve indicadores comparaveis. |
| INV-COM-002 | Marcar indicadores nao comparaveis entre classes. | must-have | Sistema nao mistura metricas sem contexto. |
| INV-COM-003 | Comparar ativo com carteira ou benchmark. | premium | Retorno e risco aparecem no mesmo periodo. |

### 6. Busca avancada

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-BUS-001 | Implementar screener com filtros numericos e categoricos. | should-have | Campos sao validados por classe de ativo. |
| INV-BUS-002 | Mostrar definicao de cada indicador no filtro. | must-have | Tooltip ou painel explica formula e fonte. |
| INV-BUS-003 | Exportar resultados. | premium | CSV contem filtros aplicados, data e campos exibidos. |

### 7. Relatorios

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-REL-001 | Relatorio mensal de carteira. | must-have | Inclui patrimonio, aportes, retiradas, proventos, rentabilidade e melhores/piores contribuicoes. |
| INV-REL-002 | Relatorio por classe de ativo. | should-have | Mostra alocacao, desvio de meta, retorno e concentracao. |
| INV-REL-003 | Exportar PDF/CSV. | should-have | Export contem timestamp, moeda e metodologia. |
| INV-REL-004 | Explicar divergencias. | diferencial | Relatorio lista dados atrasados, eventos pendentes e ajustes manuais. |

### 8. IRPF e DARF

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-IR-001 | Classificar operacoes tributaveis por mes. | premium | Relatorio separa tipo de ativo, venda, custo, ganho, prejuizo e isencoes aplicaveis. |
| INV-IR-002 | Controlar prejuizo acumulado. | premium | Prejuizo compensavel e carregado por categoria fiscal. |
| INV-IR-003 | Gerar demonstrativo para IRPF. | premium | Usuario exporta posicao em 31/12, rendimentos e movimentacoes. |
| INV-IR-004 | Gerar apuracao de DARF. | premium | Sistema calcula valor estimado e mostra regra usada. |
| INV-IR-005 | Versionar regras fiscais. | must-have para modulo fiscal | Cada calculo aponta versao da regra e data de vigencia. |

### 9. Metas e rebalanceamento

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-MET-001 | Definir meta por classe e por ativo. | should-have | Soma de metas e validada e desvios aparecem por carteira. |
| INV-MET-002 | Sugerir aporte por desvio de meta. | should-have | Sugestao usa apenas pesos definidos pelo usuario, sem recomendacao proprietaria. |
| INV-MET-003 | Configurar banda de tolerancia. | premium | Ativo/classe so alerta quando ultrapassa limite definido. |
| INV-MET-004 | Integrar metas de investimento com objetivos financeiros existentes. | diferencial | Usuario vincula carteira a objetivo do FinanceBuddy. |

### 10. Conteudo e analises

| ID | Requisito | Prioridade | Aceite minimo |
| --- | --- | --- | --- |
| INV-CON-001 | Criar explicacoes curtas embutidas no produto. | should-have | Conceitos aparecem no contexto do calculo, nao como blog solto. |
| INV-CON-002 | Criar dicionario de indicadores. | must-have | Cada indicador tem formula, aplicabilidade e fonte. |
| INV-CON-003 | Publicar analises autorais premium. | futuro | So iniciar apos definir compliance, autoria e politica editorial. |

## Requisitos nao funcionais

### Atualizacao de dados

- Cotacoes nacionais devem ser atualizadas em janelas previsiveis e marcadas como atrasadas quando o SLA falhar.
- Indicadores fundamentalistas devem indicar demonstrativo de referencia.
- Proventos devem diferenciar dado confirmado de dado estimado.
- Jobs externos devem ser idempotentes e registraveis.

### Precisao e auditabilidade

- Calculos de carteira devem ser reproduziveis a partir de eventos persistidos.
- Cada formula deve ter teste unitario e casos de borda.
- Alteracoes manuais devem ser visiveis e reversiveis por novo evento, nao por sobrescrita silenciosa.
- Relatorios devem mostrar metodologia e data de geracao.

### Performance

- Rankings e screeners devem responder em ate 500 ms no p95 para datasets cacheados internos.
- Consultas de carteira devem usar agregacoes precomputadas quando a carteira passar de volume definido.
- Tabelas devem paginar e ordenar no servidor para grandes universos de ativos.

### Disponibilidade e resiliencia

- Falha de provedor externo nao deve bloquear acesso a carteira ja calculada.
- Dados em cache devem continuar disponiveis com marcador de stale.
- Sistema deve ter fallback manual para cotacao e eventos quando fonte automatica falhar.

### Seguranca

- Todos os endpoints de carteira devem ser isolados por usuario.
- Uploads de extrato/notas devem ter validacao de tipo, tamanho, antivirus quando aplicavel e armazenamento com acesso privado.
- Tokens de integracao externa devem ser criptografados e revogaveis.
- Logs nao devem conter patrimonio, documentos, tokens ou dados completos de transacoes.

### Privacidade e LGPD

- Coletar apenas dados necessarios para o modulo usado.
- Permitir exclusao de carteira/importacoes conforme politica de retencao.
- Registrar consentimento para importacoes externas.
- Exibir quais fontes e documentos alimentam os calculos.

### Observabilidade

- Monitorar jobs de cotacao, importacao, processamento de proventos e relatorios fiscais.
- Medir divergencias de conciliacao por tipo.
- Alertar quando fonte externa atrasa ou muda formato.
- Guardar amostras anonimizadas de erro de parsing para melhoria.

### Tolerancia a provedores externos

- Cada provedor deve ter adapter isolado.
- Dados externos devem entrar em staging antes de virar dado canonico.
- Deve haver estrategia de deduplicacao e normalizacao por ticker/ISIN/CNPJ quando disponivel.
- Contratos e licencas devem ser aprovados antes do uso em producao.
