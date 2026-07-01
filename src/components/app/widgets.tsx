import { cn } from "@/lib/utils";

export function ReadinessGauge({ value, size = 160 }: { value: number; size?: number }) {
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const tier = value >= 80 ? "Excellent" : value >= 60 ? "Strong" : value >= 40 ? "Building" : "Getting started";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 270)" />
            <stop offset="100%" stopColor="oklch(0.7 0.2 300)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeOpacity="0.12" strokeWidth={10} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#rg)" strokeWidth={10} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-bold">{Math.round(value)}</div>
        <div className={cn("text-xs", value >= 60 ? "text-success" : "text-muted-foreground")}>{tier}</div>
      </div>
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, accent }: { title: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <div className="glass hover-lift rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className={cn("bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-lg shadow-glow", accent)}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

