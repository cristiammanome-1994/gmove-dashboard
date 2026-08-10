import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bike, Dumbbell, Footprints, Trophy, Users, Target, Activity, CheckCircle2 } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

interface HeroProps {
  onCtaClick: () => void;
  onHowClick: () => void;
}

const FloatingIcon = ({ icon: Icon, className, delay = 0 }: { icon: any; className: string; delay?: number }) => (
  <div
    className={`absolute hidden md:flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-elegant animate-float ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <Icon className="h-8 w-8 text-white" strokeWidth={2.2} />
  </div>
);

export const Hero = ({ onCtaClick, onHowClick }: HeroProps) => {
  const checkins = useCountUp(892);
  const active = useCountUp(47);
  const goal = useCountUp(60);

  return (
    <header className="relative overflow-hidden bg-gradient-hero text-white">
      {/* radial glow */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-radial)" }} />
      {/* grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Top nav */}
      <nav className="relative container flex items-center justify-between py-6">
        <Logo size="md" inverted />
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
          <a href="#como-funciona" className="hover:text-white transition-smooth">Como funciona</a>
          <a href="#dashboard" className="hover:text-white transition-smooth">Dashboard</a>
          <a href="#metricas" className="hover:text-white transition-smooth">Métricas</a>
        </div>
        <div className="text-xs font-semibold tracking-widest text-white/70 uppercase">by Gmaster</div>
      </nav>

      {/* Hero content */}
      <div className="relative container py-16 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-status-met animate-pulse" />
            Desafio Abril / 2026 em andamento
          </div>

          <Logo size="xl" inverted showTagline className="mb-8 animate-fade-in-up" />

          <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed text-balance animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
            A plataforma de desafio fitness coletivo da <span className="font-semibold text-white">Gmaster</span>.
            Colaboradores registram treinos, somam pontos e competem em rankings mensais — promovendo saúde,
            energia e cultura de movimento dentro da empresa.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: "400ms", opacity: 0 }}>
            <Button size="lg" variant="hero" onClick={onCtaClick}>
              <BarChart3 className="mr-1" /> Ver Dashboard <ArrowRight />
            </Button>
            <Button size="lg" variant="heroOutline" onClick={onHowClick}>
              Como funciona
            </Button>
          </div>
        </div>

        {/* Floating activity icons */}
        <FloatingIcon icon={Footprints} className="top-12 right-12 h-16 w-16" delay={0} />
        <FloatingIcon icon={Dumbbell} className="top-40 right-48 h-14 w-14" delay={1.2} />
        <FloatingIcon icon={Bike} className="bottom-32 right-24 h-16 w-16" delay={0.6} />
        <FloatingIcon icon={Trophy} className="bottom-12 right-64 h-12 w-12" delay={1.8} />
        <FloatingIcon icon={Activity} className="top-24 right-80 h-12 w-12" delay={2.4} />
      </div>

      {/* Highlight metrics strip */}
      <div id="metricas" className="relative border-t border-white/15 bg-black/15 backdrop-blur-sm">
        <div className="container grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/15">
          {[
            { icon: CheckCircle2, label: "Total de check-ins no mês", value: checkins },
            { icon: Users, label: "Participantes ativos", value: active },
            { icon: Target, label: "Meta de 15 dias atingida", value: `${goal}%` },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-4 py-6 md:px-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 border border-white/20">
                <m.icon className="h-6 w-6 text-status-met" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{m.label}</p>
                <p className="text-3xl font-black tabular-nums">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};
