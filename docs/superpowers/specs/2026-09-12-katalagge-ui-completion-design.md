# Design: Completar as telas do Katalagge (casca + rotas mínimas)

Data: 2026-09-12

Referências: `2026-09-08-katalagge-ui-design.md` (protótipo — link canônico), `2026-08-21-conciliacao-saas-design.md` (regras de negócio e modelo de dados), `2026-08-21-fundacao-multitenant.md` (plano anterior, já concluído).

## 1. Objetivo

O plano "Fundação Multi-tenant" entregou autenticação, grupos/lojas/memberships, convites, e duas das 13 telas do protótipo Katalagge (Visão do grupo, Pessoas), incluindo a extensão real de restrição de lojas por pessoa. Faltam 7 telas: Visão da loja, Fontes de dados, Enviar planilha, Inconsistências, Chamado (detalhe), Relatório, Faturas.

Este plano cobre: (a) alinhar as duas telas existentes ao protótipo (auditoria encontrou gaps reais — ver §3–4), e (b) construir as 7 telas restantes com o design do protótipo e as rotas mínimas necessárias pra cada uma funcionar de forma navegável.

## 2. Abordagem geral

**Casca primeiro.** Toda tela ganha o visual/interação do protótipo Katalagge e rotas/CRUD mínimos pra navegar.

**Regra pra dado que falta — dois casos diferentes:**

1. **Feature real que este plano constrói, mas ainda sem uso** (ex.: nenhuma loja cadastrada ainda, nenhum convite pendente, nenhuma fonte conectada, nenhum upload enviado): estado vazio honesto, sem número fabricado — o precedente já estabelecido na Task 15 do plano anterior ("Nenhuma conciliação ainda" em vez de zero fingindo cálculo).
2. **Subsistema que este plano não constrói** (motor de conciliação, criação automática de chamado, cobrança real — ver lista abaixo): em vez de deixar a tela vazia/morta, usa **dado ilustrativo** (parecido com o Sabor Norte fictício do protótipo), sempre com um **indicador visível de que é exemplo** (ex.: selo "dado de exemplo" perto do número ou uma nota no topo da seção) — nunca aparece como se fosse real. Isso vale pra qualquer grupo, real ou não; a diferença é só o selo, não esconder o mock atrás de uma flag de ambiente. É importante porque, sem o selo, um número fabricado na tela de um cliente pago vira uma afirmação falsa sobre o negócio dele — não é a mesma coisa que uma lista vazia.

Cada seção com dado ilustrativo (§3 e §5) fica marcada como tal, com uma nota explícita de que a substituição por dado real é um ponto pra um plano futuro dedicado (motor de conciliação, ingestão de verdade, billing real).

**Fora de escopo deste plano**, ficando para planos dedicados futuros (como já era a intenção original do roadmap):
- Motor de conciliação (matching, tolerância de data bancária, casos Pix matriz/filial — ver `2026-08-21-conciliacao-saas-design.md` §5).
- Parsing real de planilha e normalização de transações.
- Processamento de pagamento de verdade (gateway Pix/cartão).
- Qualquer worker/fila assíncrona (SQS/Lambda) — este plano roda tudo síncrono na própria request, como o resto da aplicação até aqui.

**Ordem de implementação** (uma tela por vez): Visão do grupo (ajuste) → Pessoas (ajuste) → Visão da loja → Fontes de dados → Enviar planilha → Inconsistências → Chamado (detalhe) → Relatório → Faturas.

Para as duas primeiras (já implementadas), a auditoria abaixo (§3–4) é definitiva. Para as 7 seguintes (§5), este documento fixa o escopo e o modelo de dados mínimo por tela; uma checagem de gaps mais fina (como a feita em §3–4) acontece a cada tela, no momento em que ela for tarefa ativa do plano de implementação — não faz sentido detalhar hoje uma tela que só será construída depois de várias outras, cujo contexto pode mudar.

## 3. Visão do grupo (`/dashboard`) — ajustes

Gaps encontrados comparando a implementação atual contra o protótipo:

