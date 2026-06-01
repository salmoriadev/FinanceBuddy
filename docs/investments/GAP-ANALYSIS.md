# Gap Analysis: FinanceBuddy vs Investidor10

Data: 2026-05-24

## Estado atual do FinanceBuddy

FinanceBuddy e hoje um gerenciador de financas pessoais com dashboard, transacoes, categorias, orcamentos, metas, relatorios e um modulo simples de investimentos. O modulo atual de investimentos permite CRUD manual de registros com:

- nome;
- categoria textual;
- valor investido;
- valor atual;
- data inicial;
- notas;
- total investido;
- valor atual total;
- lucro/prejuizo absoluto;
- ROI acumulado simples.

Referencias no codigo:

- Modelo `Investment` em `apps/api/prisma/schema.prisma`.
- API CRUD em `apps/api/src/modules/investments`.
- Tela em `apps/web/src/pages/Investments.tsx`.
- Calculos simples em `apps/web/src/domain/investments/strategy.ts`.

O modelo atual nao possui ticker canonico, quantidade, movimentacoes, preco medio, cotacoes, proventos, classe de ativo estruturada, metas de alocacao, importacao, indicadores, rankings, comparador, fiscal ou historico de patrimonio.

## Classificacao dos gaps

### Must-have

| Gap | Impacto | Evidencia atual | Direcao |
| --- | --- | --- | --- |
| Cadastro canonico de ativos | Sem ticker/classe/fonte nao ha cotacao, indicadores nem agenda. | `Investment.name` e texto livre. | Criar entidades `Asset`, `Market`, `Quote`. |
| Carteira transacional | Valor investido/current_value manual nao suporta preco medio, proventos ou IR. | Investimento armazena apenas dois valores monetarios. | Criar livro de eventos por carteira. |
| Quantidade e preco medio | Usuario de renda variavel precisa saber posicao real. | Nao existe quantidade. | Calcular a partir de compras, vendas e eventos. |
| Cotacoes com fonte | Sem cotacao, carteira depende de valor manual. | `currentValue` e digitado pelo usuario. | Integrar provedor e cache. |
| Proventos | Dividendos sao centrais no benchmark e no publico brasileiro. | Nao existe tabela/evento de provento. | Agenda + recebimentos por carteira. |
| Auditoria de calculo | Dores publicas envolvem divergencias e bugs de carteira. | ROI simples sem explicacao. | Mostrar formula, eventos e fontes. |
| Relatorio mensal de investimentos | O produto atual nao explica evolucao patrimonial. | Reports focam transacoes/categorias. | Relatorio de carteira com aportes vs performance. |

### Should-have

| Gap | Impacto | Direcao |
| --- | --- | --- |
| Historico de patrimonio | Ajuda a entender evolucao e disciplina de aporte. | Snapshots diarios/mensais por carteira. |
| Rankings basicos | Aumenta descoberta de ativos e paridade competitiva. | Comecar por rankings cacheados de acoes/FIIs. |
| Busca avancada | Usuarios avancados esperam filtros por indicadores. | Screener com campos explicados. |
| Comparador | Essencial para analise lado a lado. | Comparar ativos da mesma classe primeiro. |
| Metas de alocacao | Conecta investimento com planejamento financeiro. | Pesos por classe/ativo e sugestao de aporte. |
| CSV/importacao manual | Reduz trabalho e prepara conciliacao. | Importador revisavel, idempotente e auditavel. |
| Renda fixa estruturada | Diferencial contra ferramentas focadas em bolsa. | Indexador, taxa, vencimento, liquidez e valor liquido. |

### Premium

| Gap | Impacto | Direcao |
| --- | --- | --- |
| Integracao B3 | Grande valor, alta complexidade e risco operacional. | Implementar apos importador manual e consentimento. |
| Multi-carteira avancada | Relevante para usuarios com estrategias separadas. | Carteiras por objetivo e perfil. |
| Alertas | Retencao e utilidade diaria. | Alertas por provento, desvio de meta, cotacao stale e eventos. |
| IRPF/DARF | Alto valor, alto risco fiscal. | Comecar por relatorio de apuracao antes de automacao completa. |
| Historico longo de indicadores | Competitivo com Pro, mas exige dados robustos. | Priorizar historico suficiente para decisoes, depois ampliar. |
| Exportacoes PDF/CSV avancadas | Valor para usuarios power e contadores. | Relatorios com metodologia e timestamp. |

### Diferencial

| Oportunidade | Por que supera o benchmark | Implementacao sugerida |
| --- | --- | --- |
| Calculo explicavel por evento | Ataca diretamente a dor de divergencia de carteira. | "Por que este numero?" em preco medio, rentabilidade e IR. |
| Conciliacao transparente | Importacao nunca sera perfeita; explicar e resolver e mais valioso que esconder. | Painel de divergencias com causa provavel e acao. |
| Renda fixa de verdade | Muitos produtos tratam renda fixa como saldo manual. | Vencimentos, indexadores, liquidez, impostos e rentabilidade liquida. |
| Integracao com financas pessoais | FinanceBuddy ja tem transacoes, metas e orcamentos. | Aportes saem do fluxo mensal e entram na carteira. |
| Indicadores com dicionario versionado | Reduz decisao errada por formula opaca. | Catalogo de indicadores e formulas testadas. |
| Qualidade operacional visivel | Usuario confia quando sabe o que esta atualizado ou estimado. | Badges de fonte/status em dados externos. |

## Comparacao por modulo

| Modulo | Investidor10/Pro | FinanceBuddy atual | Gap |
| --- | --- | --- | --- |
| Carteira | Carteira com importacao, acompanhamento, historico e recursos Pro. | Lista manual de investimentos. | Muito alto |
| Ativos | Paginas por ticker com cotacao, indicadores e historico. | Sem cadastro de ativos. | Muito alto |
| Dividendos | Agenda e historico de dividendos/proventos. | Inexistente. | Muito alto |
| Rankings | Rankings publicos e filtros. | Inexistente. | Alto |
| Comparador | Ferramenta de comparacao. | Inexistente. | Alto |
| Busca avancada | Screener/filtros avancados. | Inexistente. | Alto |
| Relatorios | Relatorios e analises ligados a investimentos. | Relatorios pessoais, nao de carteira. | Alto |
| IRPF/DARF | Calculadoras e conteudo fiscal; Pro pode aprofundar. | Inexistente. | Alto |
| Metas/rebalanceamento | Recursos de carteira Pro. | Metas financeiras separadas, sem investimento. | Medio/Alto |
| Conteudo | Cursos, artigos, analises e paginas educativas. | Landing/README, sem conteudo de investimento. | Medio |

## Dependencias antes de construir

1. Decidir licenca e provedor inicial de cotacoes.
2. Modelar ativos e transacoes de investimento.
3. Definir metodologia de preco medio e rentabilidade.
4. Criar adapter de dados externos com cache e observabilidade.
5. Definir politica LGPD para documentos financeiros e importacoes.
6. Criar suite de testes com casos reais anonimizados: compra, venda parcial, dividendos, split, grupamento, bonificacao e renda fixa.

## Recomendacao de foco

O FinanceBuddy nao deve tentar replicar todo o Investidor10 no primeiro ciclo. A melhor sequencia e:

1. Corrigir o fundamento: ativo, cotacao, transacao, posicao e auditoria.
2. Entregar carteira confiavel com proventos e relatorio mensal.
3. Adicionar rankings/comparador como camada de descoberta.
4. Usar metas e rebalanceamento para diferenciar pela integracao com financas pessoais.
5. So depois entrar em IRPF/DARF, B3 automatizado e conteudo premium.

