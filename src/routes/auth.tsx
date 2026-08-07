import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/radar", replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) toast.error(error.message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">D'GUST</h1>
          <p className="text-sm text-muted-foreground mt-1">Continuidade Comercial — Radar de Pedidos</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border">
          <div className="grid grid-cols-2 gap-1 bg-muted rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`py-2 text-sm font-semibold rounded-lg transition ${
                  tab === t ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}>
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-3">
            {tab === "signup" && (
              <input required placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
            )}
            <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
            <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
            <button type="submit" disabled={submitting}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          O primeiro usuário cadastrado vira administrador; os demais precisam de aprovação.
        </p>
      </div>
    </div>
  );
}
