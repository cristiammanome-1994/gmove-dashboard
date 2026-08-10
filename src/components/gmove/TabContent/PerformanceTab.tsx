import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Initials } from "../RankBadge";
import { TableToolbar } from "../TableToolbar";
import { Card, Counter } from "./shared";

interface Props {
  rows: any[];
  total: number;
  projectionHeader: string;
  search: string;
  onSearch: (v: string) => void;
  onExport: (filename: string, rows: any[][]) => void;
}

export const PerformanceTab = ({ rows, total, projectionHeader, search, onSearch, onExport }: Props) => (
  <Card title="Desempenho vs Histórico" description="Comparativo entre média histórica e projeção do mês atual.">
    <TableToolbar
      value={search}
      onChange={onSearch}
      onExport={() =>
        onExport("desempenho_historico", [
          ["Posição", "Participante", "Média Histórica", "Projeção", "Variação %"],
          ...rows.map((p, i) => [i + 1, p.name, p.historicalAvg, p.projection, p.variationPct]),
        ])
      }
    />
    <Counter shown={rows.length} total={total} />
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-16">#</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Média histórica</TableHead>
            <TableHead className="text-right">{projectionHeader}</TableHead>
            <TableHead className="text-right">Variação</TableHead>
            <TableHead>Tendência</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => {
            const v = p.variationPct ?? 0;
            const up = v >= 10;
            const down = v <= -20;
            return (
              <TableRow key={p.id} className={cn(up && "row-high", down && "row-alert")}>
                <TableCell className="font-bold text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Initials name={p.name} />
                    <span className="font-semibold text-foreground">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{p.historicalAvg?.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums font-bold">{p.projection.toFixed(1)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-bold",
                    up && "text-status-high-foreground",
                    down && "text-status-alert-foreground",
                  )}
                >
                  {v > 0 ? "+" : ""}{v.toFixed(1)}%
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
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Sem dados históricos suficientes.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
);
