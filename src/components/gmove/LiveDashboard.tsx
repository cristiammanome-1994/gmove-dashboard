import { useState, useMemo, useEffect } from "react";
import { ProcessedDashboard } from "@/lib/gmove-processor";
import { validateCheckIns } from "@/lib/checkin-validator";
import { TeamManager } from "./TeamManager";
import { TeamRanking } from "./TeamRanking";
import { DashboardTabs, buildDashboardTabs } from "./DashboardTabs";
import { DashboardSidebar, buildDashboardTabGroups, TabGroup } from "./DashboardSidebar";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import {
  DaysActiveTab, PointsTab, PerformanceTab, InactivesTab,
  VideosTab, ModalitiesTab, ScheduleTab,
  Card, useExportCsv,
} from "./TabContent";
import { ValidationTab } from "./TabContent/ValidationTab";
import { ModalidadesPorGmoverTab } from "./TabContent/ModalidadesPorGmoverTab";
import { MonthImagesTab } from "./TabContent/MonthImagesTab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommandPalette, useCommandPalette, CommandItem } from "@/components/ui/command-palette";

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

  // Compute validation for alert banner
  const validation = useMemo(() => validateCheckIns(data), [data]);
  const hasCriticalAlerts = validation.bySeverity.high > 0;
  const hasMediumAlerts = validation.bySeverity.medium > 0;
  const totalAlerts = validation.bySeverity.high + validation.bySeverity.medium + validation.bySeverity.low;

  const [activeTab, setActiveTab] = useState("dias");
  const tabGroups = buildDashboardTabGroups(!!data?.options?.useVideoDynamic);

  // Command Palette items
  const commandItems = useMemo<CommandItem[]>(() => [
    // Navigation
    ...tabGroups.flatMap(group =>
      group.tabs.map(tab => ({
        id: `nav-${tab.id}`,
        label: tab.label,
        description: `Ir para ${tab.label}`,
        icon: tab.icon,
        group: `🧭 ${group.label}`,
        shortcut: "",
        action: () => setActiveTab(tab.id),
        keywords: [group.label.toLowerCase(), tab.label.toLowerCase()],
      }))
    ),
    // Quick actions
    {
      id: "action-export",
      label: "Exportar CSV da aba atual",
      description: "Baixar dados da visualização atual",
      icon: Search,
      group: "⚡ Ações rápidas",
      shortcut: "E",
      action: () => exportCsv(`dashboard-${activeTab}`),
      keywords: ["exportar", "csv", "download", "baixar"],
    },
    {
      id: "action-refresh",
      label: "Recarregar dados",
      description: "Atualizar dashboard com dados do servidor",
      icon: Search,
      group: "⚡ Ações rápidas",
      shortcut: "R",
      action: () => typeof window !== "undefined" && window.location.reload(),
      keywords: ["recarregar", "atualizar", "refresh", "reload"],
    },
    {
      id: "action-config-validation",
      label: "Configurar validação",
      description: "Ajustar critérios de validação de check-ins",
      icon: AlertTriangle,
      group: "⚡ Ações rápidas",
      shortcut: "V",
      action: () => setActiveTab("validacao"),
      keywords: ["configurar", "validação", "critérios", "regras"],
    },
  ], [tabGroups, activeTab, exportCsv]);

  const { isOpen, setIsOpen } = useCommandPalette(commandItems);

  const totalDaysInMonth = data?.options
    ? new Date(data.options.year, data.options.month, 0).getDate()
    : 31;
  const df = data?.options?.dayFrom ?? 1;
  const dt = data?.options?.dayTo ?? totalDaysInMonth;
  const hasWindow = df > 1 || dt < totalDaysInMonth;

  if (!data || !data.summary) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-10 text-center text-muted-foreground">
        Dados indisponíveis. Recarregue o arquivo JSON para gerar o dashboard.
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-[calc(100vh-200px)]">
        {/* Sidebar (desktop only) */}
        <DashboardSidebar
          groups={tabGroups}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <main
          className={cn(
            "transition-all duration-300",
            "lg:ml-72"
          )}
        >
          <div className="p-4 lg:p-6">
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

            {/* Mobile tab navigation */}
            <div className="lg:hidden mb-4 overflow-x-auto -mx-2 px-2 pb-2">
              <div className="inline-flex gap-1 bg-muted/60 p-1.5 rounded-2xl">
                {tabGroups.flatMap(g => g.tabs).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      activeTab === tab.id
                        ? "bg-white text-primary shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Alert Banner */}
            {totalAlerts > 0 && (
              <Alert
                className="mb-4 border-l-4 transition-all duration-300"
                variant={hasCriticalAlerts ? "destructive" : hasMediumAlerts ? "default" : "secondary"}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <AlertTitle className="font-semibold">
                    {hasCriticalAlerts ? "⚠️ Atenção necessária" : "⚡ Revisão recomendada"}
                  </AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-3 text-sm mt-1">
                    <span className="font-medium">
                      {validation.bySeverity.high > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {validation.bySeverity.high} crítico{validation.bySeverity.high > 1 ? "s" : ""}
                        </span>
                      )}
                      {validation.bySeverity.medium > 0 && (
                        <span className={`${hasCriticalAlerts ? "ml-2" : ""} text-amber-600 dark:text-amber-400`}>
                          {validation.bySeverity.medium} médio{validation.bySeverity.medium > 1 ? "s" : ""}
                        </span>
                      )}
                      {validation.bySeverity.low > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          {validation.bySeverity.low} baixo
                        </span>
                      )}
                      {validation.shortDurationCheckIns.length > 0 && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          {validation.shortDurationCheckIns.length} check-in{validation.shortDurationCheckIns.length > 1 ? "s" : ""}{" < 30min/dia"}
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("validacao")}
                      className="ml-auto whitespace-nowrap"
                    >
                      Ver detalhes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Tab Content */}
            {activeTab === "dias" && (
              <DaysActiveTab
                rows={rDays}
                total={data.rankingDays?.length ?? 0}
                goal={goal}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {activeTab === "pontos" && (
              <PointsTab
                rows={rPts}
                total={data.rankingPoints?.length ?? 0}
                goal={goal}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {activeTab === "historico" && (
              <PerformanceTab
                rows={rHist}
                total={data.historicalCompare?.length ?? 0}
                projectionHeader={projectionHeader}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {activeTab === "reativacao" && (
              <InactivesTab
                rows={rIna}
                total={data.inactives?.length ?? 0}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {data.options.useVideoDynamic && activeTab === "videos" && (
              <VideosTab
                rows={rVids}
                total={data.videos?.length ?? 0}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {activeTab === "modalidades" && (
              <ModalitiesTab modalities={data.modalities ?? []} />
            )}

            {activeTab === "modalidades-usuario" && (
              <ModalidadesPorGmoverTab
                rows={filteredModalitiesByUser}
                total={data.modalitiesByUser?.length ?? 0}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {activeTab === "horarios" && (
              <ScheduleTab schedules={data.schedules ?? []} />
            )}

            {activeTab === "ranking-equipes" && (
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
            )}

            {activeTab === "validacao" && (
              <ValidationTab data={data} />
            )}

            {activeTab === "imagens" && (
              <MonthImagesTab
                photos={data.monthPhotos ?? []}
                search={search}
                onSearch={setSearch}
                onExport={exportCsv}
              />
            )}

            {activeTab === "equipes" && (
              <Card title="Gerenciar Equipes" description="Arraste participantes entre as colunas para montar e ajustar as equipes do desafio.">
                <TeamManager participants={data.allParticipants ?? []} />
              </Card>
            )}
          </div>
        </main>
      </div>

      <CommandPalette
        items={commandItems}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
