import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  tone?: "primary" | "success" | "amber" | "muted";
  delay?: number;
}

const tones = {
  primary: "from-primary/10 to-primary-glow/5 text-primary border-primary/20",
  success: "from-status-met/40 to-status-met/10 text-status-met-foreground border-status-met/50",
  amber: "from-status-near/60 to-status-near/20 text-status-near-foreground border-status-near/60",
  muted: "from-muted to-muted/30 text-foreground border-border",
};

export const MetricCard = ({ icon: Icon, label, value, suffix = "", decimals = 0, tone = "primary", delay = 0 }: MetricCardProps) => {
  const display = useCountUp(value, 1400, decimals);
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "opacity-0 animate-fade-in-up relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-card hover-lift",
        tones[tone]
      )}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-current opacity-[0.06]" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground tabular-nums">
            {display}
            {suffix && <span className="ml-1 text-lg font-bold text-foreground/70">{suffix}</span>}
          </p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 backdrop-blur shadow-soft")}>
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
};
