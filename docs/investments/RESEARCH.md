# Benchmark Investidor10 e Investidor10 Pro

Data da pesquisa: 2026-05-24

Este documento transforma evidencias publicas do Investidor10, Investidor10 Pro e Investor10 internacional em requisitos acionaveis para o FinanceBuddy. A pesquisa usa paginas abertas, paginas de suporte, comunicados publicos e feedback publico de usuarios. Nao houve scraping de base de dados, copia de UI, copia de textos comerciais, copia de relatorios pagos ou uso de carteiras recomendadas proprietarias.

## Fontes principais

- Investidor10 Pro: https://investidor10.com.br/PRO
- Investidor10 Pro Carteiras: https://investidor10.com.br/pro/carteiras/
- Investor10 internacional: https://www.investor10.com/
- Suporte Investidor10: https://investidor10.com.br/suporte/
- Rankings de acoes: https://investidor10.com.br/acoes/rankings/
- Exemplo de pagina de ativo B3: https://investidor10.com.br/acoes/petr4/
- Agenda de dividendos: https://investidor10.com.br/acoes/dividendos/
- Ferramentas gratuitas: https://investidor10.com.br/ferramentas/
- Calculadora de IRPF: https://investidor10.com.br/calculadoras/calculadora-de-irpf/
- Informativo de IRPF: https://investidor10.com.br/irpf/
- Dados abertos CVM: https://dados.cvm.gov.br/
- API SGS Banco Central: https://dadosabertos.bcb.gov.br/dataset/11-taxa-de-juros---selic
- Feedback publico de usuarios no Reddit: https://www.reddit.com/r/investimentos/comments/1kgahcb/

## Sintese executiva

O Investidor10 combina tres produtos: portal de dados fundamentalistas, ferramentas de acompanhamento de carteira e assinatura Pro com historico maior, filtros, analises, importacao e recursos de decisao. A proposta publica enfatiza rapidez para analisar ativos, historico longo, carteira integrada, rankings, alertas, agendas e relatorios. A oportunidade para o FinanceBuddy nao e copiar a superficie, mas competir por confiabilidade: calculos auditaveis, explicacao de divergencias, qualidade de importacao, renda fixa mais forte, experiencia menos opaca e dados com proveniencia clara.

FinanceBuddy hoje cobre apenas cadastro manual de investimentos com nome, categoria, valor investido, valor atual, data inicial e notas. Ele calcula lucro absoluto e ROI acumulado sem cotacao, quantidade, movimentacoes, proventos, classes de ativo reais, benchmark, preco medio, rentabilidade total, importacao ou indicadores fundamentalistas. O gap e grande, mas tambem claro: a primeira versao competitiva deve priorizar base de ativos, carteira transacional e calculos transparentes antes de conteudo premium.

## Inventario de funcionalidades

