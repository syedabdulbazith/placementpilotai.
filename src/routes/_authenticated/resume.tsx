import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/widgets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Lightbulb, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadResumeReport } from "@/lib/pdf-report";
import { extractResumeText } from "@/lib/resume-extract";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume Analyzer — PlacementPilot AI" }] }),
  component: ResumePage,
});

function ResumePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("My Resume");
  const analyzeFn = useServerFn(analyzeResume);

  const { data: history } = useQuery({
    queryKey: ["resumes", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("resume_analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const latest = history?.[0];

  const m = useMutation({
    mutationFn: async () => analyzeFn({ data: { fileName, text } }),
    onSuccess: (result) => {
      if (result.summary?.includes("could not be completed")) {
        toast.warning("AI analysis could not be completed. A safe fallback result was saved.");
      } else {
        toast.success("Resume analyzed!");
      }
      qc.invalidateQueries({ queryKey: ["resumes"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("We couldn't analyze your resume right now. Please try again."),
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const toastId = toast.loading("Reading your resume…");
    const result = await extractResumeText(f);
    toast.dismiss(toastId);
    if (!result.ok) {
      setText("");
      toast.error(result.error);
      return;
    }
    setText(result.text);
    toast.success("Resume loaded. Click Analyze with AI.");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Resume Analyzer" description="Get an ATS score, strengths, weaknesses, and tailored improvements." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-strong space-y-4 rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Upload or paste your resume</h3>
          </div>
          <label className="glass flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-border py-8 text-sm text-muted-foreground hover:bg-accent/10">
            <Upload className="h-4 w-4" />
            <span>{fileName !== "My Resume" ? fileName : "Click to upload .txt / drop here"}</span>
            <input type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={onFile} />
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Paste your resume text here..."
            className="resize-none"
          />
          <Button variant="hero" className="w-full" disabled={m.isPending || text.length < 50} onClick={() => m.mutate()}>
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze with AI
          </Button>
        </div>

        <div className="space-y-4">
          {latest ? (
            <>
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm text-muted-foreground">{latest.file_name}</h3>
                    <div className="mt-1 font-display text-4xl font-bold">{latest.overall_score}<span className="text-base text-muted-foreground">/100</span></div>
                  </div>
                  <Button variant="glass" size="sm" onClick={() => downloadResumeReport(latest)}>
                    <Download className="h-4 w-4" />PDF Report
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  <Row label="Overall score" value={latest.overall_score ?? 0} />
                  <Row label="ATS compatibility" value={latest.ats_score ?? 0} />
                </div>
                {latest.summary && <p className="mt-4 text-sm text-muted-foreground">{latest.summary}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ListCard icon={CheckCircle2} title="Strengths" tone="success" items={latest.strengths ?? []} />
                <ListCard icon={AlertCircle} title="Weaknesses" tone="destructive" items={latest.weaknesses ?? []} />
              </div>
              <ListCard icon={Lightbulb} title="Improvement suggestions" tone="accent" items={latest.suggestions ?? []} />
              {latest.detected_skills?.length ? (
                <div className="glass rounded-2xl p-5">
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">Missing keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {latest.detected_skills.map((s) => (
                      <span key={s} className="glass rounded-full px-3 py-1 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="glass flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl p-8 text-center">
              <Sparkles className="h-10 w-10 text-accent" />
              <h3 className="mt-4 font-display text-xl font-semibold">No analysis yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Paste your resume to get an AI-powered ATS evaluation in seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}/100</span></div>
      <Progress value={value} />
    </div>
  );
}

function ListCard({ icon: Icon, title, items, tone }: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[]; tone: "success" | "destructive" | "accent" }) {
  const toneCls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-accent";
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`mb-3 flex items-center gap-2 ${toneCls}`}>
        <Icon className="h-4 w-4" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <ul className="space-y-2 text-sm">
        {items.length === 0 ? <li className="text-muted-foreground">—</li> : items.map((i) => (
          <li key={i} className="flex gap-2"><span className={toneCls}>•</span><span>{i}</span></li>
        ))}
      </ul>
    </div>
  );
}
