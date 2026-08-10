import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { TableToolbar } from "../TableToolbar";
import { Card, Counter, RankingTable, rowTone } from "./shared";

interface Props {
  rows: any[];
  total: number;
  goal: number;
  search: string;
  onSearch: (v: string) => void;
  onExport: (filename: string, rows: any[][]) => void;
}

export const DaysActiveTab = ({ rows, total, goal, search, onSearch, onExport }: Props) => (
  <Card title="Ranking por Dias Ativos" description="Quem mais movimentou no mês — destaque para quem bateu a meta.">
    <TableToolbar
      value={search}
      onChange={onSearch}
      onExport={() =>
        onExport("ranking_dias_ativos", [
          ["Posição", "Participante", "Dias Ativos", "Pontos", "Meta"],
          ...rows.map((p, i) => [i + 1, p.name, p.days, p.points, p.reachedGoal ? "SIM" : `${p.days}/${goal}`]),
        ])
      }
    />
    <Counter shown={rows.length} total={total} />
    <RankingTable
      rows={rows}
      cols={[
        { h: "Dias Ativos", k: (p) => <strong className="tabular-nums">{p.days}</strong> },
        { h: "Pontos", k: (p) => <span className="tabular-nums">{p.points.toLocaleString("pt-BR")}</span> },
        {
          h: `Meta (${goal}d)`,
          k: (p) =>
            p.reachedGoal ? (
              <Badge className="bg-status-met text-status-met-foreground hover:bg-status-met border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />Atingiu
              </Badge>
            ) : p.days >= goal - 3 ? (
              <Badge className="bg-status-near text-status-near-foreground hover:bg-status-near border-0">Quase lá</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">{goal - p.days}d restantes</Badge>
            ),
        },
        {
          h: `Meta (${goal}d)`,
          k: (p) =>
            p.reachedGoal ? (
              <Badge className="bg-status-met text-status-met-foreground hover:bg-status-met border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />Atingiu
              </Badge>
            ) : p.days >= goal - 3 ? (
              <Badge className="bg-status-near text-status-near-foreground hover:bg-status-near border-0">Quase lá</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">{goal - p.days}d restantes</Badge>
            ),
        },
      ]}
      rowClass={(p) => rowTone(p.days, goal)}
    />
  </Card>
);
