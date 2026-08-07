import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/equipe")({ component: EquipePage });

function EquipePage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["equipe"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      return { profiles: profiles.data, roles: roles.data };
    },
  });

  const rolesOf = (userId: string) =>
    (data?.roles ?? []).filter((r) => r.user_id === userId).map((r) => r.role);

  const approve = async (userId: string, role: "operador" | "admin") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else {
      toast.success("Acesso liberado");
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
    }
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Equipe</h2>
      {!isAdmin && (
        <p className="text-sm text-muted-foreground">Somente administradores podem aprovar novos membros.</p>
      )}
      <div className="rounded-xl border bg-card divide-y">
        {(data?.profiles ?? []).map((p) => {
          const roles = rolesOf(p.id);
          return (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold truncate">{p.full_name ?? p.email}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {roles.includes("admin") && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> admin
                  </span>
                )}
                {roles.includes("operador") && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-muted">operador</span>
                )}
                {roles.length === 0 && (
                  isAdmin ? (
                    <button onClick={() => approve(p.id, "operador")}
                      className="flex items-center gap-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground px-3 py-1.5">
                      <UserCheck className="w-3 h-3" /> Aprovar como operador
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-semibold">aguardando aprovação</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
