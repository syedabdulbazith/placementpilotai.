import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReadinessGauge, StatCard } from "@/components/app/widgets";
import { CountUp } from "@/components/app/count-up";
import { FileText, Target, Building2, MessageSquare, BrainCircuit, MapIcon, ArrowRight, TrendingUp, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PlacementPilot AI" }] }),
  component: Dashboard,
});

const trend = [
  { d: "Wk 1", s: 42 },{ d: "Wk 2", s: 51 },{ d: "Wk 3", s: 58 },
  { d: "Wk 4", s: 64 },{ d: "Wk 5", s: 72 },{ d: "Wk 6", s: 79 },{ d: "Now", s: 0 },
];

const radarData = [
  { skill: "DSA", value: 78 },{ skill: "System Design", value: 55 },
  { skill: "Communication", value: 82 },{ skill: "Aptitude", value: 68 },
  { skill: "Projects", value: 74 },{ skill: "Domain", value: 60 },
];

function Dashboard() {
  const { user } = Route.useRouteContext();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["counts", user.id],
    queryFn: async () => {
      const [r, s, i, rm] = await Promise.all([
        supabase.from("resume_analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("skill_assessments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("interview_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("roadmaps").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      return { resumes: r.count ?? 0, skills: s.count ?? 0, interviews: i.count ?? 0, roadmaps: rm.count ?? 0 };
    },
  });

  const score = profile?.readiness_score ?? 0;
  const liveTrend = trend.map((t, i) => (i === trend.length - 1 ? { ...t, s: score || 50 } : t));

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="glass-strong relative overflow-hidden rounded-2xl p-6 md:p-8">
        <div className="bg-gradient-primary pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl" />
        <div className="bg-gradient-primary pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full opacity-10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/copilot" className="glass hover-glow inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Powered by Enterprise Persona Intelligence
            </Link>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Welcome to <span className="gradient-text">PlacementPilot AI</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Enterprise AI Career Copilot for Smart Placements — hey {profile?.full_name?.split(" ")[0] ?? "Student"}, here's your snapshot.
            </p>
          </div>
          <div className="glass hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs md:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Enterprise Ready</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Readiness */}
        <div className="glass-strong hover-lift rounded-2xl p-6 lg:col-span-1">
          <h3 className="text-sm font-medium text-muted-foreground">AI Placement Readiness</h3>
          <div className="mt-4 flex flex-col items-center">
            <ReadinessGauge value={score} />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Based on resume, skills, mock interviews, and roadmap progress.
            </p>
          </div>
        </div>

        {/* Trend */}
        <div className="glass hover-lift rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Readiness Trend</h3>
            <span className="inline-flex items-center gap-1 text-xs text-success"><TrendingUp className="h-3 w-3" />+12 this week</span>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer>
              <AreaChart data={liveTrend}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.2 300)" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="d" stroke="currentColor" strokeOpacity={0.4} fontSize={11} />
                <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.045 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="s" stroke="oklch(0.7 0.2 300)" fill="url(#g)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Resumes Analyzed" value={<CountUp value={counts?.resumes ?? 0} />} icon={FileText} />
        <StatCard title="ATS Reports Generated" value={<CountUp value={counts?.resumes ?? 0} />} icon={Sparkles} />
        <StatCard title="Skill Gaps Identified" value={<CountUp value={counts?.skills ?? 0} />} icon={Target} />
        <StatCard title="Mock Interviews Completed" value={<CountUp value={counts?.interviews ?? 0} />} icon={BrainCircuit} />
      </div>


      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground">Skill Profile</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.7 }} />
                <PolarRadiusAxis stroke="currentColor" strokeOpacity={0.2} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="oklch(0.7 0.2 300)" fill="oklch(0.7 0.2 300)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Career Insight</h3>
          <div className="bg-gradient-primary mt-4 rounded-xl p-5 text-primary-foreground shadow-glow">
            <div className="text-xs opacity-90">Top predicted role</div>
            <div className="font-display text-2xl font-bold">Backend Engineer</div>
            <div className="mt-2 text-xs opacity-90">Confidence 87% · 12 matching companies</div>
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex justify-between"><span className="text-muted-foreground">Avg package fit</span><span className="font-semibold">₹ 14 LPA</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Interview readiness</span><span className="font-semibold">{score >= 70 ? "High" : "Medium"}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Suggested next step</span><span className="font-semibold">Mock Interview</span></li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-display text-xl font-semibold">Quick actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { to: "/resume", icon: FileText, title: "Analyze Resume", desc: "Get ATS score & feedback" },
            { to: "/skills", icon: Target, title: "Check Skill Gap", desc: "Compare with target role" },
            { to: "/eligibility", icon: Building2, title: "Find Companies", desc: "See where you qualify" },
            { to: "/chat", icon: MessageSquare, title: "Ask AI Assistant", desc: "Career guidance" },
            { to: "/interview", icon: BrainCircuit, title: "Mock Interview", desc: "Practice with AI" },
            { to: "/roadmap", icon: MapIcon, title: "Build a Roadmap", desc: "15 / 30 / 60-day plan" },
          ].map((a) => (
            <Link key={a.to} to={a.to} className="glass group rounded-2xl p-5 transition-all hover:shadow-glow">
              <div className="flex items-start justify-between">
                <div className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-lg shadow-glow">
                  <a.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 font-semibold">{a.title}</div>
              <div className="text-sm text-muted-foreground">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
