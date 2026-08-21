# Roadmap de Investimentos

Roadmap priorizado para transformar o FinanceBuddy em uma plataforma competitiva para investidor pessoa fisica brasileiro, sem copiar UI, copy, relatorios ou carteiras proprietarias do Investidor10.

> Historical planning artifact. This roadmap records the original sequencing;
> several early portfolio capabilities have since been implemented. It is kept
> for design-history context and is not the active delivery plan.

Escala de complexidade: S, M, L, XL.

## Fase 1. Base de ativos e cotacoes

Valor para usuario: parar de depender de valores manuais e criar base confiavel para carteira, rankings e relatorios.

Complexidade: L

Dados necessarios:

- Cadastro de ativos B3: ticker, nome, classe, moeda, mercado, setor/segmento quando aplicavel.
- Provedor de cotacoes com licenca adequada.
- Historico minimo de cotacoes.
- Fonte, timestamp e status de cada dado.

Escopo:

- Criar modelos `Asset`, `Quote`, `DataProvider` e vincular `Investment` futuro a `Asset`.
- Implementar adapter de cotacao com cache.
- Criar job de atualizacao.
- Exibir cotacao atual, variacao basica e status do dado.
- Manter fallback manual.

Aceite minimo:

- Usuario busca um ticker B3 e encontra um ativo canonico.
- Sistema salva cotacao com fonte e timestamp.
- Falha do provedor nao quebra a tela de carteira.
- Dado atrasado aparece como atrasado.
- Testes cobrem normalizacao de ticker, cache e fallback.

## Fase 2. Carteira com preco medio, quantidade, proventos e rentabilidade total

Valor para usuario: controlar posicao real e entender retorno com calculo auditavel.

Complexidade: XL

Dados necessarios:

- Compras, vendas, taxas, datas, quantidade e preco.
- Eventos corporativos.
- Cotacoes.
- Proventos por ativo.

Escopo:

- Criar `Portfolio`, `PortfolioTransaction`, `PositionSnapshot` e `CorporateAction`.
- Migrar investimento manual atual para uma carteira legada ou converter em ajuste inicial.
- Implementar calculo de quantidade, custo, preco medio, P/L nao realizado e realizado.
- Implementar proventos recebidos e rentabilidade com/sem proventos.
- Criar tela de auditoria por ativo.

Aceite minimo:

- Compra aumenta quantidade e custo.
- Venda parcial reduz quantidade conforme metodologia definida e calcula resultado realizado.
- Provento recebido entra no retorno total sem alterar preco medio, exceto eventos especificos quando aplicavel.
- Split/grupamento ajusta quantidade e preco medio sem alterar custo total.
- Usuario consegue abrir a decomposicao do calculo.

## Fase 3. Rankings e busca avancada

Valor para usuario: descobrir ativos por criterios objetivos e comparaveis.

Complexidade: L

Dados necessarios:

- Indicadores por classe.
- Setores, segmentos e liquidez.
- Snapshots cacheados para ordenacao.
- Dicionario de formulas.

Escopo:

- Criar catalogo de indicadores.
- Criar snapshots de ranking por classe.
- Implementar filtros por setor, liquidez, dividend yield, P/VP, P/L e outros campos aplicaveis.
- Mostrar periodo, fonte e regra de exclusao.
- Salvar filtros em uma versao posterior da fase se houver tempo.

Aceite minimo:

- Usuario ordena acoes e FIIs por indicadores basicos.
- Filtros combinados retornam resultado consistente.
- Cada coluna tem explicacao de formula e fonte.
- Ativos com dados incompletos sao marcados ou excluidos com regra visivel.

## Fase 4. Comparador de ativos

Valor para usuario: avaliar alternativas lado a lado sem misturar metricas incompativeis.

Complexidade: M

Dados necessarios:

- Indicadores normalizados.
- Historico de cotacao.
- Classe, setor e segmento.

Escopo:

- Selecionar 2 a 5 ativos.
- Comparar indicadores, dividendos, liquidez, retorno historico e volatilidade simples quando disponivel.
- Marcar campos nao comparaveis.
- Permitir salvar comparacao.

Aceite minimo:

- Comparador bloqueia ou sinaliza metricas incoerentes entre classes.
- Usuario ve mesma janela temporal para retorno.
- Dados exibem fonte e data.

## Fase 5. Agenda de dividendos e projecoes

Valor para usuario: planejar fluxo de caixa de proventos e acompanhar recebimentos.

Complexidade: L

Dados necessarios:

- Eventos de proventos.
- Quantidade elegivel por data-com.
- Calendario de pagamento.
- Status anunciado/confirmado/recebido.

