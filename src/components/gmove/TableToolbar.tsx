import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  count?: number;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onExport: () => void;
  placeholder?: string;
  filters?: FilterChip[];
  onFilterChange?: (filterId: string, active: boolean) => void;
  totalCount?: number;
  filteredCount?: number;
}

export const TableToolbar = ({
  value,
  onChange,
  onExport,
  placeholder = "Buscar participante...",
  filters = [],
  onFilterChange,
  totalCount,
  filteredCount,
}: Props) => {
  const hasActiveFilters = filters.some(f => f.active);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 bg-white"
        />
      </div>

      {/* Filter Chips */}
      {(filters.length > 0 || totalCount !== undefined) && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter.id}
              variant={filter.active ? "default" : "outline"}
              className={cn(
                "gap-1.5 px-2.5 py-1.5 text-sm cursor-pointer transition-all",
                filter.active && "bg-primary text-primary-foreground border-primary"
              )}
              onClick={() => onFilterChange?.(filter.id, !filter.active)}
            >
              {filter.icon && <span aria-hidden="true">{filter.icon}</span>}
              {filter.label}
              {filter.count !== undefined && (
                <span className={cn(
                  "px-1.5 py-0.5 text-[10px] font-mono rounded-full",
                  filter.active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {filter.count}
                </span>
              )}
              {filter.active && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFilterChange?.(filter.id, false); }}
                  className="ml-0.5 p-0.5 rounded hover:bg-primary-foreground/10"
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => filters.forEach(f => f.active && onFilterChange?.(f.id, false))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}

          {(totalCount !== undefined || filteredCount !== undefined) && (
            <span className="text-xs text-muted-foreground px-2">
              {filteredCount !== undefined ? filteredCount : totalCount}
              {totalCount !== undefined && filteredCount !== undefined && filteredCount !== totalCount
                ? ` de ${totalCount}`
                : ""} resultado{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Filtros"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onExport} className="border-primary/30 text-primary hover:bg-primary/5">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
};
