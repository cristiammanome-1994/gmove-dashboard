import { useState, useMemo } from "react";
import { Card } from "./shared";
import { TableToolbar } from "../TableToolbar";
import { useExportCsv } from "./shared";
import { cn } from "@/lib/utils";

interface MonthPhoto {
  checkinId: number;
  memberId: number;
  memberName: string;
  title: string | null;
  occurredAt: string;
  photoUrl: string | null;
  duration: number | null;
}

interface Props {
  photos: MonthPhoto[];
  search: string;
  onSearch: (v: string) => void;
  onExport: (filename: string, rows: any[][]) => void;
}

export const MonthImagesTab = ({ photos, search, onSearch, onExport }: Props) => {
  const [filterMember, setFilterMember] = useState<string>("");

  const members = useMemo(() => {
    const set = new Set<string>();
    photos.forEach(p => set.add(p.memberName));
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [photos]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return photos.filter(p =>
      (p.title?.toLowerCase().includes(term) ?? false) ||
      p.memberName.toLowerCase().includes(term)
    ).filter(p => !filterMember || p.memberName === filterMember);
  }, [photos, search, filterMember]);

  const sortedPhotos = useMemo(() => [...filtered].sort((a, b) =>
    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  ), [filtered]);

  return (
    <Card
      title="Imagens do Mês"
      description="Todas as fotos enviadas nos check-ins do período selecionado."
    >
      <TableToolbar
        value={search}
        onChange={onSearch}
        placeholder="Buscar por título ou participante..."
        onExport={() =>
          onExport("imagens_do_mes", [
            ["Data", "Participante", "Título", "Duração (min)", "URL da Imagem"],
            ...sortedPhotos.map(p => [
              new Date(p.occurredAt).toLocaleString("pt-BR"),
              p.memberName,
              p.title ?? "—",
              p.duration ?? "—",
              p.photoUrl ?? "—",
            ]),
          ])
        }
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="h-10 px-3 border border-border rounded-lg bg-background text-sm"
        >
          <option value="">Todos os participantes</option>
          {members.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">
          {sortedPhotos.length} imagem(ns) encontrada(s)
        </span>
      </div>

      {sortedPhotos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma imagem encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPhotos.map((photo, idx) => (
            <div
              key={`${photo.checkinId}-${idx}`}
              className={cn(
                "group relative rounded-xl overflow-hidden border border-border bg-card shadow-soft transition-smooth hover:shadow-elegant",
                photo.duration !== null && photo.duration < 15
                  ? "ring-2 ring-yellow-500"
                  : ""
              )}
            >
              {photo.photoUrl && (
                <a
                  href={photo.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-[4/3] overflow-hidden"
                >
                  <img
                    src={photo.photoUrl}
                    alt={photo.title ?? `Check-in de ${photo.memberName}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </a>
              )}
              <div className="p-3 space-y-1">
                <p className="font-semibold text-sm truncate">{photo.memberName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {photo.title ?? "Sem título"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time>{new Date(photo.occurredAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
                  {photo.duration !== null && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      photo.duration < 15 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    )}>
                      {photo.duration} min
                    </span>
                  )}
                </div>
                {photo.duration !== null && photo.duration < 15 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded">
                    ⚠ Menos de 15 min
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};