| Feature | Descricao observada | Free/Pro | Ativos | Dados necessarios | Complexidade | Valor | Lacunas/oportunidades |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pagina de ativo | Visao de cotacao, variacao, indicadores, dividendos, graficos, dados financeiros e historicos por ticker. | Free com profundidade limitada; Pro amplia historico e ferramentas. | Acoes, FIIs, ETFs, BDRs; internacional no Investor10. | Cadastro de ativos, cotacoes, demonstrativos, proventos, eventos corporativos, indices. | Alta | Alta | Exibir formula, fonte, data de atualizacao e alertas de dado incompleto. |
| Indicadores fundamentalistas | Multiples e indicadores como P/L, P/VP, DY, ROE, ROIC, margens, divida, CAGR, liquidez e payout, variando por classe. | Free/Pro | Principalmente renda variavel. | Demonstrativos padronizados, cotacao, lucro, patrimonio, divida, dividendos. | Alta | Alta | Criar dicionario de indicadores com formula versionada e rastreavel. |
| Rankings | Listas ordenaveis por indicadores, dividendos, valuation, rentabilidade, liquidez e filtros por tipo de ativo. | Free; filtros avancados podem ser Pro. | Acoes, FIIs, BDRs, ETFs e internacionais conforme portal. | Snapshot de indicadores, liquidez, setor, segmento, classe, historico. | Media/Alta | Alta | Rankings devem mostrar criterio, periodo e exclusoes para evitar decisao cega. |
| Busca avancada/screener | Filtragem combinada por indicadores, setores, classes, liquidez e regras numericas. | Pro em parte relevante. | Multiativo | Indices otimizados, catalogo de campos, mecanismo de filtros salvos. | Alta | Alta | Salvar filtros, explicar cada campo e permitir comparar resultado com benchmark. |
| Comparador de ativos | Comparacao lado a lado de ativos por indicadores e desempenho. | Free/Pro | Multiativo, melhor por classe comparavel. | Indicadores normalizados, cotacoes, historico, setor. | Media | Alta | Bloquear comparacoes incoerentes ou marcar "nao comparavel" quando necessario. |
| Agenda de dividendos | Eventos passados e futuros de proventos, data-com, pagamento, tipo, valor e yield. | Free/Pro | Acoes, FIIs, BDRs, ETFs. | Anuncios de proventos, eventos B3, calendario, posicao do usuario. | Alta | Alta | Separar evento anunciado, confirmado, estimado e recebido pelo usuario. |
| Carteira manual | Cadastro e acompanhamento de ativos, rentabilidade e patrimonio. | Free/Pro | Multiativo | Transacoes, posicoes, cotacoes, proventos, custos, taxas. | Alta | Muito alta | FinanceBuddy deve migrar do modelo de saldo manual para livro-caixa de transacoes. |
| Importacao B3 | Conexao/importacao de posicoes e movimentacoes para montar carteira. | Pro/conta logada, conforme mensagens publicas e suporte. | B3 | Credenciais/arquivos autorizados, notas, movimentacoes, conciliacao. | Alta | Muito alta | Fornecer importacao por arquivo como alternativa auditavel e conciliavel. |
| Multiplas carteiras | Organizacao por carteiras, objetivos, pesos e visoes separadas. | Pro | Multiativo | Agrupamento de transacoes e posicoes por carteira. | Media | Alta | FinanceBuddy pode vincular carteira a objetivos financeiros existentes. |
| Evolucao patrimonial | Grafico historico de valor da carteira e evolucao por classe/ativo. | Pro | Multiativo | Historico diario/mensal de posicoes, cotacoes e aportes. | Alta | Alta | Separar valorizacao de aporte para evitar inflar performance. |
| Rentabilidade total | Retorno considerando variacao de preco, dividendos, aportes e retiradas. | Pro | Multiativo | Transacoes, cotacoes, proventos, custos, metodologia TWR/MWR. | Alta | Muito alta | Mostrar retorno por metodo e reconciliacao com dinheiro investido. |
| Preco medio | Calculo de custo medio por ativo. | Pro/carteira | Acoes, FIIs, ETFs, BDRs, cripto. | Compras, vendas, taxas, splits, bonificacoes. | Alta | Muito alta | Calculo auditavel por evento, com diff apos cada movimentacao. |
| Metas e alocacao | Definicao de objetivos/pesos e acompanhamento de desvio. | Pro/carteira | Classes e ativos | Classes, metas por classe/ativo, valor atual, aportes planejados. | Media | Alta | Recomendacao de aportes por menor desvio, sem recomendar ativo proprietario. |
| Rebalanceamento | Sinaliza ativos/classes acima ou abaixo do alvo. | Pro/carteira | Multiativo | Pesos atuais, metas, tolerancias, cotacoes. | Media | Alta | Criar "proximo aporte sugerido" em vez de incentivar giro tributavel. |
| Relatorios e analises | Conteudo editorial, relatorios e possiveis analises premium. | Pro | Acoes, FIIs e internacional | Conteudo autoral, compliance, equipe de analise. | Alta | Media/Alta | Para FinanceBuddy, deixar para depois; primeiro ganhar em produto e dados. |
| Carteiras recomendadas | Produtos de assinatura com carteiras/modelos proprietarios. | Pro | Acoes, FIIs, internacional | Metodologia, research, compliance e historico. | Alta | Media | Nao copiar. Alternativa: carteiras-modelo educativas geradas por regras transparentes. |
| Alertas | Alertas de eventos, dividendos, preco ou alteracao relevante. | Pro em parte | Multiativo | Eventos, preferencias, canais, jobs. | Media | Alta | Alertas com razao, fonte e link de auditoria. |
| IRPF | Calculadoras e material para declaracao de imposto de renda. | Free/Pro | Renda variavel e possivelmente carteira. | Transacoes, proventos, alienacoes, prejuizos, custos, regras fiscais. | Alta | Alta | Gerar trilha de calculo e anexos exportaveis, com aviso de nao substituicao de contador. |
| DARF | Apuracao mensal de imposto sobre vendas/ganhos. | Pro ou ferramenta relacionada | Renda variavel | Vendas, compras, custos, isencoes, prejuizos acumulados. | Alta | Alta | Comecar com relatorio de apuracao antes de emissao automatica. |
| Calculadoras | Calculadoras financeiras como IRPF e ferramentas auxiliares. | Free | Geral | Parametros inseridos pelo usuario e formulas. | Baixa/Media | Media | Boa porta de entrada para aquisicao, mas secundaria ao core de carteira. |
| Conteudo educacional | Artigos, cursos, guias e explicacoes de ativos. | Free/Pro | Geral | CMS, curadoria, SEO. | Media | Media | Criar microexplicacoes dentro do fluxo, nao depender de blog no inicio. |
| Internacional | Investor10 cobre stocks, REITs e ETFs internacionais com historico longo. | Free/Pro | Stocks, REITs, ETFs | Provedores internacionais, cambio, fundamentos SEC, dividendos. | Alta | Media | Fase posterior; antes consolidar B3 e cambio basico. |

