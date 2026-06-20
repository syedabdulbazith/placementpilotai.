import { createFileRoute, Outlet, redirect, Link, useRouter, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, FileText, Target, Building2, MessageSquare,
  MapIcon, BrainCircuit, Shield, LogOut, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/skills", label: "Skill Gap", icon: Target },
  { to: "/eligibility", label: "Eligibility", icon: Building2 },
  { to: "/chat", label: "AI Assistant", icon: MessageSquare },
  { to: "/interview", label: "Interview Prep", icon: BrainCircuit },
  { to: "/roadmap", label: "Roadmap", icon: MapIcon },
] as const;

function AppShell() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const qc = useQueryClient();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform md:relative md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="glass-strong flex h-full flex-col p-4">
          <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="font-display font-bold tracking-tight">PlacementPilot<span className="gradient-text"> AI</span></span>
          </Link>
          <nav className="flex-1 space-y-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to}
                activeProps={{ className: "bg-gradient-primary text-primary-foreground shadow-glow" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-accent/20 hover:text-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all">
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                activeProps={{ className: "bg-gradient-primary text-primary-foreground shadow-glow" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-accent/20 hover:text-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all">
                <Shield className="h-4 w-4" />Admin
              </Link>
            )}
          </nav>
          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center gap-3 px-2">
              <div className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                {(user.email ?? "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.email}</div>
                <div className="text-xs text-muted-foreground">Student</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
              <LogOut className="h-4 w-4" />Sign out
            </Button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="glass flex items-center justify-between px-4 py-3 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7 w-7" />
            <span className="font-display font-bold">PlacementPilot AI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
