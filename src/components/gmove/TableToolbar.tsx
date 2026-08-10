import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onExport: () => void;
  placeholder?: string;
}

export const TableToolbar = ({ value, onChange, onExport, placeholder = "Buscar participante..." }: Props) => (
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
    <Button variant="outline" onClick={onExport} className="border-primary/30 text-primary hover:bg-primary/5">
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  </div>
);
