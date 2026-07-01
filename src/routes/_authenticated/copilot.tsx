import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/widgets";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Database, BookOpen, Building2, GraduationCap, Sparkles,
  CheckCircle2, ArrowDown, Plug, ShieldCheck, Layers, Activity,
  FileText, Target, BrainCircuit, MapIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "AI Career Copilot — PlacementPilot AI" }] }),
  component: CopilotPage,
});

const capabilities = [
  { icon: FileText, label: "Resume Analysis" },
  { icon: CheckCircle2, label: "ATS Evaluation" },
  { icon: Target, label: "Skill Gap Detection" },
  { icon: Building2, label: "Company Eligibility" },
  { icon: BrainCircuit, label: "Interview Preparation" },
  { icon: MapIcon, label: "Career Roadmap" },
];

const knowledgeSources = [
  { icon: FileText, title: "Resume Database", desc: "Curated resume patterns and ATS heuristics" },
  { icon: Building2, title: "Company Eligibility Rules", desc: "CGPA, backlog & branch criteria" },
  { icon: BookOpen, title: "Interview Preparation Resources", desc: "Role-specific question banks" },
  { icon: MapIcon, title: "Learning Roadmaps", desc: "15 / 30 / 60-day structured plans" },
];

const workflow = [
  "Student uploads resume",
  "Resume Analysis",
  "Skill Gap Detection",
  "Eligibility Check",
  "Interview Preparation",
  "Career Roadmap",
  "Placement Recommendation",
];

const integrations = [
  { icon: Plug, label: "IdeaBoxAI Persona", value: "Connected", ok: true },
  { icon: Database, label: "Knowledge Base", value: "Connected", ok: true },
  { icon: Sparkles, label: "Skills", value: "Active", ok: true },
  { icon: ShieldCheck, label: "Status", value: "Enterprise Ready", ok: true },
];

function CopilotPage() {
  return (
    <div className="space-y-8">
      {/* Section 1 — Hero */}
      <div className="glass-strong relative overflow-hidden rounded-2xl p-8">
        <div className="bg-gradient-primary absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl" />
        <div className="relative">
          <Badge className="bg-gradient-primary shadow-glow mb-4 border-0 text-primary-foreground">
            <Sparkles className="mr-1 h-3 w-3" /> Powered by Enterprise Persona Intelligence
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            PlacementPilot <span className="gradient-text">Career Copilot</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground md:text-base">
            Powered by Enterprise Persona Intelligence
          </p>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            This AI Career Copilot assists students throughout their placement journey by
            analyzing resumes, identifying skill gaps, recommending learning paths, checking
            company eligibility, generating interview questions, and providing personalized
            career guidance.
          </p>
        </div>
      </div>

      {/* Section 2 — Persona Overview */}
      <div>
        <PageHeader title="Persona Overview" description="Meet your enterprise AI persona." />
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-primary shadow-glow flex h-14 w-14 items-center justify-center rounded-xl">
                <Bot className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Persona Name</div>
                <div className="font-display text-xl font-bold">PlacementPilot Career Copilot</div>
                <div className="mt-1 text-sm text-muted-foreground">Role · Student Placement Assistant</div>
              </div>
            </div>
            <Badge className="border-success/40 bg-success/15 text-success">
              <Activity className="mr-1 h-3 w-3" /> Active
            </Badge>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Capabilities</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((c) => (
                <div key={c.label} className="glass flex items-center gap-3 rounded-lg px-4 py-3">
                  <c.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 — Knowledge Sources */}
      <div>
        <PageHeader title="Knowledge Sources" description="Grounded in enterprise-grade data." />
        <div className="grid gap-4 md:grid-cols-2">
          {knowledgeSources.map((k) => (
            <div key={k.title} className="glass rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-primary shadow-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <k.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="font-semibold">{k.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{k.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — Workflow */}
      <div>
        <PageHeader title="AI Copilot Workflow" description="How the copilot moves a student from resume to offer." />
        <div className="glass-strong rounded-2xl p-6">
          <div className="mx-auto flex max-w-md flex-col items-center">
            {workflow.map((step, i) => (
              <div key={step} className="flex w-full flex-col items-center">
                <div className="bg-gradient-primary shadow-glow w-full rounded-xl px-4 py-3 text-center font-medium text-primary-foreground">
                  {step}
                </div>
                {i < workflow.length - 1 && (
                  <ArrowDown className="my-2 h-5 w-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5 — Enterprise Integration */}
      <div>
        <PageHeader title="Enterprise Integration" description="Deployed and ready for enterprise use." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {integrations.map((it) => (
            <div key={it.label} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="bg-gradient-primary shadow-glow flex h-9 w-9 items-center justify-center rounded-lg">
                  <it.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <Badge className="border-success/40 bg-success/15 text-success">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> {it.value}
                </Badge>
              </div>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                {it.label}
              </div>
            </div>
          ))}
        </div>

        <div className="glass mt-4 flex flex-wrap items-center gap-3 rounded-2xl p-4">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            HackIndia Track 1 · Enterprise Persona Intelligence integration verified.
          </span>
          <Badge className="ml-auto bg-gradient-primary border-0 text-primary-foreground">
            <GraduationCap className="mr-1 h-3 w-3" /> Ready for Placements
          </Badge>
        </div>
      </div>
    </div>
  );
}
