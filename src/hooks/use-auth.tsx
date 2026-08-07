import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "operador" | "admin";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isTeam: boolean;    // tem pelo menos um papel → acesso liberado
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        resolveRoles(newSession.user.id);
      } else {
        setRoles([]);
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
      .eq("user_id", userId);
    setRoles((data ?? []).map((r) => r.role as AppRole));
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{
      user, session, roles,
      isTeam: roles.length > 0,
      isAdmin: roles.includes("admin"),
      loading, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
