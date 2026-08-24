# Design: SaaS de Conciliação de Vendas Multi-tenant

Nome do produto: **Katalagge**

Data: 2026-08-21
Status: Aprovado (aguardando revisão final do usuário)

## 1. Problema

Lojistas (inicialmente uma rede de 13 franquias) precisam conciliar vendas entre múltiplas fontes: sistema de faturamento interno, operadoras de cartão (Getnet, Mulvi, etc.), extratos bancários (Santander, Banese, etc.) e Sitef (impressoras fiscais/POS). Hoje o processo é manual: baixar Excel de cada site, comparar em planilha, identificar divergências (ex: transação cancelada no Pix mas aparece faturada no sistema) e corrigir manualmente. O objetivo é automatizar a comparação, apontar divergências e gerenciar sua resolução via chamados.

Baseado no arquivo `Resumo de Requisitos.docx` fornecido e refinamento com o usuário.

## 2. Objetivo do produto

SaaS multi-tenant, self-service (cadastro público + pagamento + configuração pelo próprio cliente), organizado por Grupo (ex: uma franquia) com múltiplas lojas vinculadas. Prioridade: simplicidade e baixo custo de infraestrutura, com caminho claro de evolução (ex: mais conectores de API, mais automações) sem reescrever a base.

## 3. Modelo multi-tenant e papéis

```
Grupo (ex: Franquia X)
 ├─ Lojas/empreendimentos (N)
 ├─ Admin (criador do grupo) — adiciona/remove usuários, configura fontes de dados, gerencia billing
 ├─ Operador (N) — sobe/confere relatórios, revisa divergências detectadas, confirma chamados
 └─ Atendimento (N) — time próprio do grupo, resolve chamados confirmados
```

- Isolamento por `group_id` em todas as tabelas de negócio (multi-tenancy simples via coluna, sem schema-per-tenant).
- Loja pertence a um único grupo. Usuário pode ter papel em mais de um grupo (suportado no schema, não obrigatório no MVP).
- Time de atendimento é próprio de cada grupo (sem suporte centralizado do fornecedor do SaaS na v1).

## 4. Ingestão de dados

Entidade `Fonte de Dados`, por grupo/loja, dois tipos:

- **Upload manual (genérico)**: operador baixa Excel/CSV do site de origem e sobe no sistema. Admin configura um mapeamento de colunas uma única vez por fonte (wizard: qual coluna é data, valor, modalidade, status). Totalmente genérico — funciona para qualquer provedor novo sem alteração de código.
- **Conector API**: quando o provedor oferece API, requer um adaptador de código próprio por provedor (autenticação e formato variam). Não é genérico ponto-a-clique. MVP entra apenas com upload manual; conectores de API são plugáveis incrementalmente conforme demanda.

Todo dado, de qualquer fonte, é normalizado para o formato interno:
`{loja, data, hora, valor, modalidade (pix/crédito/débito/parcelado), status, referência_externa, fonte, operador_caixa}`.

`operador_caixa` (nome do operador de caixa responsável pela transação) só vem do Sistema de Venda — demais fontes (banco/adquirente, faturamento) não têm essa informação, campo fica nulo nelas.

O Sistema de Faturamento é uma fonte especial obrigatória — é o "gabarito" contra o qual as demais fontes conciliam.

## 5. Motor de conciliação

Executa por loja + período (mês), disparado quando todas as fontes do período foram carregadas (ou manualmente pelo operador).

**Matching**: por loja, chave = valor + data/hora + modalidade, com janela de tempo configurável (ex: ±15min, para cobrir diferença de relógio entre sistemas). Referência externa (NSU/código de autorização), quando presente nos dois lados, é usada como desempate/match forte.

**Data bancária vs. data de faturamento**: sistemas bancários (adquirente/banco) jogam a data de liquidação para o próximo dia útil quando ela cai em sábado/domingo (e aparentemente feriado nacional — a confirmar com dados reais durante o plano de conciliação) enquanto o Sistema de Faturamento sempre usa a data exata da venda. O matching de data precisa tolerar esse deslocamento (comparar contra a data exata OU o próximo dia útil dela), não tratar como divergência de valor/estorno.

**Pix caindo na conta da matriz**: quando a modalidade é Pix, o valor às vezes cai na conta da matriz em vez da conta da própria loja (filial). Para Pix, o matching não deve depender do número/conta da loja batender — precisa considerar tanto o caso "caiu na conta da própria filial" quanto "caiu na conta da matriz", casando por valor + data/hora dentro do grupo. Modalidades que não são Pix continuam batendo pela conta da loja normalmente.

**Tipos de divergência**:
1. Faturado no sistema, mas cancelado/ausente na fonte externa → provável estorno não refletido.
2. Presente na fonte externa, ausente no faturamento → venda não lançada.
3. Totais batem em quantidade mas não em soma do período → alerta técnico de parsing/mapeamento (não vira chamado de loja).

Resultado da conciliação é armazenado por período (mês a mês) e imutável após o fechamento do mês.

## 6. Chamados (ticketing)

