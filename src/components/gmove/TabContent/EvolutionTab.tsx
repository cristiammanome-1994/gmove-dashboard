import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, RotateCcw, ChevronDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, TONES } from "./shared";

interface Props {
  evolution: any[];
  allUsers: string[];
  selectedUsers: string[];
  onToggleUser: (name: string) => void;
  onReset: () => void;
  maxUsers: number;
  goal: number;
}

export const EvolutionTab = ({
  evolution, allUsers, selectedUsers, onToggleUser, onReset, maxUsers, goal,
}: Props) => (
  <Card
    title="Evolução GMover"
    description={`Dias ativos por mês. Linha tracejada = meta de ${goal} dias. Selecione até ${maxUsers} participantes.`}
  >
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Participantes
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {selectedUsers.length}/{maxUsers}
            </Badge>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-3 border-b">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {allUsers.length} participantes no histórico
            </p>
          </div>
          <ScrollArea className="h-72">
            <div className="p-2 space-y-1">
              {allUsers.map((name) => {
                const checked = selectedUsers.includes(name);
                return (
                  <label
                    key={name}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-smooth",
                      checked ? "bg-primary/10 text-primary-deep font-semibold" : "hover:bg-muted",
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => onToggleUser(name)} />
                    <span className="flex-1 truncate">{name}</span>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
        <RotateCcw className="h-4 w-4" /> Top 5
      </Button>
      <div className="ml-auto text-xs text-muted-foreground">
        Mostrando <strong className="tabular-nums">{selectedUsers.length}</strong> de{" "}
        <strong className="tabular-nums">{allUsers.length}</strong>
      </div>
    </div>

    <div className="h-[440px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={(evolution ?? []).map((e) => ({
            month: e.monthLabel,
            ...Object.fromEntries(selectedUsers.map((u) => [u, e.byUser[u]?.days ?? 0])),
          }))}
          margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-elegant)" }} />
          <Legend iconType="circle" />
          <ReferenceLine
            y={goal}
            stroke="hsl(var(--primary))"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{ value: `Meta ${goal}d`, position: "right", fill: "hsl(var(--primary))", fontSize: 11, fontWeight: 700 }}
          />
          {selectedUsers.map((u, i) => (
            <Line
              key={u} type="monotone" dataKey={u}
              stroke={TONES[i % TONES.length]} strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);
