import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDate } from "@/lib/utils";
import { RADAR_META, DOW_NAMES, stripZeros, type RadarEntry } from "@/lib/radar";

export const Route = createFileRoute("/_app/clientes/$id")({ component: ClienteDetail });

const FACT_TYPES = [
  "decisor", "estilo_comunicacao", "gatilho_fechamento",
  "horario_resposta", "precisa_lembrete", "alerta", "outro",
];

const AUTOMATION_LABELS: Record<string, string> = {
  observacao: "Observação (sem IA)",
  copiloto: "Copiloto (IA sugere, humano envia)",
  supervisionado: "Supervisionado (IA envia, humano acompanha)",
  autonomo: "Autônomo",
};

function ClienteDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
      const [radar, facts, orders, contacts] = await Promise.all([
        supabase.from("radar_current").select("*").eq("customer_id", id).single(),
        supabase.from("customer_facts").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("customer_id", id).order("confirmed_at", { ascending: false }).limit(20),
        supabase.from("customer_contacts").select("*").eq("customer_id", id),
      ]);
      if (radar.error) throw radar.error;
      return {
        entry: radar.data as RadarEntry,
        facts: facts.data ?? [],
        orders: orders.data ?? [],
        contacts: contacts.data ?? [],
      };
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["cliente", id] });
    queryClient.invalidateQueries({ queryKey: ["radar"] });
    queryClient.invalidateQueries({ queryKey: ["radar-list"] });
  };

  if (isLoading || !data) return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
  const { entry, facts, orders, contacts } = data;

  const setField = async (patch: Record<string, unknown>) => {
    const { error } = await supabase.from("customers").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); refresh(); }
  };

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="text-sm text-muted-foreground flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Clientes
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{entry.name}</h2>
          <p className="text-sm text-muted-foreground">{entry.segment ?? "—"}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${RADAR_META[entry.state].badge}`}>
          {RADAR_META[entry.state].emoji} {RADAR_META[entry.state].label}
        </span>
      </header>

      {/* Memória comercial resumida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Ciclo de compra" value={entry.cycle_days_median ? `~${Math.round(Number(entry.cycle_days_median))} dias` : "—"} />
        <Card label="Quantidade típica" value={entry.qty_median ? `${stripZeros(Number(entry.qty_median))} un` : "—"} />
        <Card label="Ticket médio" value={entry.ticket_avg ? formatBRL(Number(entry.ticket_avg)) : "—"} />
        <Card label="Costuma confirmar" value={
          entry.typical_confirm_dow != null
            ? `${DOW_NAMES[entry.typical_confirm_dow]}${entry.typical_confirm_hour != null ? `, ~${entry.typical_confirm_hour}h` : ""}`
            : "—"
        } />
      </div>

      {/* Controles de automação */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold">Automação</h3>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            Nível:
            <select value={entry.automation_level}
              onChange={(e) => setField({ automation_level: e.target.value })}
              className="h-9 rounded-lg border px-2 bg-background">
              {Object.entries(AUTOMATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={entry.do_not_contact}
              onChange={(e) => setField({ do_not_contact: e.target.checked })} />
            Não contatar (opt-out)
          </label>
        </div>
      </div>

      {/* Contatos */}
      <Section title={`Contatos (${contacts.length})`}>
        {contacts.map((c) => (
          <Row key={c.id}
            left={<span>{c.name} {c.is_decision_maker && <em className="text-[10px] not-italic font-bold text-primary">DECISOR</em>}</span>}
            right={<span className="text-muted-foreground">{c.wa_phone}</span>} />
        ))}
        <AddContact customerId={id} onDone={refresh} />
      </Section>

      {/* Fatos comportamentais */}
      <Section title={`Fatos comportamentais (${facts.length})`}>
        {facts.map((f) => (
          <Row key={f.id}
            left={<span><em className="not-italic text-[10px] font-bold text-muted-foreground mr-2">{f.fact_type.toUpperCase()}</em>{f.value}</span>}
            right={<span className="text-[10px] text-muted-foreground">{f.source}</span>} />
        ))}
        <div className="flex flex-wrap gap-4 items-center">
          <AddFact customerId={id} onDone={refresh} />
          <ExtractFactsButton customerId={id} onDone={refresh} />
        </div>
      </Section>

      {/* Pedidos */}
      <Section title={`Últimos pedidos (${orders.length})`}>
        {orders.map((o) => (
          <Row key={o.id}
            left={<span>{formatDate(o.confirmed_at)} {o.qty_total != null && <span className="text-muted-foreground">· {stripZeros(Number(o.qty_total))} un</span>}</span>}
            right={<span className="font-semibold">{formatBRL(Number(o.total))}</span>} />
        ))}
        {orders.length === 0 && <p className="text-sm text-muted-foreground p-2">Nenhum pedido registrado.</p>}
        <Link to="/pedidos" search={{ cliente: id }} className="text-sm text-primary underline inline-block mt-1">
          Registrar pedido
        </Link>
      </Section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 text-sm">
      <div className="min-w-0">{left}</div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

function AddFact({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(FACT_TYPES[0]);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm text-primary py-2">
        <Plus className="w-3 h-3" /> Adicionar fato
      </button>
    );
  }
  return (
    <form className="py-2 flex flex-wrap gap-2" onSubmit={async (e) => {
      e.preventDefault();
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("customer_facts").insert({
        customer_id: customerId, fact_type: type, value, source: "humano", created_by: user?.id,
      });
      setSaving(false);
      if (error) toast.error(error.message);
      else { setValue(""); setOpen(false); onDone(); }
    }}>
      <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-lg border px-2 text-sm bg-background">
        {FACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input required value={value} onChange={(e) => setValue(e.target.value)}
        placeholder="Ex.: Quando diz 'vou ver', fecha no 2º contato"
        className="h-9 rounded-lg border px-3 text-sm bg-background flex-1 min-w-48" />
      <button type="submit" disabled={saving} className="h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-3">
        Salvar
      </button>
    </form>
  );
}

function ExtractFactsButton({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/extract-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Erro ${res.status}`);
      toast.success(body.extracted > 0
        ? `${body.extracted} fato(s) novo(s) extraído(s) das conversas`
        : "Nenhum fato novo encontrado nas conversas");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na extração");
    } finally {
      setRunning(false);
    }
  };

  return (
    <button onClick={run} disabled={running}
      className="flex items-center gap-1 text-sm text-primary py-2">
      {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      Extrair fatos das conversas (IA)
    </button>
  );
}

function AddContact({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm text-primary py-2">
        <Plus className="w-3 h-3" /> Adicionar contato
      </button>
    );
  }
  return (
    <form className="py-2 flex flex-wrap gap-2" onSubmit={async (e) => {
      e.preventDefault();
      setSaving(true);
      const { error } = await supabase.from("customer_contacts").insert({
        customer_id: customerId, name, wa_phone: phone.replace(/\D/g, ""),
      });
      setSaving(false);
      if (error) toast.error(error.message);
      else { setName(""); setPhone(""); setOpen(false); onDone(); }
    }}>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome"
        className="h-9 rounded-lg border px-3 text-sm bg-background" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp com DDI"
        className="h-9 rounded-lg border px-3 text-sm bg-background" />
      <button type="submit" disabled={saving} className="h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-3">
        Salvar
      </button>
    </form>
  );
}
