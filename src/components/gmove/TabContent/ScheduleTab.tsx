import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, TONES } from "./shared";

interface Props {
  schedules: any[];
}

export const ScheduleTab = ({ schedules }: Props) => (
  <Card title="Horários preferidos" description="Quando o time mais treina ao longo do dia.">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={schedules} dataKey="pct" nameKey="name"
              innerRadius={70} outerRadius={130} paddingAngle={3}
              strokeWidth={3} stroke="hsl(var(--background))"
            >
              {(schedules ?? []).map((_, i) => <Cell key={i} fill={TONES[i]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-elegant)" }}
              formatter={(v: any, n: any) => [`${v}%`, n]}
            />
            <Legend verticalAlign="bottom" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {(schedules ?? []).map((s, i) => (
          <div key={s.name} className="flex items-center gap-4 rounded-xl border border-border bg-gradient-card p-4 shadow-soft">
            <div className="h-3 w-3 rounded-full" style={{ background: TONES[i] }} />
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-foreground">{s.name}</span>
                <span className="text-2xl font-black tabular-nums text-primary">{s.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: TONES[i] }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">{s.count} check-ins</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Card>
);
