import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankBadge, Initials } from "../RankBadge";
import { TableToolbar } from "../TableToolbar";
import { Card, Counter } from "./shared";

interface Props {
  rows: any[];
  total: number;
  search: string;
  onSearch: (v: string) => void;
  onExport: (filename: string, rows: any[][]) => void;
}

export const VideosTab = ({ rows, total, search, onSearch, onExport }: Props) => (
  <Card
    title="Vídeos do mês"
    description="Dinâmica especial: participantes que enviaram vídeos de treino."
    badge="Dinâmica do mês"
  >
    <TableToolbar
      value={search}
      onChange={onSearch}
      onExport={() =>
        onExport("videos_do_mes", [
          ["#", "Participante", "Dias Ativos", "Qtd Vídeos", "Postou"],
          ...rows.map((p, i) => [i + 1, p.name, p.days, p.videos.length, p.hasVideo ? "SIM" : "NÃO"]),
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
            <TableHead className="text-right">Dias ativos</TableHead>
            <TableHead className="text-right">Vídeos</TableHead>
            <TableHead>Postou?</TableHead>
            <TableHead>Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => (
            <TableRow key={p.id} className={cn(p.hasVideo && "row-video")}>
              <TableCell><RankBadge position={i + 1} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Initials name={p.name} />
                  <span className="font-semibold">{p.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{p.days}</TableCell>
              <TableCell className="text-right tabular-nums font-bold">{p.videos.length}</TableCell>
              <TableCell>
                {p.hasVideo ? (
                  <Badge className="bg-green-600 text-white hover:bg-green-600 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />SIM
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">NÃO</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5 flex-wrap">
                  {p.videos.slice(0, 3).map((url: string, j: number) => (
                    <a
                      key={j} href={url} target="_blank" rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-status-video-foreground/10 text-status-video-foreground hover:bg-status-video-foreground hover:text-white transition-smooth"
                      aria-label={`Vídeo ${j + 1}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                  {p.videos.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </Card>
);