Estados: `PENDENTE_REVISAO` (auto-criado pela conciliação) → `ABERTO` (operador confirmou) → `EM_ANDAMENTO` (atendimento assumiu) → `RESOLVIDO` → `FECHADO`. Ramo lateral: `DESCARTADO` (falso positivo).

- Divergências tipo 1 e 2 geram chamado automaticamente, com evidência (linhas das fontes envolvidas, tipo, loja, valor, data).
- Operador revisa/edita e confirma — não digita do zero.
- Atendimento resolve fora do sistema (ex: cancela manualmente no Sistema de Faturamento) e marca resolvido aqui, com nota de resolução.
- Sem integração de escrita em sistemas de terceiros no MVP — é registro e rastreio, não automação de correção.

## 7. Billing / assinatura (self-service)

- Cadastro público → cria Grupo → usuário vira Admin → configura lojas e fontes → assina plano.
- Cobrança por loja ativa (preço por loja/mês), recalculada ao ativar/desativar loja.
- Gateway: AbacatePay e/ou Mercado Pago, atrás de uma interface `PaymentProvider` (criar assinatura, processar webhook, cancelar) — permite trocar/adicionar gateway sem alterar o restante do sistema. Pix como forma de pagamento principal.
- Grupo com assinatura vencida entra em modo somente leitura (sem perda de dados, bloqueia novas conciliações/uploads).
- Sem trial complexo no MVP: cadastro, escolha de plano, pagamento, liberação de acesso. Wizard de config de fonte acontece no primeiro uso, não bloqueia o cadastro.

## 8. Stack técnica

- **App**: Next.js (TypeScript), frontend + API routes. Hospedagem em aberto (Vercel free/hobby é a opção mais barata; pode migrar para AWS depois para consolidar provedor).
- **Worker**: AWS Lambda (Node/TS), disparado por AWS SQS. Paga por uso — adequado a jobs esporádicos de parsing/conciliação, sem servidor ocioso.
- **Fila**: AWS SQS.
- **Storage de arquivos** (planilhas enviadas): AWS S3.
- **Banco**: AWS RDS Postgres (instância pequena, ex. `db.t4g.micro`) — custo fixo baixo e previsível, mais adequado que Aurora Serverless nesse volume de uso.
- **Auth**: implementada na própria aplicação — tabelas `users`/`memberships`/`groups`, senha com hash (bcrypt/argon2), sessão via JWT em cookie httpOnly. Sem dependência de provedor terceiro por ora; migração futura para Cognito/Clerk não exige mudança no schema de papéis (`memberships` é agnóstica de quem autentica).

**Fluxo de processamento**: app grava arquivo no S3 → publica mensagem no SQS → Lambda processa (parse + conciliação) → grava resultado no RDS → app lê via polling curto.

**Custo estimado do MVP**: ~R$70-100/mês (RDS domina o custo; Lambda/SQS/S3 ficam próximos de zero nesse volume).

## 9. Modelo de dados (essencial)

```
groups              (id, name, plan, subscription_status)
stores              (id, group_id, name, code)
users               (id, email, password_hash)
memberships         (id, user_id, group_id, role: admin|operator|support)
data_sources        (id, group_id, store_id, type: upload|api, provider, column_mapping json | api_config json)
raw_imports         (id, data_source_id, period, file_s3_key, status, imported_at)
transactions        (id, store_id, source, period, date, time, amount, modality, status, external_ref, cashier_operator?)
reconciliation_runs (id, store_id, period, status, started_at, finished_at)
divergences         (id, reconciliation_run_id, type, transaction_ids[], amount, details json)
tickets             (id, divergence_id, group_id, store_id, status, assigned_to, description, resolution_note, created_at, resolved_at)
subscriptions       (id, group_id, payment_provider, external_subscription_id, status, price_per_store)
invoices            (id, subscription_id, period, amount, status, paid_at)
```

`transactions` indexada/particionada por `(store_id, period)` — alinhado ao requisito de armazenamento mês a mês e mantém a conciliação performática à medida que o volume cresce.

## 10. Fora de escopo (MVP) / riscos

- Sem escrita automática em sistemas de terceiros (não cancela transação via API no Sitef/banco) — apenas aponta e rastreia.
- Sem RPA/scraping de sites sem API — depende de export manual do operador para essas fontes.
- Multi-idioma/multi-moeda fora de escopo (BRL/PT-BR apenas).
- Risco: mapeamento de colunas incorreto em uma fonte gera falso-positivo em massa — mitigar com preview/validação no wizard de configuração antes de salvar o mapeamento.
- Risco: gateway de pagamento (AbacatePay/Mercado Pago) pode não suportar nativamente todo o fluxo de assinatura recorrente necessário — validar na fase de plano técnico antes de implementar.

## 11. Roadmap

- **MVP** (13 franquias, self-service): cadastro/pagamento → grupo → lojas → fontes via upload manual → conciliação mês a mês → chamados auto-criados → papéis admin/operador/atendimento.
- **Fase 2**: conectores de API por provedor (conforme demanda), notificações (email/WhatsApp) de chamado novo, dashboard de métricas de divergência.
- **Fase 3**: multi-membership (usuário em vários grupos), autenticação terceirizada/SSO, exportação e relatórios avançados.
