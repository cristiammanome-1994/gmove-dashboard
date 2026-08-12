import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Calendar, Flame, TrendingUp, Activity, Clock, Video as VideoIcon, Users, Trophy, AlertTriangle, Image, ListChecks, LayoutDashboard, BarChart2, ShieldCheck, Users as UsersIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DashboardTabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface TabGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  tabs: DashboardTabDef[];
}

export function buildDashboardTabGroups(useVideoDynamic: boolean): TabGroup[] {
  return [
    {
      id: "overview",
      label: "Visão Geral",
      icon: LayoutDashboard,
      tabs: [
        { id: "dias", label: "Dias Ativos", icon: Calendar },
        { id: "pontos", label: "Pontos", icon: Flame },
      ],
    },
    {
      id: "performance",
      label: "Performance",
      icon: BarChart2,
      tabs: [
        { id: "historico", label: "Desempenho vs Histórico", icon: TrendingUp },
        { id: "horarios", label: "Horários", icon: Clock },
        { id: "modalidades", label: "Modalidades", icon: Activity },
        { id: "modalidades-usuario", label: "Modalidades por Gmover", icon: ListChecks },
      ],
    },
    {
      id: "engagement",
      label: "Engajamento",
      icon: UsersIcon,
      tabs: [
        { id: "reativacao", label: "Reativação", icon: Activity },
        ...(useVideoDynamic ? [{ id: "videos", label: "Vídeos do mês", icon: VideoIcon }] : []),
        { id: "imagens", label: "Imagens do Mês", icon: Image },
      ],
    },
    {
      id: "teams",
      label: "Equipes",
      icon: Users,
      tabs: [
        { id: "ranking-equipes", label: "Ranking Equipes", icon: Trophy },
        { id: "equipes", label: "Gerenciar Equipes", icon: Users },
      ],
    },
    {
      id: "quality",
      label: "Qualidade",
      icon: ShieldCheck,
      tabs: [
        { id: "validacao", label: "Validação", icon: AlertTriangle },
      ],
    },
  ];
}

interface Props {
  groups: TabGroup[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export const DashboardSidebar = ({ 
  groups, 
  activeTab, 
  onTabChange, 
  collapsed = false,
  onCollapsedChange,
  className 
}: Props) => {
  const [isMounted, setIsMounted] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSidebarCollapsed(collapsed);
  }, [collapsed]);

  if (!isMounted) {
    return (
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background border-r border-border transition-all duration-300 ease-out",
          "hidden lg:flex",
          collapsed ? "w-16" : "w-72",
          className
        )}
        aria-label="Navegação do dashboard"
      >
        <div className="flex h-full flex-col" />
      </aside>
    );
  }

  const toggleGroup = (groupId: string) => {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupId)) newSet.delete(groupId);
    else newSet.add(groupId);
    setCollapsedGroups(newSet);
  };

  const isGroupCollapsed = (groupId: string) => collapsedGroups.has(groupId);

  const activeGroup = groups.find(g => g.tabs.some(t => t.id === activeTab))?.id;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 bg-background border-r border-border transition-all duration-300 ease-out",
        "hidden lg:flex",
        sidebarCollapsed ? "w-16" : "w-72",
        className
      )}
      aria-label="Navegação do dashboard"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-border transition-all duration-300",
          sidebarCollapsed && "justify-center px-2"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-primary-deep text-sm">GMove</h2>
                <p className="text-[10px] text-muted-foreground">Dashboard Executivo</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto h-8 w-8"
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-2" type="always">
          <nav className="space-y-1" aria-label="Grupos de navegação">
            {groups.map((group) => {
              const isActive = group.tabs.some(t => t.id === activeTab);
              const isCollapsed = isGroupCollapsed(group.id);
              const shouldAutoExpand = isActive && !isCollapsed;

              return (
                <div key={group.id} className="group/nav">
                  {/* Group Header */}
                  <Button
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                      sidebarCollapsed && "px-2 justify-center",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isCollapsed || shouldAutoExpand}
                    aria-controls={`${group.id}-tabs`}
                  >
                    {!sidebarCollapsed && (
                      <>
                        <group.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{group.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            (isCollapsed && !shouldAutoExpand) && "-rotate-90"
                          )}
                          aria-hidden="true"
                        />
                      </>
                    )}
                    {sidebarCollapsed && <group.icon className="h-5 w-5" aria-hidden="true" />}
                  </Button>

                  {/* Tabs List */}
                  <div
                    id={`${group.id}-tabs`}
                    role="group"
                    aria-label={group.label}
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      (isCollapsed && !shouldAutoExpand) ? "max-h-0 opacity-0 pt-0 pb-0" : "max-h-96 opacity-100",
                      sidebarCollapsed && "absolute left-16 top-0 w-56 bg-background border border-border rounded-xl shadow-elegant p-2 z-50"
                    )}
                  >
                    <div className={cn("space-y-0.5 pl-2", sidebarCollapsed && "pl-0")}>
                      {group.tabs.map((tab) => {
                        const isTabActive = tab.id === activeTab;
                        return (
                          <Button
                            key={tab.id}
                            type="button"
                            variant={isTabActive ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full justify-start gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              sidebarCollapsed && "px-2 justify-center",
                              isTabActive
                                ? "bg-primary text-primary-foreground shadow-soft"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            onClick={() => onTabChange(tab.id)}
                            aria-current={isTabActive ? "page" : undefined}
                          >
                            {!sidebarCollapsed && (
                              <>
                                <tab.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">{tab.label}</span>
                              </>
                            )}
                            {sidebarCollapsed && <tab.icon className="h-4 w-4" aria-hidden="true" />}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className={cn("p-4 border-t border-border", sidebarCollapsed && "hidden")}>
          <p className="text-[11px] text-muted-foreground text-center">
            Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> para busca rápida
          </p>
        </div>
      </div>
    </aside>
  );
};