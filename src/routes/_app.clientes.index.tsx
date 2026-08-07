import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import { RADAR_META, type RadarEntry } from "@/lib/radar";

export const Route = createFileRoute("/_app/clientes/")({ component: ClientesPage });

function ClientesPage() {
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["radar-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("radar_current").select("*").order("name");
      if (error) throw error;
      return data as RadarEntry[];
    },
  });

  const filtered = (entries ?? []).filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Clientes</h2>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-3 py-2">
          <Plus className="w-4 h-4" /> Novo cliente
        </button>
      </header>

      {showNew && <NewCustomerForm onDone={() => setShowNew(false)} />}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…"
          className="w-full h-10 rounded-xl border pl-9 pr-3 text-sm bg-background" />
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {filtered.map((e) => (
            <Link key={e.customer_id} to="/clientes/$id" params={{ id: e.customer_id }}
              className="flex items-center justify-between gap-2 p-3 hover:bg-muted/50">
              <div className="min-w-0">
                <p className="font-semibold truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground">
                  {e.segment ?? "—"} · {e.order_count ?? 0} pedidos
                  {e.cycle_days_median ? ` · ciclo ~${Math.round(Number(e.cycle_days_median))}d` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {e.ticket_avg != null && <span className="text-sm font-semibold">{formatBRL(Number(e.ticket_avg))}</span>}
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${RADAR_META[e.state].badge}`}>
                  {RADAR_META[e.state].emoji} {RADAR_META[e.state].label}
                </span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}

function NewCustomerForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: customer, error } = await supabase
        .from("customers")
        .insert({ name, segment: segment || null, city: city || null })
        .select().single();
      if (error) throw error;
      if (contactName && phone) {
        const { error: cErr } = await supabase.from("customer_contacts").insert({
          customer_id: customer.id,
          name: contactName,
          wa_phone: phone.replace(/\D/g, ""),
          is_decision_maker: true,
        });
        if (cErr) throw cErr;
      }
      toast.success("Cliente cadastrado");
      queryClient.invalidateQueries({ queryKey: ["radar"] });
      queryClient.invalidateQueries({ queryKey: ["radar-list"] });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-xl border bg-card p-4 grid gap-2 md:grid-cols-2">
      <input required placeholder="Nome do cliente (ex.: Padaria X)" value={name} onChange={(e) => setName(e.target.value)}
        className="h-10 rounded-lg border px-3 text-sm bg-background md:col-span-2" />
      <input placeholder="Segmento (padaria, mercado…)" value={segment} onChange={(e) => setSegment(e.target.value)}
        className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)}
        className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <input placeholder="Nome do contato (ex.: João)" value={contactName} onChange={(e) => setContactName(e.target.value)}
        className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <input placeholder="WhatsApp com DDI (5527999998888)" value={phone} onChange={(e) => setPhone(e.target.value)}
        className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <div className="md:col-span-2 flex gap-2">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 flex items-center gap-2">
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Salvar
        </button>
        <button type="button" onClick={onDone} className="text-sm text-muted-foreground">Cancelar</button>
      </div>
    </form>
  );
}
