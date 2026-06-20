import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateInterviewQuestions, evaluateAnswer } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BrainCircuit, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Interview Prep — PlacementPilot AI" }] }),
  component: InterviewPage,
});

type Q = { question: string; category: string; difficulty: "easy" | "medium" | "hard"; ideal_answer: string; tips: string[] };

function InterviewPage() {
  const [type, setType] = useState<"technical" | "hr" | "aptitude" | "mock">("technical");
  const [role, setRole] = useState("Software Engineer");
  const gen = useServerFn(generateInterviewQuestions);
  const evalFn = useServerFn(evaluateAnswer);

  const m = useMutation({
    mutationFn: async () => gen({ data: { type, role, count: 8 } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const questions = (m.data?.questions ?? []) as Q[];

  return (
    <div className="space-y-6">
      <PageHeader title="Interview Preparation" description="AI-generated technical, HR, and aptitude questions with mock practice." />

      <div className="glass-strong space-y-4 rounded-2xl p-6">
        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="aptitude">Aptitude</TabsTrigger>
            <TabsTrigger value="mock">Mock</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-4 md:grid-cols-[2fr_auto] md:items-end">
          <div className="space-y-2"><Label>Target role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} /></div>
          <Button variant="hero" disabled={m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generate questions
          </Button>
        </div>
      </div>

      {questions.length > 0 && (
        <Accordion type="single" collapsible className="space-y-3">
          {questions.map((q, i) => (
            <AccordionItem key={i} value={String(i)} className="glass rounded-2xl border-0 px-5">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-start gap-3 text-left">
                  <div className="bg-gradient-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground">{i + 1}</div>
                  <div>
                    <div className="font-medium">{q.question}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">{q.category}</Badge>
                      <Badge variant={q.difficulty === "hard" ? "destructive" : q.difficulty === "medium" ? "default" : "secondary"}>{q.difficulty}</Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <QuestionDetail q={q} evaluate={(answer) => evalFn({ data: { question: q.question, answer, idealAnswer: q.ideal_answer } })} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {questions.length === 0 && !m.isPending && (
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-12 text-center">
          <BrainCircuit className="h-10 w-10 text-accent" />
          <h3 className="mt-3 font-display text-xl font-semibold">Pick a type, generate questions</h3>
          <p className="mt-1 text-sm text-muted-foreground">Practice answers and get instant AI feedback.</p>
        </div>
      )}
    </div>
  );
}

function QuestionDetail({ q, evaluate }: { q: Q; evaluate: (answer: string) => Promise<{ score: number; feedback: string; improvements: string[] }> }) {
  const [answer, setAnswer] = useState("");
  const ev = useMutation({ mutationFn: evaluate, onError: (e: Error) => toast.error(e.message) });
  return (
    <div className="space-y-4 pt-2">
      <div className="glass rounded-xl p-4">
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ideal answer</h4>
        <p className="text-sm">{q.ideal_answer}</p>
        {q.tips.length > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <h4 className="mb-2 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-accent"><Lightbulb className="h-3 w-3" />Tips</h4>
            <ul className="space-y-1 text-sm">{q.tips.map((t, i) => <li key={i}>• {t}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Your answer</Label>
        <Textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer to get AI feedback…" />
        <Button variant="glass" size="sm" disabled={ev.isPending || answer.length < 10} onClick={() => ev.mutate(answer)}>
          {ev.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Evaluate
        </Button>
      </div>
      {ev.data && (
        <div className="glass-strong rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">AI Feedback</h4>
            <Badge className="bg-gradient-primary text-primary-foreground">Score {ev.data.score}/10</Badge>
          </div>
          <p className="mt-2 text-sm">{ev.data.feedback}</p>
          <ul className="mt-3 space-y-1 text-sm">{ev.data.improvements.map((i, k) => <li key={k} className="text-muted-foreground">• {i}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
