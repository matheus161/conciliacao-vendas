# Design de UI: Katalagge (protótipo de referência)

Data: 2026-09-08

Protótipo publicado (Artifact): https://claude.ai/code/artifact/361589f0-2fd5-4b4e-a266-bcf2e0e065b3

Este link é a referência visual e de interação para qualquer implementação de frontend do Katalagge. Antes de construir uma tela nova ou alterar uma existente, leia o protótipo (`Artifact action: "read"` na URL acima, ou abra no navegador) em vez de recriar o design do zero.

## O que o protótipo cobre

12 telas, desktop e mobile (toggle "Computador"/"Celular" na própria página):

- Entrar (login)
- Cadastro — Criar grupo (1/2) e Adicionar loja (2/2) — sem etapa de fonte de dados no cadastro
- Visão do grupo (hero/scoreboard + ledger de lojas paginado + tendência)
- Visão da loja
- Pessoas (membros ativos + convites pendentes, ambos paginados)
- Fontes de dados (cada fonte é um card expansível com suas colunas padrão pré-configuradas + espaço reservado pra coluna personalizada "em breve")
- Enviar planilha (upload manual + histórico de envios paginado)
- Inconsistências (lista de chamados paginada)
- Chamado — detalhe (stepper de status, comparação lado a lado das fontes, ações com permissão por papel — Operador vs. Atendimento)
- Relatório (gráficos + tabelas)
- Faturas (forma de pagamento — cartão obrigatório, não permite ficar sem nenhum — e histórico de cobrança paginado)

## Sistema visual (tokens)

- Paleta (ledger/livro-caixa, sem tema fintech genérico nem dark mode):
  `--paper:#EFF2EF` `--surface:#FBFCFB` `--ink:#1C2B3A` `--brass:#BE6A1E` `--good:#2F6E52` `--bad:#A63F32`
- Tipografia: Public Sans (UI/corpo, `tnum` pra números tabulares) + Roboto Slab (headlines/números grandes)
- Layout: menu lateral fixo (sticky) com abas principais + acordeão retrátil de Lojas; menu abre por padrão, controlado só por botão (sem hover — não funciona em touch), estado lembrado em localStorage; card inteiro rola como uma unidade (topo e menu grudados via `position:sticky`)
- Paginação: Anterior/Próxima + "Mostrando X–Y de Z" em toda lista que pode crescer (sem números de página, exceto se uma lista específica pedir)
- Papéis: Admin, Operador, Atendimento (só esses três) — ações de chamado são condicionadas ao papel de quem está vendo

## Contexto de negócio por trás do design

Baseado em `2026-08-21-conciliacao-saas-design.md` e `2026-08-21-conciliacao-visao-geral.pdf` nesta mesma pasta — produto real é **Katalagge**, exemplo usado no protótipo é a **Franquia Sabor Norte** (13 lojas). Fontes reais: Sistema de Faturamento (gabarito obrigatório), Getnet, Mulvi, Santander, Banese, Sitef. Tipos de divergência: estorno não refletido, venda não lançada, alerta técnico. Fluxo de chamado: Pendente de revisão → Aberto → Em andamento → Resolvido (alt. Descartado).

**Pendência de negócio:** o spec original define Pix (via AbacatePay/Mercado Pago) como forma de pagamento principal — a tela de Faturas no protótipo usa cartão de crédito porque foi pedido explicitamente durante o design. Confirmar com o time se cartão substitui ou complementa o Pix antes de implementar a cobrança de verdade.
