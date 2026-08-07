import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/conversas")({ component: ConversasPage });

interface Conversation {
  id: string;
  last_message_at: string | null;
  customer_contacts: { id: string; name: string; wa_phone: string; customers: { id: string; name: string } | null } | null;
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  author: "cliente" | "humano" | "ia";
  body: string | null;
  sent_at: string;
}

function ConversasPage() {
  const [selected, setSelected] = useState<Conversation | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversas"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wa_conversations")
        .select("id, last_message_at, customer_contacts(id, name, wa_phone, customers(id, name))")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as Conversation[];
    },
  });

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Conversas</h2>

      {(conversations ?? []).length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Nenhuma conversa registrada ainda.</p>
          <p>
            As conversas aparecem aqui automaticamente quando o gateway (Evolution API)
            estiver conectado e apontando o webhook para <code className="bg-muted px-1 rounded">/api/evolution-webhook</code>.
          </p>
          <p>Veja o passo a passo no README do projeto.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-xl border bg-card divide-y max-h-[70vh] overflow-y-auto">
            {(conversations ?? []).map((c) => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={cn("w-full text-left p-3 hover:bg-muted/50", selected?.id === c.id && "bg-muted")}>
                <p className="font-semibold text-sm truncate">
                  {c.customer_contacts?.customers?.name ?? c.customer_contacts?.name ?? "Contato"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.customer_contacts?.name} · {c.customer_contacts?.wa_phone}
                </p>
              </button>
            ))}
          </div>
          {selected ? (
            <Thread conversation={selected} />
          ) : (
            <div className="rounded-xl border bg-card flex items-center justify-center text-sm text-muted-foreground min-h-48">
              Selecione uma conversa
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Thread({ conversation }: { conversation: Conversation }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["conversa", conversation.id],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wa_messages")
        .select("id, direction, author, body, sent_at")
        .eq("conversation_id", conversation.id)
        .order("sent_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as Message[];
    },
  });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversation.customer_contacts) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ contact_id: conversation.customer_contacts.id, text }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Erro ${res.status}`);
      setText("");
      queryClient.invalidateQueries({ queryKey: ["conversa", conversation.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card flex flex-col max-h-[70vh]">
      <div className="p-3 border-b">
        <p className="font-semibold text-sm">{conversation.customer_contacts?.customers?.name}</p>
        <p className="text-xs text-muted-foreground">{conversation.customer_contacts?.name}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        {(messages ?? []).map((m) => (
          <div key={m.id} className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm",
            m.direction === "outbound"
              ? "ml-auto bg-primary/10"
              : "bg-muted")}>
            {m.author === "ia" && <p className="text-[9px] font-bold text-primary">IA</p>}
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(m.sent_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 border-t flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem…"
          className="flex-1 h-10 rounded-lg border px-3 text-sm bg-background" />
        <button type="submit" disabled={sending || !text.trim()}
          className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