## Ativos e campos por classe

### Acoes

Campos relevantes: ticker, nome, setor, segmento, governanca, cotacao, variacao, liquidez, valor de mercado, indicadores de valuation, dividend yield, payout, lucro, receita, margens, ROE, ROIC, divida, CAGR, historico de resultados, proventos e eventos societarios.

Entradas do usuario: ticker, quantidade, compras, vendas, taxas, datas, carteira, objetivo e notas.

Saidas esperadas: posicao, preco medio, lucro/prejuizo realizado e nao realizado, rentabilidade com e sem proventos, yield on cost, participacao na carteira, alertas e historico de proventos.

### FIIs

Campos relevantes: segmento, cotacao, P/VP, dividend yield, vacancia, patrimonio liquido, valor patrimonial por cota, numero de cotistas, liquidez, distribuicoes, amortizacoes, receitas e relatorios gerenciais.

Oportunidade: FIIs sofrem com indicadores dependentes de fonte e periodo. FinanceBuddy deve mostrar periodo de referencia e permitir marcar dados como estimados ou atrasados.

### ETFs e BDRs

Campos relevantes: indice de referencia, emissor, taxa de administracao, cotacao, liquidez, patrimonio, dividendos/distribuicoes quando houver, moeda e lastro.

Oportunidade: explicar diferenca entre ETF local, BDR de ETF, stock e REIT antes de comparar indicadores.

### Stocks e REITs

Campos relevantes: ticker internacional, bolsa, moeda, cotacao, cambio, dividendos, fundamentals, indicadores setoriais, historico e tributacao internacional. Investor10 sugere um produto separado para esse universo.

Oportunidade: tratar internacional como modulo posterior, com cambio e impostos explicitados.

### Criptos

Campos relevantes: simbolo, cotacao, variacao, quantidade, custo medio, exchanges/carteiras e eventos de compra/venda/transferencia.

Oportunidade: FinanceBuddy pode oferecer controle patrimonial, mas fundamentos e rankings de cripto devem ser evitados no inicio por baixa padronizacao.

### Renda fixa

Campos relevantes: tipo (Tesouro, CDB, LCI, LCA, debenture, fundo), emissor, indexador, taxa, vencimento, liquidez, carencia, IR/IOF, marcacao a mercado, valor aplicado, valor bruto e liquido.

Feedback publico indica que renda fixa costuma ser menos bem atendida por ferramentas focadas em bolsa. Esta e uma boa area para diferenciar o FinanceBuddy, principalmente por vencimentos, rentabilidade liquida e conciliacao com objetivos.

## Carteira e experiencia do investidor

Fluxo observado em produtos similares e paginas publicas:

1. Usuario cria conta e acessa area de carteira.
2. Adiciona ativos manualmente ou importa dados autorizados.
3. Sistema consolida posicoes, preco medio, patrimonio, rentabilidade e proventos.
4. Usuario acompanha evolucao, metas, classe de ativos e dividendos.
5. Recursos Pro ampliam historico, profundidade, automacao e ferramentas de decisao.

