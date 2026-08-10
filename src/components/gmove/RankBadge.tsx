import { Medal, Trophy, Award } from "lucide-react";

export const RankBadge = ({ position }: { position: number }) => {
  if (position === 1)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-elegant ring-2 ring-yellow-200">
        <Trophy className="h-4 w-4" strokeWidth={2.6} />
      </span>
    );
  if (position === 2)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 shadow-soft ring-2 ring-slate-100">
        <Medal className="h-4 w-4" strokeWidth={2.6} />
      </span>
    );
  if (position === 3)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 shadow-soft ring-2 ring-orange-100">
        <Award className="h-4 w-4" strokeWidth={2.6} />
      </span>
    );
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm tabular-nums">
      {position}
    </span>
  );
};

export const Initials = ({ name }: { name: string }) => {
  const parts = name.split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  // deterministic color from name
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = [
    "bg-primary/15 text-primary",
    "bg-status-met text-status-met-foreground",
    "bg-status-near text-status-near-foreground",
    "bg-status-high text-status-high-foreground",
    "bg-status-alert text-status-alert-foreground",
    "bg-status-video text-status-video-foreground",
  ];
  const cls = palette[hash % palette.length];
  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs ${cls}`}>
      {initials.toUpperCase()}
    </span>
  );
};
