import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkEligibility } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Building2, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/eligibility")({
  head: () => ({ meta: [{ title: "Eligibility Checker — PlacementPilot AI" }] }),
  component: EligibilityPage,
});

type Company = { name: string; role: string; package_lpa: string; eligibility_percent: number; matched: string[]; gaps: string[]; action: string };

function EligibilityPage() {
  const [cgpa, setCgpa] = useState("8.2");
  const [department, setDepartment] = useState("Computer Science");
  const [skills, setSkills] = useState("Java, DSA, SQL, React");
  const fn = useServerFn(checkEligibility);
  const m = useMutation({
    mutationFn: async () => fn({ data: { cgpa: parseFloat(cgpa), department, skills: skills.split(",").map(s => s.trim()).filter(Boolean) } }),
    onError: (e: Error) => toast.error(e.message),
  });
  const companies = (m.data?.results ?? []) as Company[];

  return (
    <div className="space-y-6">
      <PageHeader title="Company Eligibility Checker" description="See which top recruiters you qualify for and what's missing." />

      <div className="glass-strong grid gap-4 rounded-2xl p-6 md:grid-cols-[auto_1fr_2fr_auto] md:items-end">
        <div className="space-y-2"><Label>CGPA</Label><Input value={cgpa} onChange={e => setCgpa(e.target.value)} className="w-24" /></div>
        <div className="space-y-2"><Label>Department</Label><Input value={department} onChange={e => setDepartment(e.target.value)} /></div>
        <div className="space-y-2"><Label>Skills</Label><Input value={skills} onChange={e => setSkills(e.target.value)} /></div>
        <Button variant="hero" disabled={m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Check
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((c) => (
          <div key={c.name} className="glass rounded-2xl p-5 transition-all hover:shadow-glow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-primary flex h-11 w-11 items-center justify-center rounded-xl shadow-glow">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.role} · {c.package_lpa}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold">{c.eligibility_percent}<span className="text-xs text-muted-foreground">%</span></div>
              </div>
            </div>
            <Progress className="mt-3" value={c.eligibility_percent} />
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <div className="mb-1.5 inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />Matched</div>
                <div className="flex flex-wrap gap-1">{c.matched.map(s => <span key={s} className="glass rounded-full px-2 py-0.5 text-xs">{s}</span>)}</div>
              </div>
              <div>
                <div className="mb-1.5 inline-flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" />Gaps</div>
                <div className="flex flex-wrap gap-1">{c.gaps.map(s => <span key={s} className="glass rounded-full px-2 py-0.5 text-xs">{s}</span>)}</div>
              </div>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground"><b className="text-foreground">Action:</b> {c.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
