import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeSkillGap } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Sparkles, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skill Gap — PlacementPilot AI" }] }),
  component: SkillsPage,
});

function SkillsPage() {
  const [role, setRole] = useState("Backend Engineer");
  const [skills, setSkills] = useState("JavaScript, React, Node.js, SQL");
  const fn = useServerFn(analyzeSkillGap);
  const m = useMutation({
    mutationFn: async () => fn({ data: { targetRole: role, currentSkills: skills.split(",").map((s) => s.trim()).filter(Boolean) } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const result = m.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" description="See where you stand vs. your target role and what to learn next." />

      <div className="glass-strong grid gap-4 rounded-2xl p-6 md:grid-cols-[1fr_2fr_auto] md:items-end">
        <div className="space-y-2">
          <Label>Target role</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Data Scientist" />
        </div>
        <div className="space-y-2">
          <Label>Your skills (comma-separated)</Label>
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <Button variant="hero" disabled={m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Analyze
        </Button>
      </div>

      {result && (
        <>
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-muted-foreground">Match for {role}</h3>
                <div className="font-display text-4xl font-bold">{result.match_percent}<span className="text-base text-muted-foreground">%</span></div>
              </div>
              <Target className="h-10 w-10 text-accent" />
            </div>
            <Progress className="mt-4" value={result.match_percent ?? 0} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <h3 className="mb-4 font-semibold">Missing skills</h3>
              <div className="space-y-3">
                {(result.missing_skills as { skill: string; priority: string; reason: string }[]).map((s) => (
                  <div key={s.skill} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.skill}</span>
                      <Badge variant={s.priority === "high" ? "destructive" : s.priority === "medium" ? "default" : "secondary"}>{s.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="mb-4 font-semibold">Recommended learning path</h3>
              <ol className="space-y-3">
                {(result.recommendations as { topic: string; resource: string; duration_weeks: number }[]).map((r, i) => (
                  <li key={i} className="glass flex items-start gap-3 rounded-xl p-4">
                    <div className="bg-gradient-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">{i + 1}</div>
                    <div>
                      <div className="font-medium">{r.topic}</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><BookOpen className="h-3 w-3" />{r.resource} · ~{r.duration_weeks} wk</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
