import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankBadge, Initials } from "../RankBadge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SearchX, Inbox, FilterX, Upload, AlertCircle } from "lucide-react";

export const TONES = [
  "hsl(var(--primary))", "hsl(var(--primary-glow))", "hsl(140 60% 45%)",
  "hsl(38 92% 55%)", "hsl(280 60% 55%)", "hsl(190 75% 45%)", "hsl(0 70% 60%)",
  "hsl(220 70% 55%)",
];

export const rowTone = (days: number, goal: number) =>
  days >= goal ? "row-met" : days >= goal - 3 ? "row-near" : "";

export const inactivePriority = (count: number) => {
  if (count >= 50)
    return {
      label: "Alta",
      color: "bg-red-100 text-red-700 border-red-300",
      dot: "bg-red-500",
      row: "bg-red-50/70 hover:bg-red-100/70",
    };
  if (count >= 20)
    return {
      label: "Média",
      color: "bg-amber-100 text-amber-700 border-amber-300",
      dot: "bg-amber-500",
      row: "bg-amber-50/70 hover:bg-amber-100/70",
    };
  return {
    label: "Baixa",
    color: "bg-slate-100 text-slate-600 border-slate-300",
    dot: "bg-slate-400",
    row: "bg-slate-50/70 hover:bg-slate-100/70",
  };
};

export function useExportCsv(month: number, year: number) {
  const { toast } = useToast();
  return useCallback(
    (filename: string, rows: any[][]) => {
      const csv = rows
        .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const mm = month.toString().padStart(2, "0");
      const fullName = `gmove_${filename}_${mm}_${year}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fullName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exportado", description: `${fullName}.csv baixado.` });
    },
    [month, year, toast],
  );
}

export const Card = ({
  title, description, children, badge,
}: { title: string; description?: string; children: React.ReactNode; badge?: string }) => (
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

export const Counter = ({ shown, total }: { shown: number; total: number }) => (
  <p className="text-xs text-muted-foreground text-right -mt-2 mb-3">
    Mostrando <strong className="tabular-nums">{shown}</strong> de{" "}
    <strong className="tabular-nums">{total}</strong> participantes
  </p>
);

interface EmptyStateProps {
  variant?: "no-results" | "no-data" | "error";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  variant = "no-results",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const Icon = variant === "no-results" ? SearchX : variant === "error" ? AlertCircle : Inbox;

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center max-w-sm mx-auto">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {variant === "no-results" ? <FilterX className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const DataEmptyState = ({ onUpload }: { onUpload?: () => void }) => (
  <EmptyState
    variant="no-data"
    title="Ainda não há dados para exibir"
    description="Carregue o arquivo challenge-data.json para começar a análise."
    actionLabel={onUpload ? "Carregar dados" : undefined}
    onAction={onUpload}
  />
);

export interface Col {
  h: string;
  k: (p: any) => React.ReactNode;
}

export const RankingTable = ({
  rows, cols, rowClass,
}: { rows: any[]; cols: Col[]; rowClass?: (p: any) => string }) => (
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
            <TableCell colSpan={cols.length + 2} className="text-center py-12">
              <EmptyState
                variant="no-results"
                title="Nenhum participante encontrado"
                description="Tente ajustar a busca ou limpar os filtros para ver todos os participantes."
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
