import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "contratante" | "profissional" | "admin";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;       // papel ativo
  allRoles: AppRole[];        // todos os papéis do usuário
  loading: boolean;
  signOut: () => Promise<void>;
  setActiveRole: (r: AppRole) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,  setSession]  = useState<Session | null>(null);
  const [user,     setUser]     = useState<User | null>(null);
  const [role,     setRole]     = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        resolveRoles(newSession.user.id);
      } else {
        setRole(null);
        setAllRoles([]);
        setLoading(false);
      }
    });
    const safetyTimer = setTimeout(() => setLoading(false), 5000);
    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer); };
  }, []);

  async function resolveRoles(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const roles = (data ?? []).map((r) => r.role as AppRole);
    setAllRoles(roles);

    const saved = localStorage.getItem("cc-role-pref") as AppRole | null;
    const effective = saved && roles.includes(saved) ? saved : (roles[0] ?? "contratante");
    setRole(effective);
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setAllRoles([]);
    localStorage.removeItem("cc-role-pref");
  };

  const setActiveRole = (newRole: AppRole) => {
    if (!allRoles.includes(newRole)) return;
    localStorage.setItem("cc-role-pref", newRole);
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, allRoles, loading, signOut, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