Escopo:

- Agenda geral por ativo.
- Agenda personalizada da carteira.
- Proventos esperados e recebidos.
- Notificacoes por data-com e pagamento.
- Projecoes conservadoras baseadas em recorrencia historica, marcadas como estimativa.

Aceite minimo:

- Usuario ve proximos proventos dos ativos em carteira.
- Sistema calcula valor esperado pela quantidade na data-com.
- Usuario marca recebido e corrige valor.
- Estimativas nunca aparecem como pagamento confirmado.

## Fase 6. Metas, rebalanceamento e recomendacao por peso

Valor para usuario: transformar carteira em plano de alocacao integrado as metas do FinanceBuddy.

Complexidade: M

Dados necessarios:

- Classes de ativo.
- Pesos-alvo.
- Valor atual por classe/ativo.
- Bandas de tolerancia.

Escopo:

- Definir peso-alvo por classe e ativo.
- Mostrar desvio atual.
- Sugerir destino do proximo aporte para reduzir desvio.
- Vincular carteira a objetivos financeiros existentes.

Aceite minimo:

- Soma de metas valida 100%.
- Sistema calcula desvio em valor e percentual.
- Sugestao de aporte usa apenas metas do usuario.
- Tela deixa claro que nao e recomendacao de compra baseada em research.

## Fase 7. IRPF e DARF

Valor para usuario: reduzir risco e retrabalho fiscal para investidores ativos.

Complexidade: XL

Dados necessarios:

- Livro completo de transacoes.
- Custos, taxas e eventos.
- Regras fiscais versionadas.
- Prejuizo acumulado.
- Posicao anual.

Escopo:

- Relatorio mensal de vendas, ganhos, prejuizos e isencoes.
- Controle de prejuizo compensavel.
- Demonstrativo anual para IRPF.
- Estimativa de DARF.
- Exportacao para contador.

Aceite minimo:

- Cada calculo aponta regra fiscal versionada e eventos usados.
- Usuario consegue auditar mes a mes.
- Sistema separa classes fiscais relevantes.
- Produto inclui aviso de que nao substitui orientacao profissional.

## Fase 8. Conteudo premium e analises

Valor para usuario: apoiar decisao, retencao e monetizacao quando o produto de dados ja for confiavel.

Complexidade: L/XL, dependendo de autoria e compliance.

Dados necessarios:

- Politica editorial.
- Autoria e revisao.
- Historico de indicadores.
- Disclaimers e regras de compliance.

Escopo:

- Dicionario publico de indicadores.
- Guias curtos dentro das telas.
- Analises autorais apenas se houver capacidade de producao e revisao.
- Evitar carteiras recomendadas proprietarias no curto prazo.

Aceite minimo:

- Conteudo explica metodologia do FinanceBuddy.
- Nao copia estrutura, textos ou conclusoes de concorrentes.
- Analises, se existirem, tem autoria, data, premissas e aviso de risco.

## Sequenciamento recomendado

| Ordem | Fase | Motivo |
| --- | --- | --- |
| 1 | Base de ativos e cotacoes | Habilita todas as camadas posteriores. |
| 2 | Carteira transacional | Cria confianca e resolve o maior gap atual. |
| 3 | Dividendos/proventos basicos | Essencial para investidor brasileiro e para retorno total. |
| 4 | Rankings e busca | Expande utilidade para analise e descoberta. |
| 5 | Comparador | Complementa rankings com decisao lado a lado. |
| 6 | Metas/rebalanceamento | Diferencia o FinanceBuddy pela integracao com planejamento. |
| 7 | IRPF/DARF | Alto valor, mas depende de dados completos e corretos. |
| 8 | Conteudo premium | So faz sentido apos produto e dados maduros. |

## Riscos por fase

| Risco | Fases afetadas | Mitigacao |
| --- | --- | --- |
| Licenca de dados inadequada | 1, 3, 4, 5 | Aprovar provedor antes de producao e manter adapters substituiveis. |
| Calculo errado de preco medio | 2, 7 | Testes com cenarios complexos e auditoria por evento. |
| Proventos incompletos | 2, 5, 7 | Status por evento e conciliacao manual. |
| Mudanca de layout/formato de fonte externa | 1, 3, 5 | Usar APIs/arquivos oficiais quando possivel e monitorar jobs. |
| Risco fiscal | 7 | Versionar regras, revisar com especialista e exportar trilha. |
| LGPD e documentos financeiros | 2, 7 | Minimizar dados, criptografar, restringir acesso e registrar consentimento. |
