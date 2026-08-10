import { Badge } from "@/components/ui/badge";
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

export const PointsTab = ({ rows, total, goal, search, onSearch, onExport }: Props) => (
  <Card title="Ranking por Pontos" description="Pontuação total acumulada no mês.">
    <TableToolbar
      value={search}
      onChange={onSearch}
      onExport={() =>
        onExport("ranking_pontos", [
          ["Posição", "Participante", "Pontos", "Dias Ativos"],
          ...rows.map((p, i) => [i + 1, p.name, p.points, p.days]),
        ])
      }
    />
    <Counter shown={rows.length} total={total} />
    <RankingTable
      rows={rows}
      cols={[
        { h: "Pontos", k: (p) => <strong className="tabular-nums text-primary">{p.points.toLocaleString("pt-BR")}</strong> },
        { h: "Dias Ativos", k: (p) => <span className="tabular-nums">{p.days}</span> },
        {
          h: `Meta (${goal}d)`,
          k: (p) =>
            p.reachedGoal ? (
              <Badge className="bg-status-met text-status-met-foreground hover:bg-status-met border-0">SIM</Badge>
            ) : (
              <Badge variant="outline">NÃO</Badge>
            ),
        },
        {
          h: "Média/dia",
          k: (p) => (
            <span className="tabular-nums text-muted-foreground">
              {Math.round(p.points / Math.max(1, p.days))}
            </span>
          ),
        },
      ]}
      rowClass={(p) => rowTone(p.days, goal)}
    />
  </Card>
);
