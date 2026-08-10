import { useEffect, useMemo, useState } from "react";
import {
  Users, Users2, Award, X, Calendar, Plus, Pencil, Check, Trash2, Eye, EyeOff, Share2, Link2Off,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ActiveParticipant } from "@/lib/gmove-processor";
import { useToast } from "@/hooks/use-toast";
import {
  Team, TeamColor, Assignments, COLOR_CLASSES, TEAM_COLORS, TEAMS_EVENT,
  loadTeams, saveTeams, loadAssignments, saveAssignments, nextTeamColor, generateTeamId,
  generateShareableURL,
} from "@/lib/teams-storage";
import { hasTeamsInURL, clearURLTeams } from "@/lib/url-teams-codec";




const NONE = "__none__";

interface Props {
  participants: ActiveParticipant[];
}

export const TeamManager = ({ participants }: Props) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [activeMobile, setActiveMobile] = useState<string>(NONE);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTeams(loadTeams());
    setAssignments(loadAssignments());
    const onUpd = () => {
      setTeams(loadTeams());
      setAssignments(loadAssignments());
    };
    window.addEventListener(TEAMS_EVENT, onUpd);
    return () => window.removeEventListener(TEAMS_EVENT, onUpd);
  }, []);

  const visibleParticipants = useMemo(
    () => (showInactive ? participants : participants.filter((p) => p.days > 0)),
    [participants, showInactive],
  );

  const inactiveCount = useMemo(
    () => participants.filter((p) => p.days === 0).length,
    [participants],
  );

  const byColumn = useMemo(() => {
    const map: Record<string, ActiveParticipant[]> = { [NONE]: [] };
    for (const t of teams) map[t.id] = [];
    for (const p of visibleParticipants) {
      const tid = assignments[String(p.id)];
      const key = tid && map[tid] ? tid : NONE;
      map[key].push(p);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => b.points - a.points || b.days - a.days);
    }
    return map;
  }, [visibleParticipants, teams, assignments]);

  const assign = (participantId: number, target: string) => {
    const idKey = String(participantId);
    const current = assignments[idKey] ?? NONE;
    if (current === target) return;
    const next: Assignments = { ...assignments };
    const participant = participants.find((p) => p.id === participantId);
    if (target === NONE) delete next[idKey];
    else next[idKey] = target;
    setAssignments(next);
    saveAssignments(next);
    const label = target === NONE ? "Sem Equipe" : teams.find((t) => t.id === target)?.name ?? "—";
    toast({
      title: target === NONE ? "Removido da equipe" : `Movido para ${label}`,
      description: participant?.name ?? "",
    });
  };

  const onDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOver(null);
    const raw = e.dataTransfer.getData("text/plain");
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    assign(id, target);
  };

  const onDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== target) setDragOver(target);
  };

  const addTeam = () => {
    const color = nextTeamColor(teams);
    const id = generateTeamId();
    const name = `Equipe ${teams.length + 1}`;
    const next = [...teams, { id, name, color }];
    setTeams(next);
    saveTeams(next);
    toast({ title: "Equipe criada", description: name });
  };

  const updateTeam = (id: string, patch: Partial<Team>) => {
    const next = teams.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTeams(next);
    saveTeams(next);
  };

  const removeTeam = (id: string) => {
    const team = teams.find((t) => t.id === id);
    const next = teams.filter((t) => t.id !== id);
    setTeams(next);
    saveTeams(next);
    // realoca participantes para "sem equipe"
    const nextA: Assignments = { ...assignments };
    let moved = 0;
    for (const k of Object.keys(nextA)) {
      if (nextA[k] === id) { delete nextA[k]; moved++; }
    }
    setAssignments(nextA);
    saveAssignments(nextA);
    toast({
      title: "Equipe removida",
      description: `${team?.name ?? ""}${moved ? ` · ${moved} participante(s) liberado(s)` : ""}`,
    });
  };

  const teamMetrics = (key: string) => {
    const list = byColumn[key] ?? [];
    const members = list.length;
    const active = list.filter((p) => p.points > 0 || p.days > 0).length;
    const pts = list.reduce((s, p) => s + p.points, 0);
    const days = list.reduce((s, p) => s + p.days, 0);
    const avg = members ? days / members : 0;
    const ratio = members ? active / members : 0;
    return { members, active, points: pts, days, avg, ratio };
  };

  type Status = {
    label: string;
    emoji: string;
    classes: string;
    tooltip: string;
  };
  const teamStatus = (m: { members: number; active: number; points: number; ratio: number }): Status => {
    const pct = Math.round(m.ratio * 100);
    const base = `${m.active}/${m.members} membros ativos (${pct}%).`;
    if (m.members === 0 || m.points === 0 || m.ratio < 0.5) {
      return {
        label: "Sem movimento",
        emoji: "🔴",
        classes: "bg-red-100 text-red-700 border-red-200",
        tooltip: `${base} Sem movimento: 0 pontos ou menos de 50% ativos.`,
      };
    }
    if (m.ratio >= 0.9) {
      return {
        label: "Muito ativa",
        emoji: "🟢",
        classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
        tooltip: `${base} Muito ativa: 90% ou mais dos membros ativos.`,
      };
    }
    return {
      label: "Ativa",
      emoji: "🟡",
      classes: "bg-amber-100 text-amber-700 border-amber-200",
      tooltip: `${base} Ativa: entre 50% e 89% dos membros ativos.`,
    };
  };

  const allColumns = useMemo(
    () => [
      { id: NONE, name: "Sem Equipe", color: null as TeamColor | null },
      ...teams.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    ],
    [teams],
  );

  const Column = ({ col }: { col: { id: string; name: string; color: TeamColor | null } }) => {
    const list = byColumn[col.id] ?? [];
    const cls = col.color ? COLOR_CLASSES[col.color] : null;
    const isOver = dragOver === col.id;
    const team = col.id === NONE ? null : teams.find((t) => t.id === col.id);
    return (
      <div
        onDragOver={(e) => onDragOver(e, col.id)}
        onDragLeave={() => setDragOver((d) => (d === col.id ? null : d))}
        onDrop={(e) => onDrop(e, col.id)}
        className={cn(
          "flex flex-col rounded-2xl border-2 transition-all min-h-[420px]",
          cls ? `${cls.border} ${cls.bg}` : "border-border bg-muted/40",
          isOver && "ring-2 ring-primary ring-offset-2 scale-[1.01]",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0",
              cls ? cls.chip : "bg-muted text-muted-foreground",
            )}>
              {col.id === NONE ? <Users2 className="h-4 w-4" /> : col.name.charAt(0).toUpperCase()}
            </span>
            <h4 className="text-sm font-black text-foreground truncate">{col.name}</h4>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="tabular-nums">{list.length}</Badge>
            {team && (
              <>
                <button
                  onClick={() => setEditingTeam(team)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Editar equipe"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1 max-h-[520px]">
          <div className="p-3 space-y-2">
            {list.map((p) => (
              <ParticipantCard key={p.id} p={p} team={col.id} onAssign={assign} />
            ))}
            {list.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">
                Arraste participantes para cá
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const fromURL = hasTeamsInURL();
  const handleShare = async () => {
    const url = generateShareableURL();
    if (!url) {
      toast({ title: "Falha ao gerar link", description: "Tente novamente." });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "Compartilhe para que outros vejam as mesmas equipes.",
      });
    } catch {
      window.prompt("Copie o link compartilhável:", url);
    }
  };

  return (
    <div className="space-y-6">
      {fromURL && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span>✅ Equipes carregadas do link compartilhado.</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-emerald-800 hover:bg-emerald-100"
            onClick={() => { clearURLTeams(); window.location.reload(); }}
          >
            <Link2Off className="h-3.5 w-3.5" /> Limpar URL
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={addTeam} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adicionar equipe
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5">
            <Share2 className="h-4 w-4" /> Compartilhar
          </Button>
          <Badge variant="outline" className="tabular-nums">
            {teams.length} equipe{teams.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          {showInactive ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium">Mostrar inativos</span>
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          <Badge variant="outline" className="tabular-nums text-xs">
            {inactiveCount} inativo{inactiveCount === 1 ? "" : "s"}
          </Badge>
        </label>
      </div>


      {/* Resumo das equipes */}
      {teams.length > 0 && (
        <TooltipProvider delayDuration={150}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {teams.map((t) => {
              const m = teamMetrics(t.id);
              const cls = COLOR_CLASSES[t.color];
              const status = teamStatus(m);
              return (
                <div
                  key={t.id}
                  className={cn("rounded-2xl border-2 p-4 shadow-soft transition-smooth hover-lift", cls.border, cls.bg)}
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black shrink-0", cls.chip)}>
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/60 truncate flex-1">{t.name}</span>
                  </div>
                  <div className="mb-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          tabIndex={0}
                          aria-label={`Status: ${status.label}`}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring",
                            status.classes,
                          )}
                        >
                          <span aria-hidden>{status.emoji}</span>
                          {status.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        {status.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Metric icon={Users} label="Membros" value={m.members} />
                    <Metric icon={Award} label="Pontos" value={Math.round(m.points)} />
                    <Metric icon={Calendar} label="Dias" value={m.days} />
                    <Metric icon={Calendar} label="Méd/membro" value={m.avg.toFixed(1)} />
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Desktop: colunas lado-a-lado */}
      <div
        className="hidden md:grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, allColumns.length)}, minmax(0, 1fr))` }}
      >
        {allColumns.map((c) => (
          <Column key={c.id} col={c} />
        ))}
      </div>

      {/* Mobile: tabs */}
      <div className="md:hidden">
        <Tabs value={activeMobile} onValueChange={setActiveMobile}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              {allColumns.map((c) => (
                <TabsTrigger key={c.id} value={c.id} className="text-xs">
                  {c.id === NONE ? "S/E" : c.name.slice(0, 8)}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          {allColumns.map((c) => (
            <TabsContent key={c.id} value={c.id} className="mt-3">
              <Column col={c} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dialog: edição de equipe */}
      <Dialog open={!!editingTeam} onOpenChange={(o) => !o && setEditingTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar equipe</DialogTitle>
            <DialogDescription>Renomeie ou altere a cor da equipe.</DialogDescription>
          </DialogHeader>
          {editingTeam && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 inline-block">Nome</Label>
                <Input
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 inline-block">Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map((c) => {
                    const cls = COLOR_CLASSES[c];
                    const selected = editingTeam.color === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setEditingTeam({ ...editingTeam, color: c })}
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          cls.chip,
                          selected ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-80 hover:opacity-100",
                        )}
                        aria-label={c}
                      >
                        {selected && <Check className="h-4 w-4 mx-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {editingTeam && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(`Remover ${editingTeam.name}? Os participantes voltarão para "Sem Equipe".`)) {
                    removeTeam(editingTeam.id);
                    setEditingTeam(null);
                  }
                }}
                className="border-destructive/30 text-destructive hover:bg-destructive/5 mr-auto"
              >
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditingTeam(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!editingTeam) return;
                const name = editingTeam.name.trim() || "Equipe";
                updateTeam(editingTeam.id, { name, color: editingTeam.color });
                toast({ title: "Equipe atualizada", description: name });
                setEditingTeam(null);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="h-3.5 w-3.5 text-foreground/60" />
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-foreground/60 leading-tight">{label}</p>
      <p className="text-sm font-black tabular-nums leading-tight">{value}</p>
    </div>
  </div>
);

const ParticipantCard = ({
  p,
  team,
  onAssign,
}: {
  p: ActiveParticipant;
  team: string;
  onAssign: (id: number, target: string) => void;
}) => {
  const inactive = p.days === 0;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(p.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-md transition-all",
        inactive ? "border-dashed border-border opacity-70" : "border-border",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
          {inactive && (
            <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 text-muted-foreground border-muted-foreground/30">
              inativo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums mt-0.5">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{p.days}d</span>
          <span className="inline-flex items-center gap-1"><Award className="h-3 w-3" />{Math.round(p.points)}pts</span>
        </div>
      </div>
      {team !== NONE && (
        <button
          onClick={() => onAssign(p.id, NONE)}
          className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"
          aria-label="Remover da equipe"
          title="Remover da equipe"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
