import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { participants, inactives, modalities, schedules, evolution, monthLabel } from "@/data/gmove";
import { RankBadge, Initials } from "./RankBadge";
import { TableToolbar } from "./TableToolbar";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line,
} from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, ExternalLink, XCircle, Flame, Clock, Activity, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const GOAL = 15;

const TABS = [
  { id: "dias", label: "Dias Ativos", icon: Calendar },
  { id: "pontos", label: "Pontos", icon: Flame },
  { id: "historico", label: "Desempenho vs Histórico", icon: TrendingUp },
  { id: "reativacao", label: "Reativação", icon: Activity },
  { id: "videos", label: "Vídeos do mês", icon: ExternalLink },
  { id: "modalidades", label: "Modalidades", icon: Activity },
  { id: "horarios", label: "Horários", icon: Clock },
  { id: "evolucao", label: "Evolução GMover", icon: TrendingUp },
];

const rowToneByDays = (d: number) => {
  if (d >= GOAL) return "row-met";
  if (d >= 12) return "row-near";
  return "";
};

const TONES = ["hsl(var(--primary))", "hsl(var(--primary-glow))", "hsl(140 60% 45%)", "hsl(38 92% 55%)", "hsl(280 60% 55%)", "hsl(190 75% 45%)", "hsl(0 70% 60%)"];

