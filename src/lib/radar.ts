// Domínio do Radar de Pedidos: estados, rótulos e sugestão de abordagem.
// Espelha a view SQL `radar_current` (docs/continuidade-comercial/03).

export type RadarState =
  | "confirmado" | "contato_devido" | "em_risco"
  | "fora_de_ciclo" | "esfriando" | "sem_historico";

export interface RadarEntry {
  customer_id: string;
  name: string;
  segment: string | null;
  automation_level: string;
  do_not_contact: boolean;
  order_count: number | null;
  cycle_days_median: number | null;
  qty_median: number | null;
  ticket_avg: number | null;
  buy_rate: number | null;
  last_order_at: string | null;
  next_expected_on: string | null;
  typical_confirm_dow: number | null;
  typical_confirm_hour: number | null;
  confirm_lead_days: number | null;
  state: RadarState;
}

export const RADAR_META: Record<RadarState, { emoji: string; label: string; badge: string; order: number }> = {
  em_risco:       { emoji: "🔴", label: "Pedido em risco",    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",       order: 0 },
  contato_devido: { emoji: "🟡", label: "Contato hoje",       badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", order: 1 },
  esfriando:      { emoji: "⚫", label: "Esfriando",          badge: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",    order: 2 },
  confirmado:     { emoji: "🟢", label: "Confirmado",         badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", order: 3 },
  fora_de_ciclo:  { emoji: "⚪", label: "Fora de ciclo",      badge: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400", order: 4 },
  sem_historico:  { emoji: "◌",  label: "Sem histórico",      badge: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",     order: 5 },
};

export const DOW_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function radarReason(e: RadarEntry): string {
  const cycle = e.cycle_days_median ? `ciclo de ~${Math.round(e.cycle_days_median)} dias` : null;
  const confirmDay = e.typical_confirm_dow != null
    ? `costuma confirmar na ${DOW_NAMES[e.typical_confirm_dow]}${e.typical_confirm_hour != null ? ` por volta das ${e.typical_confirm_hour}h` : ""}`
    : null;
  switch (e.state) {
    case "em_risco":
      return [`Pedido esperado para ${fmtDay(e.next_expected_on)} não veio`, confirmDay].filter(Boolean).join("; ");
    case "contato_devido":
      return [`Próximo pedido esperado ${fmtDay(e.next_expected_on)}`, confirmDay].filter(Boolean).join("; ");
    case "esfriando":
      return `Sem comprar há mais de 2 ciclos (${cycle ?? "ciclo desconhecido"})`;
    case "confirmado":
      return "Pedido do ciclo atual já registrado";
    case "fora_de_ciclo":
      return `Dentro do ciclo normal${cycle ? ` (${cycle})` : ""}`;
    case "sem_historico":
      return `${e.order_count ?? 0} pedido(s) registrado(s) — mínimo 3 para prever`;
  }
}

// Sugestão de abordagem heurística (nível 1 — copiloto).
// Na Fase 4 do roadmap isso passa a ser gerado por LLM com base no playbook.
export function suggestMessage(e: RadarEntry, contactName?: string | null): string {
  const nome = contactName?.split(" ")[0] ?? "";
  const saud = nome ? `Oi ${nome}! ` : "Olá! ";
  const qty = e.qty_median ? `${stripZeros(e.qty_median)} de sempre` : "o pedido de sempre";
  const deliveryDow = e.next_expected_on != null
    ? DOW_NAMES[new Date(e.next_expected_on + "T12:00:00").getDay()]
    : null;
  switch (e.state) {
    case "em_risco":
    case "contato_devido":
      return deliveryDow
        ? `${saud}Estou fechando a rota de ${deliveryDow}. Coloco ${qty} pra você?`
        : `${saud}Vamos programar sua próxima entrega? Mantenho ${qty}?`;
    case "esfriando":
      return `${saud}Sentimos sua falta por aqui! Posso programar uma entrega essa semana?`;
    default:
      return `${saud}Tudo bem? Qualquer coisa que precisar é só chamar!`;
  }
}

export function fmtDay(d: string | null): string {
  if (!d) return "—";
  const date = new Date(d + "T12:00:00");
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function stripZeros(n: number): string {
  return Number(n) % 1 === 0 ? String(Math.round(Number(n))) : String(n);
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
