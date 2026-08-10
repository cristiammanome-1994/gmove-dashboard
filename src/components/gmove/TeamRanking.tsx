import { useEffect, useMemo, useState } from "react";
import { Trophy, Users, ChevronDown, Calendar, Flame, Filter, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ActiveParticipant } from "@/lib/gmove-processor";
import { Initials } from "./RankBadge";
import {
  Team, Assignments, COLOR_CLASSES, TEAMS_EVENT, loadTeams, loadAssignments,
} from "@/lib/teams-storage";

type PeriodFilter = "current" | "7d" | "30d";
type SortBy = "points" | "active" | "velocity" | "projection";
type TeamFilter = "all" | "active" | "with-movement";

interface TeamStats {
  team: Team;
  members: ActiveParticipant[];

  totalPoints: number;
  totalDays: number;
  avgDays: number;
  velocity: number;
  projection: number;
  vsLeader: number;

  activeMembers: ActiveParticipant[];
  mvp: ActiveParticipant | null;
}

interface Progress {
  daysElapsed: number;
  daysInMonth: number;
  monthCompleted: boolean;
}

interface Props {
  participants: ActiveParticipant[];
  progress?: Progress;
}

export const TeamRanking = ({ participants, progress }: Props) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("current");
  const [sortBy, setSortBy] = useState<SortBy>("points");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");

  useEffect(() => {
    setTeams(loadTeams());
    setAssignments(loadAssignments());
    const upd = () => {
      setTeams(loadTeams());
      setAssignments(loadAssignments());
    };
    window.addEventListener(TEAMS_EVENT, upd);
    window.addEventListener("gmove:raw-updated", upd);
    return () => {
      window.removeEventListener(TEAMS_EVENT, upd);
      window.removeEventListener("gmove:raw-updated", upd);
    };
  }, []);

  const stats = useMemo<TeamStats[]>(() => {
    const map = new Map<string, ActiveParticipant[]>();
    for (const t of teams) map.set(t.id, []);
    for (const p of participants) {
      const tid = assignments[String(p.id)];
      if (tid && map.has(tid)) map.get(tid)!.push(p);
    }
    const elapsed = progress?.daysElapsed ?? 0;
    const inMonth = progress?.daysInMonth ?? 0;
    const completed = progress?.monthCompleted ?? false;
    const ratio = !completed && elapsed > 0 && inMonth > 0 ? inMonth / elapsed : 1;

    const partial: Omit<TeamStats, "vsLeader">[] = teams.map((team) => {
      const members = map.get(team.id) ?? [];
      const totalPoints = members.reduce((s, p) => s + p.points, 0);
      const totalDays = members.reduce((s, p) => s + p.days, 0);
      const activeMembers = members.filter((p) => p.points > 0 || p.days > 0);
      const mvp =
        members.length > 0
          ? [...members].sort((a, b) => b.points - a.points)[0]
          : null;
      const projection = Math.round(totalPoints * ratio);
      return {
        team,
        members,
        totalPoints,
        totalDays,
        avgDays: members.length ? totalDays / members.length : 0,
        velocity: totalDays ? totalPoints / totalDays : 0,
        projection,
        activeMembers,
        mvp,
      };
    });
    const leaderPts = partial.reduce((m, s) => Math.max(m, s.totalPoints), 0);
    return partial.map((s) => ({ ...s, vsLeader: s.totalPoints - leaderPts }));
  }, [participants, assignments, teams, progress]);

  const filteredStats = useMemo<TeamStats[]>(() => {
    let list = [...stats];
    if (teamFilter === "active") {
      list = list.filter((s) => s.activeMembers.length > 0);
    } else if (teamFilter === "with-movement") {
      list = list.filter((s) => s.totalPoints > 0);
    }
    list.sort((a, b) => {
      if (sortBy === "active") return b.activeMembers.length - a.activeMembers.length;
      if (sortBy === "velocity") return b.velocity - a.velocity;
      if (sortBy === "projection") return b.projection - a.projection;
      return b.totalPoints - a.totalPoints;
    });
    return list;
  }, [stats, sortBy, teamFilter]);

  const totalInTeams = filteredStats.reduce((s, t) => s + t.members.length, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês Atual</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ordenar por</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Pontos</SelectItem>
                <SelectItem value="projection">Projeção fim do mês</SelectItem>
                <SelectItem value="active">Membros ativos</SelectItem>
                <SelectItem value="velocity">Velocidade (pts/d)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Filtro</Label>
            <Select value={teamFilter} onValueChange={(v) => setTeamFilter(v as TeamFilter)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas equipes</SelectItem>
                <SelectItem value="active">Apenas ativas</SelectItem>
                <SelectItem value="with-movement">Com movimentação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {period !== "current" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Filtro de período aplicado sobre os dados carregados. Ajuste o intervalo no painel de configurações para refinar os dados de origem.
          </p>
        )}
      </div>

      {/* Comparativo visual */}
      {filteredStats.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              Comparativo de pontos
            </div>
            {progress && !progress.monthCompleted && (
              <Badge variant="outline" className="text-[10px]">
                Projeção considera {progress.daysElapsed}/{progress.daysInMonth} dias
              </Badge>
            )}
          </div>
          {(() => {
            const maxPts = Math.max(
              ...filteredStats.map((s) => Math.max(s.totalPoints, s.projection)),
              1,
            );
            return (
              <div className="space-y-2.5">
                {filteredStats.map((s) => {
                  const cls = COLOR_CLASSES[s.team.color];
                  const pctNow = (s.totalPoints / maxPts) * 100;
                  const pctProj = (s.projection / maxPts) * 100;
                  const showProj = progress && !progress.monthCompleted && s.projection > s.totalPoints;
                  return (
                    <div key={s.team.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-foreground truncate">{s.team.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {Math.round(s.totalPoints).toLocaleString("pt-BR")} pts
                          {showProj && (
                            <span className={cn("ml-1.5 font-semibold", cls.text)}>
                              → {s.projection.toLocaleString("pt-BR")}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                        {showProj && (
                          <div
                            className={cn("absolute inset-y-0 left-0 opacity-30", cls.chip)}
                            style={{ width: `${pctProj}%` }}
                          />
                        )}
                        <div
                          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", cls.chip)}
                          style={{ width: `${pctNow}%` }}
                        />
                      </div>
                      {s.mvp && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>👑</span>
                          <span className="font-semibold text-foreground truncate">{s.mvp.name}</span>
                          <span className="tabular-nums">· {Math.round(s.mvp.points)} pts</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {filteredStats.slice(0, 3).map((s, index) => {
    const cls = COLOR_CLASSES[s.team.color];
    const leader = filteredStats[0];
    const gap = index === 0 ? 0 : leader.totalPoints - s.totalPoints;
    return (
    <div
      key={s.team.id}
      className={cn("rounded-xl border-2 p-4", cls.border, cls.bg)}
    >
      <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
        {index === 0 ? "🥇 Líder" : index === 1 ? "🥈 Vice-líder" : "🥉 3º Lugar"}
      </div>
      <div className="mt-1 font-black text-base text-foreground">{s.team.name}</div>
      <div className="mt-2 text-sm font-bold tabular-nums">
        {Math.round(s.totalPoints).toLocaleString("pt-BR")} pts
      </div>
      <div className="text-xs text-muted-foreground">
        {s.activeMembers.length}/{s.members.length} ativos
      </div>
      {progress && !progress.monthCompleted && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <TrendingUp className={cn("h-3 w-3", cls.text)} />
          <span className="text-muted-foreground">Projeção:</span>
          <span className={cn("font-bold tabular-nums", cls.text)}>
            {s.projection.toLocaleString("pt-BR")} pts
          </span>
        </div>
      )}
      {index > 0 && gap > 0 && (
        <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
          −{Math.round(gap).toLocaleString("pt-BR")} pts do líder
        </div>
      )}
      {s.mvp && (
        <div className={cn("mt-3 flex items-center gap-2 rounded-lg border p-2", cls.border)}>
          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black", cls.chip)}>
            {s.mvp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">👑 MVP</div>
            <div className="text-xs font-bold text-foreground truncate">{s.mvp.name}</div>
            <div className="text-[11px] tabular-nums text-muted-foreground">
              {Math.round(s.mvp.points).toLocaleString("pt-BR")} pts · {s.mvp.days}d
            </div>
          </div>
        </div>
      )}
    </div>
    );
  })}
</div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-20">Posição</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead className="text-right">Pontos Totais</TableHead>
              {progress && !progress.monthCompleted && (
                <TableHead className="text-right">Projeção</TableHead>
              )}
              <TableHead className="text-right">Membros</TableHead>
              <TableHead>👑 MVP</TableHead>
              <TableHead className="text-right">Média Dias</TableHead>
              <TableHead className="text-right">Velocidade</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStats.map((s, i) => {
              const cls = COLOR_CLASSES[s.team.color];
              const isOpen = openTeam === s.team.id;
              return [
                <TableRow
                  key={s.team.id}
                  className={cn("transition-smooth cursor-pointer", cls.bg, isOpen && "bg-muted/60")}
                  onClick={() => setOpenTeam(isOpen ? null : s.team.id)}
                >
                  <TableCell>
                    {i === 0 ? (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground tabular-nums">{i + 1}º</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black", cls.chip)}>
                        {s.team.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-foreground">{s.team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-bold text-foreground">
                    {Math.round(s.totalPoints).toLocaleString("pt-BR")}
                  </TableCell>
                  {progress && !progress.monthCompleted && (
                    <TableCell className="text-right tabular-nums">
                      <span className={cn("inline-flex items-center gap-1 font-semibold", cls.text)}>
                        <TrendingUp className="h-3.5 w-3.5" />
                        {s.projection.toLocaleString("pt-BR")}
                      </span>
                    </TableCell>
                  )}
                 <TableCell className="text-right tabular-nums">
  <div className="flex flex-col items-end">
    <span className="inline-flex items-center gap-1.5">
      <Users className="h-3.5 w-3.5 text-muted-foreground" />
      {s.members.length}
    </span>

    <span className="text-xs font-medium text-green-600">
  {s.activeMembers.length}/{s.members.length} ativos
</span>
  </div>
</TableCell>
                  <TableCell>
                    {s.mvp ? (
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black shrink-0", cls.chip)}>
                          {s.mvp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">{s.mvp.name}</div>
                          <div className="text-[11px] tabular-nums text-muted-foreground">{Math.round(s.mvp.points)} pts</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {s.avgDays.toFixed(1)}d
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant="outline" className={cn("font-bold", cls.text, cls.border)}>
                      {s.velocity.toFixed(1)} pts/d
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronDown
                      className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </TableCell>
                </TableRow>,
                isOpen && (
                  <TableRow key={`${s.team.id}-detail`} className={cn("border-0", cls.bg)}>
                    <TableCell colSpan={progress && !progress.monthCompleted ? 9 : 8} className="p-0">
                      <div className="px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Membros da {s.team.name}
                        </p>
                        {s.mvp && (
  <div className="mb-3 rounded-lg border bg-card p-3">
    <div className="flex items-center gap-2">
      <Flame className="h-4 w-4 text-orange-500" />

      <span className="font-semibold">
        MVP da Equipe
      </span>
    </div>

    <div className="mt-2 text-sm">
      <div className="font-bold">
        {s.mvp.name}
      </div>

      <div className="text-muted-foreground">
  {Math.round(s.mvp.points)} pts • {s.mvp.days} dias ativos
</div>

<div className="mt-1 text-xs text-muted-foreground">
  Líder da equipe no ranking atual
</div>
    </div>
  </div>
)}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Participante</TableHead>
                                <TableHead className="text-right">Pontos</TableHead>
                                <TableHead className="text-right">Dias</TableHead>
                                <TableHead className="text-right">Média/dia</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...s.members]
                                .sort((a, b) => b.points - a.points)
                                .map((m, idx) => (
                                  <TableRow key={m.id} className="hover:bg-muted/30 transition-smooth">
                                    <TableCell className="text-sm font-bold text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2.5">
                                        <Initials name={m.name} />
                                        <span className="font-semibold text-foreground text-sm">{m.name}</span>
                                        {m.days === 0 && (
                                          <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 text-muted-foreground border-muted-foreground/30">
                                            inativo
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums font-semibold">
                                      <span className="inline-flex items-center gap-1">
                                        <Flame className="h-3 w-3 text-orange-500" />
                                        {Math.round(m.points).toLocaleString("pt-BR")}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                      <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        {m.days}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                                      {Math.round(m.points / Math.max(1, m.days))}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              {s.members.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                                    Nenhum membro ainda.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              ];
            })}
            {(teams.length === 0 || totalInTeams === 0) && (
              <TableRow>
                <TableCell colSpan={progress && !progress.monthCompleted ? 9 : 8} className="text-center py-10 text-muted-foreground">
                  {teams.length === 0
                    ? 'Nenhuma equipe criada. Vá até "Gerenciar Equipes" para criar.'
                    : 'Nenhum participante atribuído. Vá até "Gerenciar Equipes" para montar as equipes.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
