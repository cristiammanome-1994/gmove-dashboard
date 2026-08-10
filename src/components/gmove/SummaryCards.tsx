import { MetricCard } from "./MetricCard";
import { summary, monthLabel } from "@/data/gmove";
import { Users, UserCheck, UserX, CheckCircle2, BarChart3, Target, Video, Activity } from "lucide-react";

export const SummaryCards = () => (
  <section className="container py-12 md:py-16">
    <div className="mb-8">
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">Resumo do mês</span>
      <h2 className="text-3xl md:text-4xl font-black text-primary-deep">
        Indicadores chave · <span className="text-primary">{monthLabel}</span>
      </h2>
      <p className="mt-2 text-muted-foreground">Visão consolidada do desempenho coletivo do desafio.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={Users} label="Participantes ativos" value={summary.active} tone="primary" delay={0} />
      <MetricCard icon={UserCheck} label="Ativos reais (≥3 dias)" value={summary.realActive} tone="success" delay={80} />
      <MetricCard icon={UserX} label="Inativos com histórico" value={summary.inactive} tone="muted" delay={160} />
      <MetricCard icon={CheckCircle2} label="Total de check-ins" value={summary.totalCheckIns} tone="primary" delay={240} />
      <MetricCard icon={BarChart3} label="Média check-ins / ativo" value={summary.avgPerActive} decimals={1} tone="primary" delay={320} />
      <MetricCard icon={Target} label="Atingiram meta de 15 dias" value={summary.goalReachedCount} tone="success" delay={400} />
      <MetricCard icon={Activity} label="% que bateu a meta" value={summary.goalReachedPct} decimals={1} suffix="%" tone="amber" delay={480} />
      <MetricCard icon={Video} label="Vídeos enviados" value={summary.videosSubmitted} tone="primary" delay={560} />
    </div>
  </section>
);
