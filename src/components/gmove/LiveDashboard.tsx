import { useState, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProcessedDashboard } from "@/lib/gmove-processor";
import { TeamManager } from "./TeamManager";
import { TeamRanking } from "./TeamRanking";
import { DashboardTabs, buildDashboardTabs } from "./DashboardTabs";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import {
  DaysActiveTab, PointsTab, PerformanceTab, InactivesTab,
  VideosTab, ModalitiesTab, ScheduleTab,
  Card, useExportCsv,
} from "./TabContent";
import { ValidationTab } from "./TabContent/ValidationTab";
import { ModalidadesPorGmoverTab } from "./TabContent/ModalidadesPorGmoverTab";
import { MonthImagesTab } from "./TabContent/MonthImagesTab";

interface Props {
  data: ProcessedDashboard;
}

export const LiveDashboard = ({ data }: Props) => {
  const goal = data?.options?.goalDays ?? 15;
  const monthCompleted = data?.summary?.monthCompleted ?? false;
  const projectionHeader = monthCompleted
    ? "Total final"
    : `Projeção (${data?.summary?.daysElapsed ?? 0}d corridos)`;

  const [search, setSearch] = useState("");
  const { rDays, rPts, rHist, rIna, rVids } = useSearchFilters(data, search);
  const exportCsv = useExportCsv(data?.options?.month ?? 1, data?.options?.year ?? new Date().getFullYear());

  const filteredModalitiesByUser = useMemo(() => {
    const term = search.toLowerCase();
    return (data.modalitiesByUser ?? []).filter((u) =>
      u.name.toLowerCase().includes(term)
    );
  }, [data.modalitiesByUser, search]);

  if (!data || !data.summary) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-10 text-center text-muted-foreground">
        Dados indisponíveis. Recarregue o arquivo JSON para gerar o dashboard.
      </div>
    );
  }

  const TABS = buildDashboardTabs(!!data.options.useVideoDynamic);
  const totalDaysInMonth = new Date(data.options.year, data.options.month, 0).getDate();
  const df = data.options.dayFrom ?? 1;
  const dt = data.options.dayTo ?? totalDaysInMonth;
  const hasWindow = df > 1 || dt < totalDaysInMonth;

  return (
    <Tabs defaultValue="dias" className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-status-near-foreground bg-status-near/20 px-2.5 py-1 rounded-full">
          {data.monthLabel} · {data.summary.monthCompleted ? "Finalizado" : "Em andamento"}
        </span>
        {hasWindow && (
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Período: dia {df} – {dt}
          </span>
        )}
      </div>

      <DashboardTabs tabs={TABS} />

      <TabsContent value="dias" className="animate-fade-in">
        <DaysActiveTab
          rows={rDays}
          total={data.rankingDays?.length ?? 0}
          goal={goal}
          search={search}
          onSearch={setSearch}
          onExport={exportCsv}
        />
      </TabsContent>

      <TabsContent value="pontos" className="animate-fade-in">
        <PointsTab
          rows={rPts}
          total={data.rankingPoints?.length ?? 0}
          goal={goal}
          search={search}
          onSearch={setSearch}
          onExport={exportCsv}
        />
      </TabsContent>

      <TabsContent value="historico" className="animate-fade-in">
        <PerformanceTab
          rows={rHist}
          total={data.historicalCompare?.length ?? 0}
          projectionHeader={projectionHeader}
          search={search}
          onSearch={setSearch}
          onExport={exportCsv}
        />
      </TabsContent>

      <TabsContent value="reativacao" className="animate-fade-in">
        <InactivesTab
          rows={rIna}
          total={data.inactives?.length ?? 0}
          search={search}
          onSearch={setSearch}
          onExport={exportCsv}
        />
      </TabsContent>

      {data.options.useVideoDynamic && (
        <TabsContent value="videos" className="animate-fade-in">
          <VideosTab
            rows={rVids}
            total={data.videos?.length ?? 0}
            search={search}
            onSearch={setSearch}
            onExport={exportCsv}
          />
        </TabsContent>
      )}

      <TabsContent value="modalidades" className="animate-fade-in">
        <ModalitiesTab modalities={data.modalities ?? []} />
      </TabsContent>

      <TabsContent value="modalidades-usuario" className="animate-fade-in">
        <ModalidadesPorGmoverTab
          rows={filteredModalitiesByUser}
          total={data.modalitiesByUser?.length ?? 0}
          search={search}
          onSearch={setSearch}
          onExport={exportCsv}
        />
      </TabsContent>

      <TabsContent value="horarios" className="animate-fade-in">
        <ScheduleTab schedules={data.schedules ?? []} />
      </TabsContent>

      <TabsContent value="ranking-equipes" className="animate-fade-in">
        <Card title="Ranking de Equipes" description="Comparativo entre equipes baseado em pontos, dias ativos e velocidade.">
          <TeamRanking
            participants={data.allParticipants ?? []}
            progress={{
              daysElapsed: data.summary.daysElapsed,
              daysInMonth: data.summary.daysInMonth,
              monthCompleted: data.summary.monthCompleted,
            }}
          />
        </Card>
      </TabsContent>

      <TabsContent value="validacao" className="animate-fade-in">
        <ValidationTab data={data} />
      </TabsContent>

      <TabsContent value="imagens" className="animate-fade-in">
        <MonthImagesTab
          photos={data.monthPhotos ?? []}
          search={search}
          onSearch={setSearch}
          onExport={exportCsv}
        />
      </TabsContent>

      <TabsContent value="equipes" className="animate-fade-in">
        <Card title="Gerenciar Equipes" description="Arraste participantes entre as colunas para montar e ajustar as equipes do desafio.">
          <TeamManager participants={data.allParticipants ?? []} />
        </Card>
      </TabsContent>
    </Tabs>
  );
};
