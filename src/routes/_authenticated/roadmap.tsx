import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateRoadmap } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, Download, Clock } from "lucide-react";
import { toast } from "sonner";
import { downloadRoadmapReport } from "@/lib/pdf-report";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — PlacementPilot AI" }] }),
  component: RoadmapPage,
});

type Day = { day: number; theme: string; tasks: string[]; resources: string[]; time_hours: number };

function RoadmapPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [goal, setGoal] = useState("Crack a product-based company internship");
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const fn = useServerFn(generateRoadmap);

  const { data: existing } = useQuery({
    queryKey: ["roadmap-latest", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const m = useMutation({
    mutationFn: async () => fn({ data: { goal, durationDays: duration, currentSkills: [] } }),
    onSuccess: () => {
      toast.success("Roadmap generated!");
      qc.invalidateQueries({ queryKey: ["roadmap-latest"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = m.data ?? existing;
  const days = (active?.plan as { overview?: string; days?: Day[] } | null)?.days ?? [];
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const progress = days.length ? Math.round((Object.values(completed).filter(Boolean).length / days.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Personalized Roadmap" description="A day-by-day plan tailored to your goal and timeframe." />

      <div className="glass-strong grid gap-4 rounded-2xl p-6 md:grid-cols-[2fr_auto_auto]">
        <div className="space-y-2"><Label>Your goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="flex gap-2">
            {([15, 30, 60] as const).map(d => (
              <Button key={d} type="button" variant={duration === d ? "hero" : "glass"} size="sm" onClick={() => setDuration(d)}>{d} days</Button>
            ))}
          </div>
        </div>
        <div className="flex items-end"><Button variant="hero" disabled={m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generate
        </Button></div>
      </div>

      {active && (
        <>
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold">{active.goal}</h3>
                <p className="text-sm text-muted-foreground">{active.duration_days}-day plan · {progress}% complete</p>
              </div>
              <Button variant="glass" onClick={() => downloadRoadmapReport(active as unknown as Parameters<typeof downloadRoadmapReport>[0])}><Download className="h-4 w-4" />Download PDF</Button>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="bg-gradient-primary h-full transition-all" style={{ width: `${progress}%` }} /></div>
            {(active.plan as { overview?: string } | null)?.overview && (
              <p className="mt-4 text-sm text-muted-foreground">{(active.plan as { overview: string }).overview}</p>
            )}
          </div>

          <div className="grid gap-3">
            {days.map((d) => (
              <div key={d.day} className="glass rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <Checkbox checked={!!completed[d.day]} onCheckedChange={(v) => setCompleted(c => ({ ...c, [d.day]: !!v }))} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">Day {d.day} · {d.theme}</h4>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{d.time_hours}h</span>
                    </div>
                    <ul className="mt-3 grid gap-1 text-sm md:grid-cols-2">
                      {d.tasks.map((t, i) => <li key={i} className="flex gap-2"><span className="text-accent">✓</span><span>{t}</span></li>)}
                    </ul>
                    {d.resources?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {d.resources.map((r, i) => <span key={i} className="glass rounded-full px-2 py-0.5 text-xs">{r}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
