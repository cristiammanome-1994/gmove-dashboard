import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RankBadge, Initials } from "../RankBadge";
import { TableToolbar } from "../TableToolbar";
import { Card, Counter, useExportCsv } from "./shared";
import { cn } from "@/lib/utils";

interface Props {
  rows: any[];
  total: number;
  search: string;
  onSearch: (v: string) => void;
  onExport: (filename: string, rows: any[][]) => void;
}

export const ModalidadesPorGmoverTab = ({ rows, total, search, onSearch, onExport }: Props) => (
  <Card
    title="Modalidades por Gmover"
    description="Quantidade de esportes diferentes praticados por cada participante no mês (agrupamento de atividades similares)."
  >
    <TableToolbar
      value={search}
      onChange={onSearch}
      onExport={() =>
        onExport("modalidades_por_gmover", [
          ["Posição", "Participante", "Qtd Esportes", "Qtd Modalidades", "Esportes", "Modalidades"],
          ...rows.map((p, i) => [
            i + 1,
            p.name,
            p.sportCount,
            p.modalityCount,
            p.sports.map((s: any) => `${s.name} (${s.count})`).join("; "),
            p.modalities.map((m: any) => `${m.name} (${m.count})`).join("; "),
          ]),
        ])
      }
    />
    <Counter shown={rows.length} total={total} />
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-20">Posição</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Esportes</TableHead>
            <TableHead className="text-right">Modalidades</TableHead>
            <TableHead>Esportes Praticados</TableHead>
            <TableHead>Modalidades Brutas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => (
            <TableRow key={p.id} className={cn("transition-smooth")}>
              <TableCell><RankBadge position={i + 1} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Initials name={p.name} />
                  <span className="font-semibold text-foreground">{p.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums font-bold text-primary">
                {p.sportCount}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium text-muted-foreground">
                {p.modalityCount}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {p.sports.length > 0 ? (
                    p.sports.map((s: any, idx: number) => (
                      <Badge key={idx} className="gap-1 bg-primary/10 text-primary border-primary/20">
                        {s.name}
                        <span className="text-xs opacity-70">({s.count})</span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {p.modalities.length > 0 ? (
                    p.modalities.map((m: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {m.name}
                        <span className="text-xs opacity-70">({m.count})</span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Nenhum participante encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
);