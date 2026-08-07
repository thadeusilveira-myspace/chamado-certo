import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/playbook")({ component: PlaybookPage });

function PlaybookPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["playbook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_entries").select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["playbook"] });

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("playbook_entries").update({ active }).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Playbook Comercial</h2>
          <p className="text-sm text-muted-foreground">
            O DNA comercial da empresa: abordagens que funcionam, aprendidas com toda a equipe.
            A IA usa as entradas ativas ao gerar sugestões no Radar.
          </p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-3 py-2 shrink-0">
          <Plus className="w-4 h-4" /> Nova entrada
        </button>
      </header>

      {showNew && <NewEntryForm onDone={() => { setShowNew(false); refresh(); }} />}

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2">
          {(entries ?? []).map((e) => (
            <div key={e.id} className={`rounded-xl border bg-card p-4 ${!e.active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">QUANDO: <span className="font-normal text-foreground">{e.situation}</span></p>
                  <p className="text-xs font-bold text-muted-foreground">ABORDAGEM: <span className="font-normal text-foreground">{e.approach}</span></p>
                  {e.example_message && (
                    <p className="text-sm bg-muted rounded-lg p-2 mt-1">"{e.example_message}"</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {e.learned_from ? `Aprendido com: ${e.learned_from} · ` : ""}
                    {e.times_used > 0
                      ? `Conversão: ${e.times_converted}/${e.times_used} (${Math.round((e.times_converted / e.times_used) * 100)}%)`
                      : "Ainda não usada"}
                  </p>
                </div>
                <label className="flex items-center gap-1 text-xs shrink-0">
                  <input type="checkbox" checked={e.active} onChange={(ev) => toggleActive(e.id, ev.target.checked)} />
                  ativa
                </label>
              </div>
            </div>
          ))}
          {(entries ?? []).length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Playbook vazio.</p>
              <p className="mt-1">
                Registre aqui as abordagens que funcionam — da Beid, do André, de quem for.
                Ex.: "Cliente atrasado no ciclo, relação informal → lembrete curto citando a rota de entrega".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewEntryForm({ onDone }: { onDone: () => void }) {
  const [situation, setSituation] = useState("");
  const [approach, setApproach] = useState("");
  const [example, setExample] = useState("");
  const [learnedFrom, setLearnedFrom] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("playbook_entries").insert({
      situation, approach,
      example_message: example || null,
      learned_from: learnedFrom || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Entrada adicionada ao playbook"); onDone(); }
  };

  return (
    <form onSubmit={save} className="rounded-xl border bg-card p-4 grid gap-2">
      <input required placeholder="Situação (ex.: cliente atrasado no ciclo, relação informal)" value={situation}
        onChange={(e) => setSituation(e.target.value)} className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <input required placeholder="Abordagem (ex.: lembrete curto citando a rota de entrega)" value={approach}
        onChange={(e) => setApproach(e.target.value)} className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <input placeholder="Mensagem de exemplo (opcional)" value={example}
        onChange={(e) => setExample(e.target.value)} className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <input placeholder="Aprendido com (ex.: Beid)" value={learnedFrom}
        onChange={(e) => setLearnedFrom(e.target.value)} className="h-10 rounded-lg border px-3 text-sm bg-background" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 flex items-center gap-2">
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Salvar
        </button>
        <button type="button" onClick={onDone} className="text-sm text-muted-foreground">Cancelar</button>
      </div>
    </form>
  );
}
