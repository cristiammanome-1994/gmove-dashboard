import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, TONES } from "./shared";

interface Props {
  modalities: any[];
}

export const ModalitiesTab = ({ modalities }: Props) => (
  <Card title="Modalidades praticadas" description="Distribuição das atividades registradas pelos participantes no mês.">
    <div className="h-[460px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={modalities} layout="vertical" margin={{ left: 30, right: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
          <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={13} width={110} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-elegant)" }}
            formatter={(v: any, _n: any, p: any) => [`${v}% (${p.payload.count} check-ins)`, "Participação"]}
          />
          <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={24}>
            {(modalities ?? []).map((_, i) => <Cell key={i} fill={TONES[i % TONES.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);
