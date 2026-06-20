import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app/widgets";
import { Users, FileText, BrainCircuit, MapIcon, ShieldAlert } from "lucide-react";
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PlacementPilot AI" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

function Admin() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [p, r, i, rm] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("resume_analyses").select("id", { count: "exact", head: true }),
        supabase.from("interview_sessions").select("id", { count: "exact", head: true }),
        supabase.from("roadmaps").select("id", { count: "exact", head: true }),
      ]);
      return { users: p.count ?? 0, resumes: r.count ?? 0, interviews: i.count ?? 0, roadmaps: rm.count ?? 0 };
    },
  });

  const { data: scoreBuckets } = useQuery({
    queryKey: ["admin-scores"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("readiness_score");
      const buckets = [
        { range: "0-20", count: 0 }, { range: "21-40", count: 0 },
        { range: "41-60", count: 0 }, { range: "61-80", count: 0 },
        { range: "81-100", count: 0 },
      ];
      (data ?? []).forEach((p) => {
        const s = p.readiness_score ?? 0;
        const idx = Math.min(4, Math.floor(s / 21));
        buckets[idx].count++;
      });
      return buckets;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Overview of users and platform activity." action={<ShieldAlert className="h-6 w-6 text-accent" />} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total users" value={stats?.users ?? 0} icon={Users} />
        <StatCard title="Resume analyses" value={stats?.resumes ?? 0} icon={FileText} />
        <StatCard title="Mock interviews" value={stats?.interviews ?? 0} icon={BrainCircuit} />
        <StatCard title="Roadmaps" value={stats?.roadmaps ?? 0} icon={MapIcon} />
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <h3 className="font-semibold">Placement readiness distribution</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <BarChart data={scoreBuckets ?? []}>
              <CartesianGrid strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="range" stroke="currentColor" strokeOpacity={0.4} fontSize={12} />
              <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.045 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
              <Bar dataKey="count" fill="oklch(0.7 0.2 300)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