1. **Scoreboard hoje é honesto-vazio ("Nenhuma conciliação ainda"); vira dado ilustrativo.** O motor de conciliação é subsistema fora de escopo deste plano (não é "ainda sem uso", é "não vai existir aqui") — pela regra do §2, mostra os números do protótipo (vendas/conciliadas/divergência) como exemplo, com selo visível de dado ilustrativo, e uma nota apontando que o número real chega com o plano do motor de conciliação.
2. **Seção de tendência ausente.** Adicionar o `chart-panel` do protótipo (gráfico de % conciliado dos últimos 6 meses) como dado ilustrativo, mesmo selo/nota do item 1 — não como estado vazio.
3. **Ledger ("Como cada loja está") — situação por loja fica honesta por enquanto.** A coluna de situação (`Conectar fonte`) reflete se a loja tem uma fonte de dados conectada de verdade — feature que este mesmo plano constrói, só que numa tarefa mais à frente (Fontes de dados). Como ainda não existe nesta tarefa, toda loja mostra `Conectar fonte`, igual a hoje — isso é honesto, não é o caso do item 1. **Tarefa de acompanhamento**: quando a tarefa de Fontes de dados for concluída mais à frente no plano, revisitar esta tela — lojas com fonte conectada passam a mostrar números ilustrativos (vendas/conciliadas/divergentes, com selo de exemplo) em vez de `Conectar fonte`; lojas sem fonte continuam honestas.
*(Nota: itens 1–3 deixam a tela com uma tensão visual proposital — o scoreboard mostra milhares de vendas ilustrativas enquanto o ledger logo abaixo mostra toda loja como "sem fonte conectada". Isso é esperado nesta fase: são duas seções com regras diferentes (subsistema ausente vs. feature ainda não construída nesta tarefa), cada uma com seu próprio selo/estado — não "consertar" juntando os dois.)*

4. **Linhas de loja não são links.** Tanto a tabela quanto o sub-menu "Lojas" do rail devem linkar pra Visão da loja. Como essa tela ainda não existe na sequência, criar agora uma rota stub `/dashboard/lojas/[id]` (nome da loja + "em breve") e já linkar as linhas — evita re-trabalho quando chegarmos na tela de verdade. O dot de situação fica cinza/"none" (real, sem fonte conectada ainda) e sem contador de divergência (esse sim dependeria do motor de conciliação).
5. **Pill de fatura no topbar ausente.** Adicionar, mas **honesto, não ilustrativo** — deriva de `group.subscriptionStatus` real (ex.: "Período de teste" / "Assinatura ativa"), sem valor (R$) nem data de cobrança específicos, já que isso exigiria o subsistema de billing. Diferente do protótipo (que mostra "R$1.170 · em 5 dias"), aqui fica só o status, porque dá pra fazer honesto sem inventar número — não precisa do selo de exemplo.
6. **Subtítulo do painel ausente.** Adicionar "Toque numa loja pra ver os detalhes" sob "Como cada loja está", agora que as linhas são de fato clicáveis.
7. **CSS faltando em `globals.css`**: `topbar-billing`, `chart-panel` (+ `chart-tab`, `chart-legend`, `legend-item`, `legend-swatch`, `svg-caption`), `is-linked` (hover state da linha da tabela). Portar do protótipo. Definir também o estilo do selo "dado de exemplo" (reutilizável nas próximas telas).

## 4. Pessoas (`/dashboard/pessoas`) — ajustes

1. **Título**: "Pessoas" → "Pessoas com acesso".
2. **Formulário de convite** vira seu próprio painel — "Convidar alguém da equipe" + subtítulo ("Você recebe um link pra compartilhar por WhatsApp ou e-mail — sem envio automático nesta versão") — com layout inline (`role-select-wrap`: e-mail + papel + botão numa linha).
3. **Convites pendentes não aparecem em lugar nenhum** hoje, depois que o link é gerado e a página é recarregada — gap funcional real, não só visual. Precisa de:
   - `listPendingInvites(groupId): Promise<{id, email, role, createdAt}[]>` em `membershipService.ts`.
   - Painel "Convites pendentes" (paginado) mostrando e-mail, papel, "convidado há N dias" e botão "Copiar link" (monta `${origin}/join/${id}` no client, sem precisar de nova rota).
4. **Sem paginação** hoje em nenhuma lista; o protótipo pagina tanto "Ativos" quanto "Convites pendentes" (independentemente um do outro — dois parâmetros de página distintos na URL, reaproveitando o padrão `PAGE_SIZE` já usado em `/dashboard`).
5. **Controle de restrição de loja por pessoa** (funcionalidade real, sem referência no protótipo original) ganha visual alinhado ao sistema Katalagge — chips selecionáveis em vez de checkboxes soltos.
6. **CSS faltando em `globals.css`**: `invite-row`, `invite-email`, `role-select-wrap`. Portar do protótipo.

Sem mudança de schema — `PendingMembership` já tem todos os campos necessários (`email`, `role`, `createdAt`).

## 5. Telas restantes — escopo e modelo de dados mínimo

Cada uma é casca + rotas mínimas, seguindo §2. O modelo de dados citado é o mínimo pra tela funcionar (CRUD honesto), não o modelo completo de `conciliacao-saas-design.md` §9 (esse é maior porque cobre também o motor de conciliação, fora de escopo aqui).

