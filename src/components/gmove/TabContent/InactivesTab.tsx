import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Initials } from "../RankBadge";
import { TableToolbar } from "../TableToolbar";
import { Card, Counter, inactivePriority } from "./shared";

interface Props {
  rows: any[];
  total: number;
  search: string;
  onSearch: (v: string) => void;
  onExport: (filename: string, rows: any[][]) => void;
}

export const InactivesTab = ({ rows, total, search, onSearch, onExport }: Props) => (
  <Card title="Reativação" description="Participantes com histórico que não fizeram check-in no mês.">
    <TableToolbar
      value={search}
      onChange={onSearch}
      placeholder="Buscar inativo..."
      onExport={() =>
        onExport("reativacao", [
          ["#", "Participante", "Último check-in", "Total histórico", "Meses ativos", "Prioridade"],
          ...rows.map((p, i) => [
            i + 1, p.name,
            p.lastCheckIn ? new Date(p.lastCheckIn).toLocaleDateString("pt-BR") : "—",
            p.total, p.monthsActive, p.priority,
          ]),
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
            <TableHead>Último check-in</TableHead>
            <TableHead className="text-right">Total histórico</TableHead>
            <TableHead className="text-right">Meses ativos</TableHead>
            <TableHead>Prioridade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => {
            const prio = inactivePriority(p.total);
            return (
              <TableRow key={p.id} className={cn("transition-colors", prio.row)}>
                <TableCell className="font-bold text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Initials name={p.name} />
                    <span className="font-semibold">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {p.lastCheckIn ? new Date(p.lastCheckIn).toLocaleDateString("pt-BR") : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold">{p.total}</TableCell>
                <TableCell className="text-right tabular-nums">{p.monthsActive}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", prio.color)}>
                    <span className={cn("h-2 w-2 rounded-full", prio.dot)} />
                    {prio.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum inativo.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
);
