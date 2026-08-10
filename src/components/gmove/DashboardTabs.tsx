import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Flame, TrendingUp, Activity, Clock,
  Video as VideoIcon, Users2, Trophy, AlertTriangle, Image, ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardTabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export function buildDashboardTabs(useVideoDynamic: boolean): DashboardTabDef[] {
  return [
    { id: "dias", label: "Dias Ativos", icon: Calendar },
    { id: "pontos", label: "Pontos", icon: Flame },
    { id: "historico", label: "Desempenho vs Histórico", icon: TrendingUp },
    { id: "reativacao", label: "Reativação", icon: Activity },
    ...(useVideoDynamic ? [{ id: "videos", label: "Vídeos do mês", icon: VideoIcon }] : []),
    { id: "modalidades", label: "Modalidades", icon: Activity },
    { id: "modalidades-usuario", label: "Modalidades por Gmover", icon: ListChecks },
    { id: "horarios", label: "Horários", icon: Clock },
    { id: "ranking-equipes", label: "Ranking Equipes", icon: Trophy },
    { id: "validacao", label: "🚨 Validação", icon: AlertTriangle },
    { id: "imagens", label: "Imagens do Mês", icon: Image },
    { id: "equipes", label: "Gerenciar Equipes", icon: Users2 },
  ];
}

interface Props {
  tabs: DashboardTabDef[];
}

export const DashboardTabs = ({ tabs }: Props) => (
  <div className="overflow-x-auto -mx-2 px-2 mb-6">
    <TabsList className="inline-flex h-auto bg-muted/60 p-1.5 rounded-2xl">
      {tabs.map((t) => (
        <TabsTrigger
          key={t.id}
          value={t.id}
          className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-soft text-xs md:text-sm font-semibold rounded-xl px-3 md:px-4 py-2 gap-1.5"
        >
          <t.icon className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">{t.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  </div>
);
