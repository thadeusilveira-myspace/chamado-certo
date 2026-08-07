import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, PackagePlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import {
  RADAR_META, radarReason, suggestMessage, waLink, fmtDay, stripZeros,
  type RadarEntry, type RadarState,
} from "@/lib/radar";

export const Route = createFileRoute("/_app/radar")({ component: RadarPage });

interface Contact { id: string; customer_id: string; name: string; wa_phone: string; is_decision_maker: boolean }

function RadarPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["radar"],
    queryFn: async () => {
      const [radar, contacts] = await Promise.all([
        supabase.from("radar_current").select("*").order("name"),
        supabase.from("customer_contacts").select("*"),
      ]);
      if (radar.error) throw radar.error;
      if (contacts.error) throw contacts.error;
      return { entries: radar.data as RadarEntry[], contacts: contacts.data as Contact[] };
    },
  });

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
  const entries = data?.entries ?? [];
  const contactOf = (customerId: string) => {
    const list = (data?.contacts ?? []).filter((c) => c.customer_id === customerId);
    return list.find((c) => c.is_decision_maker) ?? list[0] ?? null;
  };

  const byState = (s: RadarState) => entries.filter((e) => e.state === s);
  const atRisk = byState("em_risco");
  const revenueAtRisk = atRisk.reduce((sum, e) => sum + Number(e.ticket_avg ?? 0), 0);
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const sections: RadarState[] = ["em_risco", "contato_devido", "esfriando", "confirmado", "fora_de_ciclo", "sem_historico"];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold capitalize">{today}</h2>
        <p className="text-sm text-muted-foreground">{entries.length} clientes analisados</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard emoji="🔴" label="Em risco" value={String(atRisk.length)} />
        <StatCard emoji="🟡" label="Contato hoje" value={String(byState("contato_devido").length)} />
        <StatCard emoji="🟢" label="Confirmados" value={String(byState("confirmado").length)} />
        <StatCard emoji="💰" label="Potencial faltante" value={formatBRL(revenueAtRisk)} highlight />
      </div>

      {sections.map((s) => {
        const list = byState(s);
        if (list.length === 0) return null;
        return (
          <section key={s}>
            <h3 className="text-sm font-bold text-muted-foreground mb-2">
              {RADAR_META[s].emoji} {RADAR_META[s].label} ({list.length})
            </h3>
            <div className="space-y-2">
              {list.map((e) => (
                <RadarCard key={e.customer_id} entry={e} contact={contactOf(e.customer_id)} />
              ))}
            </div>
          </section>
        );
      })}

      {entries.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhum cliente cadastrado ainda.</p>
          <Link to="/clientes" className="text-primary underline text-sm">Cadastrar a carteira</Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ emoji, label, value, highlight }: { emoji: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
      <p className="text-xs text-muted-foreground">{emoji} {label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function RadarCard({ entry, contact }: { entry: RadarEntry; contact: Contact | null }) {
  const [open, setOpen] = useState(false);
  const actionable = entry.state === "em_risco" || entry.state === "contato_devido" || entry.state === "esfriando";
  const msg = suggestMessage(entry, contact?.name);

  return (
    <div className="rounded-xl border bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-2 p-3 text-left">
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {entry.name}
            {entry.do_not_contact && <span className="ml-2 text-[10px] font-bold text-red-600">NÃO CONTATAR</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">{radarReason(entry)}</p>
        </div>
        <div className="text-right shrink-0">
          {entry.ticket_avg != null && <p className="text-sm font-bold">{formatBRL(Number(entry.ticket_avg))}</p>}
          {entry.qty_median != null && <p className="text-[11px] text-muted-foreground">~{stripZeros(Number(entry.qty_median))} un</p>}
        </div>
      </button>

      {open && (
        <div className="border-t p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <Info label="Último pedido" value={entry.last_order_at ? new Date(entry.last_order_at).toLocaleDateString("pt-BR") : "—"} />
            <Info label="Próximo esperado" value={fmtDay(entry.next_expected_on)} />
            <Info label="Ciclo" value={entry.cycle_days_median ? `~${Math.round(Number(entry.cycle_days_median))} dias` : "—"} />
            <Info label="Prob. de compra" value={entry.buy_rate != null ? `${Math.round(Number(entry.buy_rate) * 100)}%` : "—"} />
          </div>

          {actionable && !entry.do_not_contact && contact && (
            <SuggestionBox message={msg} contact={contact} />
          )}
          {actionable && !contact && (
            <p className="text-xs text-amber-600">Cliente sem contato de WhatsApp cadastrado.</p>
          )}

          <div className="flex gap-2">
            <Link to="/clientes/$id" params={{ id: entry.customer_id }}
              className="text-xs text-primary underline">Ver cliente</Link>
            <Link to="/pedidos" search={{ cliente: entry.customer_id }}
              className="text-xs text-primary underline flex items-center gap-1">
              <PackagePlus className="w-3 h-3" /> Registrar pedido
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function SuggestionBox({ message, contact }: { message: string; contact: Contact }) {
  const [text, setText] = useState(message);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const sendViaGateway = async () => {
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ contact_id: contact.id, text }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Erro ${res.status}`);
      toast.success("Mensagem enviada pelo gateway");
      queryClient.invalidateQueries({ queryKey: ["conversas"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg bg-muted p-3 space-y-2">
      <p className="text-[11px] font-bold text-muted-foreground">SUGESTÃO DE ABORDAGEM — {contact.name}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
        className="w-full rounded-lg border bg-background p-2 text-sm" />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { navigator.clipboard.writeText(text); toast.success("Copiado"); }}
          className="flex items-center gap-1 text-xs font-semibold rounded-lg border px-3 py-1.5 bg-background">
          <Copy className="w-3 h-3" /> Copiar
        </button>
        <a href={waLink(contact.wa_phone, text)} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs font-semibold rounded-lg border px-3 py-1.5 bg-background">
          <ExternalLink className="w-3 h-3" /> Abrir no WhatsApp
        </a>
        <button onClick={sendViaGateway} disabled={sending}
          className="flex items-center gap-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground px-3 py-1.5">
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Enviar pelo sistema
        </button>
      </div>
    </div>
  );
}
