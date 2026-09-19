const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  trialing: "Período de teste",
  active: "Assinatura ativa",
  past_due: "Pagamento pendente",
  canceled: "Assinatura cancelada",
};

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABEL[status] ?? "Assinatura";
}