export const Dashboard = () => {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const exportCsv = (filename: string) => {
    toast({ title: "Exportação iniciada", description: `${filename}.csv (demo).` });
  };

  const filtered = useMemo(
    () => participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );
  const filteredByPoints = useMemo(() => [...filtered].sort((a, b) => b.points - a.points), [filtered]);

  const getInactivePriority = (count: number) => {
    if (count >= 50) return { label: "Alta", color: "bg-red-100 text-red-700 border-red-300", dot: "bg-red-500" };
    if (count >= 20) return { label: "Média", color: "bg-amber-100 text-amber-700 border-amber-300", dot: "bg-amber-500" };
    return { label: "Baixa", color: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" };
  };

  const inactivesSorted = useMemo(
    () => [...inactives].sort((a, b) => b.historicalCheckIns - a.historicalCheckIns),
    []
  );

  return (
    <section id="dashboard" className="container py-16 md:py-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
            Dashboard executivo · {monthLabel}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-primary-deep">
            Acompanhamento em tempo real do <span className="text-primary">desafio GMove</span>
          </h2>
        </div>
        <Badge className="bg-status-met text-status-met-foreground hover:bg-status-met text-xs px-3 py-1.5 self-start">
          <span className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse" />
          Ao vivo
        </Badge>
      </div>

      <Tabs defaultValue="dias" className="w-full">
        <div className="overflow-x-auto -mx-2 px-2 mb-6">
          <TabsList className="inline-flex h-auto bg-muted/60 p-1.5 rounded-2xl">
            {TABS.map((t) => (
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

        {/* RANKING DIAS ATIVOS */}
        <TabsContent value="dias" className="animate-fade-in">
          <Card title="Ranking por Dias Ativos" description="Quem mais movimentou no mês — destaque para quem bateu a meta de 15 dias.">
            <TableToolbar value={search} onChange={setSearch} onExport={() => exportCsv("ranking_dias_ativos")} />
            <RankingTable
              rows={filtered}
              cols={[
                { h: "Dias Ativos", k: (p) => <strong className="tabular-nums">{p.daysActive}</strong> },
                { h: "Pontos", k: (p) => <span className="tabular-nums">{p.points.toLocaleString("pt-BR")}</span> },
                {
                  h: "Meta (15d)",
                  k: (p) =>
                    p.daysActive >= GOAL ? (
                      <Badge className="bg-status-met text-status-met-foreground hover:bg-status-met border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Atingiu
                      </Badge>
                    ) : p.daysActive >= 12 ? (
                      <Badge className="bg-status-near text-status-near-foreground hover:bg-status-near border-0">
                        Quase lá
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        {GOAL - p.daysActive}d restantes
                      </Badge>
                    ),
                },
                {
                  h: "Vídeo",
                  k: (p) => p.posted ? (
                    <span className="inline-flex items-center gap-1 text-status-met-foreground font-bold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />SIM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground font-medium text-xs">
                      <XCircle className="h-3.5 w-3.5" />NÃO
                    </span>
                  ),
                },
              ]}
              rowClass={(p) => rowToneByDays(p.daysActive)}
            />
          </Card>
        </TabsContent>

        {/* RANKING PONTOS */}
        <TabsContent value="pontos" className="animate-fade-in">
          <Card title="Ranking por Pontos" description="Pontuação total acumulada no mês considerando intensidade e frequência.">
            <TableToolbar value={search} onChange={setSearch} onExport={() => exportCsv("ranking_pontos")} />
            <RankingTable
              rows={filteredByPoints}
              cols={[
                { h: "Pontos", k: (p) => <strong className="tabular-nums text-primary">{p.points.toLocaleString("pt-BR")}</strong> },
                { h: "Dias Ativos", k: (p) => <span className="tabular-nums">{p.daysActive}</span> },
                {
                  h: "Meta (15d)",
                  k: (p) => p.daysActive >= GOAL ? (
                    <Badge className="bg-status-met text-status-met-foreground hover:bg-status-met border-0">SIM</Badge>
                  ) : <Badge variant="outline">NÃO</Badge>,
                },
                {
                  h: "Média/dia",
                  k: (p) => <span className="tabular-nums text-muted-foreground">{Math.round(p.points / Math.max(1, p.daysActive))}</span>,
                },
              ]}
              rowClass={(p) => rowToneByDays(p.daysActive)}
            />
          </Card>
        </TabsContent>

        {/* HISTORICO */}
        <TabsContent value="historico" className="animate-fade-in">
          <Card title="Desempenho vs Histórico" description="Comparativo entre média histórica e projeção do mês atual.">
            <TableToolbar value={search} onChange={setSearch} onExport={() => exportCsv("desempenho_historico")} />
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-right">Média histórica</TableHead>
                    <TableHead className="text-right">Projeção mês</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead>Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p, i) => {
                    const variation = ((p.projection - p.historicalAvg) / p.historicalAvg) * 100;
                    const up = variation > 5;
                    const down = variation < -5;
                    return (
                      <TableRow
                        key={p.id}
                        className={cn(up && "row-high", down && "row-alert")}
                      >
                        <TableCell className="font-bold text-muted-foreground tabular-nums">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Initials name={p.name} />
                            <span className="font-semibold text-foreground">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.historicalAvg.toFixed(1)}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{p.projection}</TableCell>
                        <TableCell className={cn("text-right tabular-nums font-bold", up && "text-status-high-foreground", down && "text-status-alert-foreground")}>
                          {variation > 0 ? "+" : ""}{variation.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {up ? (
                            <span className="inline-flex items-center gap-1 text-status-high-foreground font-bold text-sm">
                              <ArrowUp className="h-4 w-4" />Alta
                            </span>
                          ) : down ? (
                            <span className="inline-flex items-center gap-1 text-status-alert-foreground font-bold text-sm">
                              <ArrowDown className="h-4 w-4" />Queda
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground font-bold text-sm">
                              <ArrowRight className="h-4 w-4" />Estável
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* REATIVACAO */}
        <TabsContent value="reativacao" className="animate-fade-in">
          <Card title="Reativação" description="Participantes com histórico que não fizeram check-in no mês — ordenados por prioridade de contato.">
            <TableToolbar value={search} onChange={setSearch} onExport={() => exportCsv("reativacao")} placeholder="Buscar inativo..." />
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead>Último check-in</TableHead>
                    <TableHead className="text-right">Total histórico</TableHead>
                    <TableHead className="text-right">Meses ativos</TableHead>
                    <TableHead>Prioridade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactivesSorted
                    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
                    .map((p, i) => {
                      const prio = getInactivePriority(p.historicalCheckIns);
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-muted-foreground tabular-nums">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Initials name={p.name} />
                              <span className="font-semibold">{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{p.lastCheckIn}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold">{p.historicalCheckIns}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.activeMonths}</TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", prio.color)}>
                              <span className={cn("h-2 w-2 rounded-full", prio.dot)} />
                              {prio.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* VIDEOS */}
        <TabsContent value="videos" className="animate-fade-in">
          <Card title="Vídeos do mês" description="Dinâmica especial: participantes que enviaram vídeos de treino para o desafio." badge="Dinâmica do mês">
            <TableToolbar value={search} onChange={setSearch} onExport={() => exportCsv("videos_do_mes")} />
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-right">Dias ativos</TableHead>
                    <TableHead className="text-right">Vídeos</TableHead>
                    <TableHead>Postou?</TableHead>
                    <TableHead>Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p, i) => (
                    <TableRow key={p.id} className={cn(p.posted && "row-video")}>
                      <TableCell><RankBadge position={i + 1} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Initials name={p.name} />
                          <span className="font-semibold">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.daysActive}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold">{p.videos}</TableCell>
                      <TableCell>
                        {p.posted ? (
                          <Badge className="bg-green-600 text-white hover:bg-green-600 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />SIM
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">NÃO</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {p.videoLinks?.map((_, j) => (
                            <a
                              key={j}
                              href="#"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-status-video-foreground/10 text-status-video-foreground hover:bg-status-video-foreground hover:text-white transition-smooth"
                              aria-label={`Vídeo ${j + 1}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )) || <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* MODALIDADES */}
        <TabsContent value="modalidades" className="animate-fade-in">
          <Card title="Modalidades praticadas" description="Distribuição das atividades registradas pelos participantes no mês.">
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modalities} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={13} width={100} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-elegant)" }}
                    formatter={(v: any) => [`${v}%`, "Participação"]}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                    {modalities.map((_, i) => (
                      <Cell key={i} fill={TONES[i % TONES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* HORARIOS */}
        <TabsContent value="horarios" className="animate-fade-in">
          <Card title="Horários preferidos" description="Quando o time mais treina ao longo do dia.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={schedules}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={130}
                      paddingAngle={3}
                      strokeWidth={3}
                      stroke="hsl(var(--background))"
                    >
                      {schedules.map((_, i) => (
                        <Cell key={i} fill={TONES[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-elegant)" }}
                      formatter={(v: any, n: any) => [`${v}%`, n]}
                    />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {schedules.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-4 rounded-xl border border-border bg-gradient-card p-4 shadow-soft">
                    <div className="h-3 w-3 rounded-full" style={{ background: TONES[i] }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-foreground">{s.name}</span>
                        <span className="text-2xl font-black tabular-nums text-primary">{s.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: TONES[i] }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* EVOLUCAO */}
        <TabsContent value="evolucao" className="animate-fade-in">
          <Card title="Evolução GMover" description="Dias ativos por mês dos top 5 participantes (Jun/2025 → Abr/2026).">
            <div className="h-[440px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-elegant)" }}
                  />
                  <Legend iconType="circle" />
                  {["Ana Carolina", "Bruno", "Juliana", "Rafael", "Camila"].map((k, i) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={TONES[i]}
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

/* ---------- subcomponents ---------- */

const Card = ({ title, description, children, badge }: { title: string; description?: string; children: React.ReactNode; badge?: string }) => (
  <div className="rounded-2xl border border-border bg-gradient-card p-5 md:p-7 shadow-card">
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-xl md:text-2xl font-black text-primary-deep">{title}</h3>
          {badge && (
            <Badge className="bg-status-video text-status-video-foreground hover:bg-status-video border-0 text-[10px] uppercase tracking-wider">
              {badge}
            </Badge>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

interface Col {
  h: string;
  k: (p: typeof participants[number]) => React.ReactNode;
}

const RankingTable = ({ rows, cols, rowClass }: { rows: typeof participants; cols: Col[]; rowClass?: (p: typeof participants[number]) => string }) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="w-20">Posição</TableHead>
          <TableHead>Participante</TableHead>
          {cols.map((c, i) => (
            <TableHead key={i} className={i >= cols.length - 2 ? "text-right" : ""}>{c.h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p, i) => (
          <TableRow key={p.id} className={cn("transition-smooth", rowClass?.(p))}>
            <TableCell><RankBadge position={i + 1} /></TableCell>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <Initials name={p.name} />
                <span className="font-semibold text-foreground">{p.name}</span>
              </div>
            </TableCell>
            {cols.map((c, j) => (
              <TableCell key={j} className={j >= cols.length - 2 ? "text-right" : ""}>
                {c.k(p)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={cols.length + 2} className="text-center py-10 text-muted-foreground">
              Nenhum participante encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
