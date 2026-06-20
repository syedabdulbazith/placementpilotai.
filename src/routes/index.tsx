import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Brain, FileText, Target, Building2, MessageSquare, MapIcon,
  Sparkles, ArrowRight, CheckCircle2, TrendingUp, Award, Users, Zap, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlacementPilot AI — Your Personal AI Placement Officer" },
      { name: "description", content: "AI-powered platform helping college students land their dream placement: resume analysis, skill gap, eligibility, mock interviews, and a personalized roadmap." },
      { property: "og:title", content: "PlacementPilot AI" },
      { property: "og:description", content: "Your Personal AI Placement Officer." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileText, title: "AI Resume Analyzer", desc: "ATS scoring, strengths, weaknesses, and improvement suggestions." },
  { icon: Target, title: "Skill Gap Detection", desc: "Compare your skills to the role you want and close the gap." },
  { icon: Building2, title: "Company Eligibility", desc: "See which top recruiters you qualify for — instantly." },
  { icon: MessageSquare, title: "AI Mock Interviews", desc: "Technical, HR, and aptitude rounds with instant feedback." },
  { icon: MapIcon, title: "Smart Roadmaps", desc: "15, 30, or 60-day plans tailored to your goal." },
  { icon: BarChart3, title: "Readiness Score", desc: "Track your placement readiness with a live 0–100 score." },
];

const benefits = [
  { icon: TrendingUp, title: "Land offers faster", desc: "Average 3× higher interview callbacks after using PlacementPilot." },
  { icon: Zap, title: "Personalized prep", desc: "Plans built around your skills, CGPA, and target role." },
  { icon: Award, title: "Premium guidance", desc: "Industry-grade feedback once reserved for top coaches." },
];

const testimonials = [
  { quote: "I cleared 5 interviews in two weeks. The AI mocks were brutal — exactly like the real thing.", name: "Aarav S.", role: "B.Tech, IIT Madras" },
  { quote: "The roadmap kept me consistent for 60 days. Got my dream offer from a product company.", name: "Priya R.", role: "BE CSE, VIT" },
  { quote: "Resume score went from 54 → 92. Recruiters started replying within days.", name: "Rohit M.", role: "MCA, NIT Trichy" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50">
        <div className="glass mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 shadow-elegant">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="PlacementPilot AI logo" className="h-8 w-8" width={32} height={32} />
            <span className="font-display text-lg font-bold tracking-tight">PlacementPilot<span className="gradient-text"> AI</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#benefits" className="hover:text-foreground transition-colors">Benefits</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
            <Button variant="hero" size="sm" asChild><Link to="/auth">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24">
        <div className="bg-gradient-hero absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted-foreground">Powered by advanced AI</span>
            </div>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Your Personal <span className="gradient-text">AI Placement Officer</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Analyze your resume, find your skill gaps, check company eligibility, ace mock interviews,
              and follow a personalized roadmap — all in one premium AI platform built for students.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth">Start preparing free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <a href="#features">Explore features</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Free to start</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />No credit card</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" />12,000+ students</div>
            </div>
          </div>
          <div className="relative">
            <div className="glass rounded-3xl p-3 shadow-elegant">
              <img src={hero} alt="AI placement preparation dashboard" className="rounded-2xl" width={1024} height={1024} />
            </div>
            <div className="glass absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl p-4 shadow-glow">
              <div className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Readiness Score</div>
                <div className="font-display text-2xl font-bold">87<span className="text-sm text-muted-foreground">/100</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Everything you need to get placed</h2>
            <p className="mt-3 text-muted-foreground">Six AI-powered modules. One unified workflow.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="glass group rounded-2xl p-6 transition-all hover:shadow-glow">
                <div className="bg-gradient-primary inline-flex h-11 w-11 items-center justify-center rounded-xl shadow-glow">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="glass-strong rounded-2xl p-8 text-center shadow-elegant">
                <div className="bg-gradient-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
                  <b.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-4xl font-bold">Loved by students across India</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="glass rounded-2xl p-6">
                <blockquote className="text-sm leading-relaxed">"{t.quote}"</blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <div className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="glass-strong mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center shadow-elegant">
          <div className="bg-gradient-hero pointer-events-none absolute" />
          <h2 className="font-display text-4xl font-bold">Ready to land your dream offer?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join thousands of students who turned placements from anxiety into confidence.
          </p>
          <Button variant="hero" size="xl" className="mt-8" asChild>
            <Link to="/auth">Start your prep — it's free <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-6 w-6" width={24} height={24} />
            <span>© {new Date().getFullYear()} PlacementPilot AI</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
