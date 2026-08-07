import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDate } from "@/lib/utils";
import { stripZeros } from "@/lib/radar";

const searchSchema = z.object({ cliente: z.string().optional() });

export const Route = createFileRoute("/_app/pedidos")({
  validateSearch: (s) => searchSchema.parse(s),
  component: PedidosPage,
});

function PedidosPage() {
  const { cliente } = Route.useSearch();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: async () => {
      const [orders, customers] = await Promise.all([
        supabase.from("orders").select("*, customers(name)").order("confirmed_at", { ascending: false }).limit(50),
        supabase.from("customers").select("id, name").order("name"),
      ]);
      if (orders.error) throw orders.error;
      if (customers.error) throw customers.error;
      return { orders: orders.data, customers: customers.data };
    },
  });

  const [customerId, setCustomerId] = useState(cliente ?? "");
  const [qty, setQty] = useState("");
  const [total, setTotal] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Selecione o cliente"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("orders").insert({
      customer_id: customerId,
      qty_total: qty ? Number(qty) : null,
      total: Number(total),
      delivery_date: deliveryDate || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido registrado — radar atualizado");
    setQty(""); setTotal(""); setDeliveryDate("");
    queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    queryClient.invalidateQueries({ queryKey: ["radar"] });
    queryClient.invalidateQueries({ queryKey: ["radar-list"] });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Pedidos</h2>

      <form onSubmit={save} className="rounded-xl border bg-card p-4 grid gap-2 md:grid-cols-5">
        <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}
          className="h-10 rounded-lg border px-2 text-sm bg-background md:col-span-2">
          <option value="">Cliente…</option>
          {(data?.customers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" step="any" min="0" placeholder="Qtd (un)" value={qty} onChange={(e) => setQty(e.target.value)}
          className="h-10 rounded-lg border px-3 text-sm bg-background" />
        <input type="number" step="0.01" min="0" required placeholder="Valor total (R$)" value={total} onChange={(e) => setTotal(e.target.value)}
          className="h-10 rounded-lg border px-3 text-sm bg-background" />
        <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
          title="Data de entrega" className="h-10 rounded-lg border px-3 text-sm bg-background" />
        <button type="submit" disabled={saving}
          className="h-10 rounded-lg bg-primary text-primary-foreground text-sm font-bold px-4 md:col-span-5 md:w-fit flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar pedido
        </button>
      </form>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {(data?.orders ?? []).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <Link to="/clientes/$id" params={{ id: o.customer_id }} className="font-semibold hover:underline">
                  {(o.customers as { name: string } | null)?.name ?? "—"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Confirmado {formatDate(o.confirmed_at)}
                  {o.delivery_date ? ` · entrega ${formatDate(o.delivery_date + "T12:00:00")}` : ""}
                  {o.qty_total != null ? ` · ${stripZeros(Number(o.qty_total))} un` : ""}
                </p>
              </div>
              <span className="font-bold shrink-0">{formatBRL(Number(o.total))}</span>
            </div>
          ))}
          {(data?.orders ?? []).length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