Pontos fracos reportados em feedback publico:

- Divergencia entre valores de carteira e realidade da corretora/B3.
- Bugs em posicoes, preco medio e eventos de carteira.
- Dificuldade de saber por que um calculo esta diferente.
- Cobertura limitada ou inconsistente de renda fixa.
- Dependencia de sincronizacao externa.

Oportunidades para FinanceBuddy:

- Livro de transacoes imutavel com eventos corrigiveis por ajuste explicito.
- Tela de auditoria por ativo: cada compra, venda, split, provento, taxa e impacto no preco medio.
- Conciliacao com importacao: "importado", "manual", "estimado", "pendente de revisao".
- Comparar rentabilidade por dinheiro investido, TWR e MWR quando houver dados suficientes.
- Explicar divergencias: atraso de cotacao, evento societario pendente, provento nao conciliado, taxa ausente.

## Dados, indicadores e fontes

Fontes publicas e alternativas viaveis para FinanceBuddy:

| Fonte | Uso potencial | Riscos |
| --- | --- | --- |
| CVM Dados Abertos | Demonstrativos de companhias abertas, informes de FIIs, cadastros, documentos periodicos. | Normalizacao trabalhosa, atraso, schema heterogeneo. |
| B3 e arquivos autorizados do usuario | Ativos listados, eventos, posicoes/importacao quando legalmente permitido. | Termos de uso, disponibilidade, conciliacao e consentimento. |
| Banco Central SGS | Selic, CDI proxies, IPCA e series macro para renda fixa e benchmarks. | Series podem mudar codigos/metodologia; precisa cache e versao. |
| brapi | Cotacoes e dados de mercado para ativos brasileiros via API. | Plano, limite, SLA e licenca precisam ser verificados antes de producao. |
| Yahoo Finance/Alpha Vantage/Twelve Data | Cotacoes, historico e internacional. | Licenca, latencia, qualidade e simbolos inconsistentes. |
| OpenBB | Agregacao de dados financeiros e conectores. | Dependencias externas, cobertura Brasil variavel. |
| Upload do usuario | Notas de corretagem, extratos CEI/B3, planilhas. | Parsing, LGPD, seguranca de arquivos e conciliacao. |

Indicadores devem ser implementados como catalogo versionado:

- Nome do indicador.
- Formula.
- Classe de ativo aplicavel.
- Fontes usadas.
- Periodicidade.
- Data de referencia.
- Campos ausentes.
- Regras de exclusao.

## Paywall, negocio e UX

Padrao de negocio observado:

- Conteudo e ferramentas gratuitas como aquisicao.
- Assinatura Pro para historico ampliado, ferramentas avancadas, carteiras, importacao, alertas e analises.
- Pags de venda focadas em economizar tempo, consolidar decisao e ampliar profundidade de dados.
- Internacional separado ou destacado como expansao natural.

Direcao propria para FinanceBuddy:

- Free: controle manual, base de ativos, cotacoes atrasadas/limitadas, carteira simples e explicacoes basicas.
- Plus: carteira transacional, proventos, preco medio, metas, rankings, busca avancada e relatorios.
- Pro: importacao, conciliacao, IRPF/DARF, alertas, historico ampliado, multi-carteira e auditoria avancada.
- Diferencial de copy: clareza, rastreabilidade, confianca e menos retrabalho, sem prometer recomendacao magica.

## Riscos legais e tecnicos

- Licenca de dados: nao assumir que paginas publicas de concorrentes podem ser usadas como fonte operacional.
- Conteudo proprietario: nao copiar relatorios, carteiras recomendadas, textos comerciais ou organizacao visual distintiva.
- Tributacao: IRPF/DARF exige avisos, versionamento de regras e revisao constante.
- B3/importacao: exigir consentimento do usuario, armazenamento minimo e trilhas de auditoria.
- LGPD: carteira, patrimonio e documentos financeiros sao dados sensiveis na pratica operacional, mesmo quando nao classificados como dados sensiveis pela lei.
- Qualidade de calculo: splits, bonificacoes, grupamentos, amortizacoes, subscricoes e taxas podem invalidar preco medio simples.
- Disponibilidade: provedores externos devem ter cache, fallback e marcacao de stale data.