### Visão da loja (`/dashboard/lojas/[id]`)
Substitui o stub criado em §3. Versão "de uma loja só" da Visão do grupo: mesma estrutura de scoreboard, mesma regra do §2/§3 (motor de conciliação fora de escopo → números ilustrativos com selo de exemplo; conexão de fonte real → honesta). Não introduz modelo de dados novo; reaproveita `Store`/`groupService`.

### Fontes de dados (`/dashboard/fontes`, por loja)
Precisa de um modelo `DataSource` (`groupId`, `storeId`, `provider`, `columnMapping` json, `connectedAt`). Tela lista os provedores conhecidos (Sistema de Faturamento — obrigatório — , Getnet, Mulvi, Santander, Banese, Sitef) como cards expansíveis com colunas padrão pré-configuradas (constantes no código, não editáveis nesta fase — a coluna personalizada fica "em breve" como no protótipo). Funcionalidade real: admin conecta/desconecta uma fonte por loja. Sem wizard de mapeamento de coluna de verdade (isso é lógica de ingestão, fora de escopo).

### Enviar planilha (`/dashboard/upload`)
Precisa de um modelo de histórico de envio (`dataSourceId`, `period`, `fileName`, `uploadedAt`, `status`). Upload manual grava o arquivo (armazenamento local/simples nesta fase — sem S3/fila) e cria uma linha de histórico com status honesto ("Recebido"), sem fingir que foi processado — não existe parser ainda. Histórico paginado.

### Inconsistências (`/dashboard/inconsistencias`)
Precisa do modelo `Ticket` (`groupId`, `storeId`, `divergenceType`, `status`, `assignedTo?`, `description`, `resolutionNote?`, `createdAt`, `resolvedAt?`). Criação automática depende do motor de conciliação (fora de escopo) — em vez de lista vazia, semear alguns chamados **ilustrativos** (linhas reais de `Ticket` no banco, conteúdo fictício parecido com o protótipo) pra tela ter algo navegável, com selo/nota de exemplo no topo da lista e aviso de que a criação automática real chega no plano do motor de conciliação. Paginação e filtros construídos e funcionais de verdade sobre esses dados semeados.

### Chamado — detalhe (`/dashboard/inconsistencias/[id]`)
Stepper de status (`PENDENTE_REVISAO → ABERTO → EM_ANDAMENTO → RESOLVIDO`, ramo `DESCARTADO`), comparação lado a lado das fontes, ações condicionadas a papel (Operador vs. Atendimento, ver `2026-08-21-conciliacao-saas-design.md` §6). Abre os chamados ilustrativos semeados acima. Importante: só o **conteúdo inicial** do chamado é exemplo — o fluxo de status (stepper, permissão por papel, marcar resolvido/descartado) é funcionalidade real, gravando no banco de verdade; é isso que a tela testa de fato.

### Relatório (`/dashboard/relatorio`)
Gráficos + tabelas sobre os mesmos dados semeados (lojas reais + tickets ilustrativos) — mesmo selo de exemplo. Sem modelo de dados novo.

### Faturas (`/dashboard/faturas`)
**Ponto de decisão em aberto**, já registrado no spec do protótipo: o design de negócio original define Pix como forma de pagamento principal, mas o protótipo usa cartão de crédito (pedido explícito durante o design). Antes de implementar esta tela, confirmar com o time se cartão substitui ou complementa o Pix.

Modelo mínimo: `PaymentMethod` (`groupId`, `brand`, `last4`, `addedAt`) e `Invoice` (`groupId`, `period`, `amount`, `status`, `paidAt?`). Sem gateway real neste plano: forma de pagamento e histórico de cobrança ficam com dado ilustrativo semeado (selo de exemplo), e o formulário de "adicionar cartão" só grava o metadado de exibição acima, sem validar ou cobrar de verdade — deixar isso explícito na própria tela (não só no selo) pra não parecer que processa pagamento real.

## 6. Fora de escopo / riscos

- Nenhuma lógica de negócio de conciliação, ingestão ou billing real — ver §2.
- Todo dado ilustrativo (scoreboard, tendência, chamados semeados, faturas) precisa do selo/nota de exemplo — sem isso, uma tela real de um grupo pago mostraria um número fabricado como se fosse verdadeiro, o que é enganoso, não apenas incompleto.
- Faturas depende de uma decisão de negócio (Pix vs. cartão) que este documento não resolve — sinalizar antes de iniciar essa tarefa no plano.
- Chamado (detalhe) roda sobre ticket ilustrativo, mas a transição de status é real — cuidado ao escrever os testes pra não confundir "conteúdo de exemplo" com "lógica de exemplo": só o primeiro é mock.
