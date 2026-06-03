import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";

const PENDING_ROLE_KEY = "cc-pending-role";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional().default("login"),
  role: z.enum(["contratante", "profissional"]).optional().default("contratante"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const { mode, role } = Route.useSearch();
  const navigate = useNavigate();
  const { user, role: currentRole, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [signupRole, setSignupRole] = useState<"contratante" | "profissional">(role);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (r: AppRole) => {
    if (r === "profissional") navigate({ to: "/pro" });
    else if (r === "admin") navigate({ to: "/admin" });
    else navigate({ to: "/app" });
  };

  // Aguarda role resolvida antes de redirecionar (evita race condition)
  useEffect(() => {
    if (loading || !user || !currentRole) return;
    const pending = localStorage.getItem(PENDING_ROLE_KEY) as AppRole | null;
    if (pending) {
      localStorage.removeItem(PENDING_ROLE_KEY);
      if (pending !== currentRole) {
        supabase.from("user_roles").insert({ user_id: user.id, role: pending }).then(({ error }) => {
          if (error && !error.code?.includes("23505")) { redirectTo(currentRole); return; }
          localStorage.setItem("cc-role-pref", pending);
          redirectTo(pending);
        });
      } else {
        localStorage.setItem("cc-role-pref", pending);
        redirectTo(pending);
      }
      return;
    }
    const saved = localStorage.getItem("cc-role-pref") as AppRole | null;
    redirectTo(saved ?? currentRole);
  }, [user, currentRole, loading]);

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
    localStorage.setItem(PENDING_ROLE_KEY, signupRole);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role: signupRole } },
    });
    setSubmitting(false);
    if (error) { localStorage.removeItem(PENDING_ROLE_KEY); toast.error(error.message); }
    else toast.success("Conta criada! Verifique seu e-mail.");
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Chamado Certo</h1>
          <p className="text-sm text-muted-foreground mt-1">Reparos com garantia de 90 dias</p>
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

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
              <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
              <button type="submit" disabled={submitting}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="grid grid-cols-2 gap-1 bg-muted rounded-xl p-1 mb-2">
                {(["contratante", "profissional"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setSignupRole(r)}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      signupRole === r ? "bg-background shadow-sm" : "text-muted-foreground"
                    }`}>
                    {r === "contratante" ? "Quero contratar" : "Sou profissional"}
                  </button>
                ))}
              </div>
              <input required placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
              <input required placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
              <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
              <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm bg-background" />
              <button type="submit" disabled={submitting}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Criar conta
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
