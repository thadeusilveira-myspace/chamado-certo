import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Radar, Users, Package, MessageCircle, UserCog, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({ component: AppLayout });

const NAV = [
  { to: "/radar",    label: "Radar",    icon: Radar },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pedidos",  label: "Pedidos",  icon: Package },
  { to: "/conversas", label: "Conversas", icon: MessageCircle },
  { to: "/equipe",   label: "Equipe",   icon: UserCog },
] as const;

function AppLayout() {
  const { user, isTeam, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold">Aguardando aprovação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta foi criada, mas ainda precisa ser aprovada por um administrador
            na página <strong>Equipe</strong>.
          </p>
          <button onClick={signOut} className="mt-6 text-sm text-primary underline">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (desktop) / topbar (mobile) */}
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r bg-card">
        <div className="p-4 flex md:block items-center justify-between">
          <div>
            <h1 className="font-black text-primary leading-tight">D'GUST</h1>
            <p className="text-[11px] text-muted-foreground">Continuidade Comercial</p>
          </div>
          <button onClick={signOut} title="Sair"
            className="md:hidden text-muted-foreground"><LogOut className="w-4 h-4" /></button>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-2 md:pb-4 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground whitespace-nowrap hover:bg-muted"
              activeProps={{ className: cn("bg-muted text-foreground") }}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
          <button onClick={signOut}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted mt-4">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
