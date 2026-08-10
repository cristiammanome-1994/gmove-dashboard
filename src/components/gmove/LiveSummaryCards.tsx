import { MetricCard } from "./MetricCard";
import { Users, UserCheck, UserX, CheckCircle2, BarChart3, Target, Video, Activity, CalendarDays } from "lucide-react";
import { ProcessedDashboard } from "@/lib/gmove-processor";

export const LiveSummaryCards = ({ data }: { data: ProcessedDashboard }) => {
  const s = data.summary;
  const daysLabel = s.monthCompleted ? "Mês finalizado" : `${s.daysElapsed} de ${s.daysInMonth} dias corridos`;
  return (
    <>
      <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
        <CalendarDays className="h-3.5 w-3.5" />
        {daysLabel}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Participantes ativos" value={s.active} tone="primary" delay={0} />
        <MetricCard icon={UserCheck} label={`Ativos reais (≥${data.options.minActiveDays} dias)`} value={s.activeReal} tone="success" delay={80} />
        <MetricCard icon={UserX} label="Inativos com histórico" value={s.inactive} tone="muted" delay={160} />
        <MetricCard icon={CheckCircle2} label="Total de check-ins" value={s.totalCheckIns} tone="primary" delay={240} />
        <MetricCard icon={BarChart3} label="Média check-ins / ativo" value={s.avgPerActive} decimals={1} tone="primary" delay={320} />
        <MetricCard icon={Target} label={`Atingiram meta de ${data.options.goalDays} dias`} value={s.goalReached} tone="success" delay={400} />
        <MetricCard icon={Activity} label="% que bateu a meta" value={s.goalReachedPct} decimals={1} suffix="%" tone="amber" delay={480} />
        {data.options.useVideoDynamic && (
          <MetricCard icon={Video} label="Vídeos enviados" value={s.videosSubmitted} tone="primary" delay={560} />
        )}
      </div>
      <p className="text-xs text-muted-foreground text-right mt-2">
        {daysLabel}
      </p>
    </>
  );
};
