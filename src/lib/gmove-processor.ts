// Processador GMove - replica a lógica do gmove_dashboard.py em TypeScript
// Recebe o challenge-data.json e produz todas as estatísticas do desafio.

export type RawMember = { id: number; full_name: string };
export type RawActivity = { platform_activity?: string | null };
export type RawMedia = { medium_type?: string; url?: string; thumbnail_url?: string | null };
export type RawCheckIn = {
  account_id: number;
  occurred_at: string;
  points?: number | null;
  duration?: number | null;
  title?: string | null;
  photo_url?: string | null;
  check_in_activities?: RawActivity[];
  check_in_media?: RawMedia[];
};
export type RawData = {
  members: RawMember[];
  check_ins: RawCheckIn[];
};

export type ProcessOptions = {
  month: number; // 1-12
  year: number;
  goalDays: number;
  minActiveDays: number;
  excludeNames: string[];
  useVideoDynamic: boolean;
  dayFrom?: number; // 1..daysInMonth (opcional — janela de filtro)
  dayTo?: number;   // 1..daysInMonth
};

export const DEFAULT_OPTIONS: ProcessOptions = {
  month: 4,
  year: 2026,
  goalDays: 15,
  minActiveDays: 3,
  excludeNames: ["Cristiam Manome"],
  useVideoDynamic: true,
};

export type ActiveParticipant = {
  id: number;
  name: string;
  days: number;
  checkins: number;
  points: number;
  activeReal: boolean;
  reachedGoal: boolean;
  hasVideo: boolean;
  videos: string[];
  historicalAvg: number | null;
  projection: number;
  variationPct: number | null;
};

export type InactiveRow = {
  id: number;
  name: string;
  total: number;
  monthsActive: number;
  lastCheckIn: Date | null;
  priority: "Alta" | "Média" | "Baixa";
};

export type EvolutionPoint = {
  monthLabel: string; // "Jun/25"
  monthKey: string; // "2025-06"
  byUser: Record<string, { days: number; points: number }>;
};

export type ParticipantModality = {
  id: number;
  name: string;
  modalityCount: number;
  modalities: { name: string; count: number }[];
  sportCount: number;
  sports: { name: string; count: number }[];
};

export type MonthPhoto = {
  checkinId: number;
  memberId: number;
  memberName: string;
  title: string | null;
  occurredAt: string;
  photoUrl: string | null;
  duration: number | null;
};

export type TargetMonthCheckIn = {
  id: number;
  account_id: number;
  memberName: string;
  occurred_at: string;
  duration: number | null;
  title: string | null;
  points: number | null;
  check_in_activities: { platform_activity?: string | null }[];
};

export type ProcessedDashboard = {
  options: ProcessOptions;
  monthLabel: string;
  generatedAt: string;
  summary: {
    active: number;
    activeReal: number;
    inactive: number;
    totalCheckIns: number;
    avgPerActive: number;
    goalReached: number;
    goalReachedPct: number;
    videosSubmitted: number;
    daysElapsed: number;
    daysInMonth: number;
    monthCompleted: boolean;
  };
  rankingDays: ActiveParticipant[];
  rankingPoints: ActiveParticipant[];
  historicalCompare: ActiveParticipant[];
  inactives: InactiveRow[];
  videos: ActiveParticipant[];
  modalities: { name: string; count: number; pct: number }[];
  modalitiesByUser: ParticipantModality[];
  schedules: { name: string; count: number; pct: number }[];
  evolution: EvolutionPoint[];
  evolutionUsers: string[];
  evolutionAllUsers: string[];
  monthPhotos: MonthPhoto[];
  targetMonthCheckIns: TargetMonthCheckIn[];
  allParticipants: ActiveParticipant[];
};

const SP_OFFSET_HOURS = -3; // America/Sao_Paulo (sem DST atual)

function toLocalDate(iso: string): Date {
  // Converte ISO UTC para data local SP (apenas para extrair month/day/hour corretos)
  const d = new Date(iso);
  return new Date(d.getTime() + SP_OFFSET_HOURS * 3600 * 1000);
}

const MONTH_NAMES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_FULL_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function processChallenge(data: RawData, opts: ProcessOptions = DEFAULT_OPTIONS): ProcessedDashboard {
  const members = data?.members ?? [];
  const checkIns = data?.check_ins ?? [];

  const excludeLower = (opts?.excludeNames ?? []).map((n) => n.toLowerCase());
  const isExcluded = (name: string) => {
    const n = name.toLowerCase();
    return excludeLower.some((ex) => n.includes(ex));
  };

  const idToName = new Map<number, string>();
  for (const m of members) idToName.set(m.id, m.full_name);

  // Estruturas
  const daysActive = new Map<number, Set<string>>(); // uid -> set 'YYYY-MM-DD'
  const points = new Map<number, number>();
  const checkinsCount = new Map<number, number>();
  const modalities = new Map<string, number>();
  const schedules = new Map<string, number>();
  const videosByUser = new Map<number, string[]>();
  // Modalidades por usuário (mês alvo)
  const userModalities = new Map<number, Map<string, number>>();
  // Esportes agrupados por usuário (mês alvo)
  const userSports = new Map<number, Map<string, number>>();
  // Fotos do mês
  const monthPhotos: MonthPhoto[] = [];
  // Check-ins do mês alvo (para validação)
  const targetMonthCheckIns: TargetMonthCheckIn[] = [];

  // Histórico (todos os meses)
  const historicalTotal = new Map<number, number>();
  const historicalByMonth = new Map<number, Map<string, Set<string>>>(); // uid -> 'YYYY-MM' -> set of dates
  const lastCheckIn = new Map<number, Date>();

  const targetKey = `${opts.year}-${String(opts.month).padStart(2, "0")}`;

  for (const c of checkIns) {
    try {
      const uid = c.account_id;
      const name = idToName.get(uid);
      if (!name || isExcluded(name)) continue;

      const dt = toLocalDate(c.occurred_at);
      const mKey = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
      const dateStr = `${mKey}-${String(dt.getUTCDate()).padStart(2, "0")}`;

      historicalTotal.set(uid, (historicalTotal.get(uid) ?? 0) + 1);
      let hMap = historicalByMonth.get(uid);
      if (!hMap) {
        hMap = new Map();
        historicalByMonth.set(uid, hMap);
      }
      let hSet = hMap.get(mKey);
      if (!hSet) {
        hSet = new Set();
        hMap.set(mKey, hSet);
      }
      hSet.add(dateStr);

      const prev = lastCheckIn.get(uid);
      const realDt = new Date(c.occurred_at);
      if (!prev || realDt > prev) lastCheckIn.set(uid, realDt);

      if (mKey !== targetKey) continue;

      // Filtro de janela dentro do mês (dayFrom/dayTo)
      const dom = dt.getUTCDate();
      const _df = opts.dayFrom ?? 1;
      const _dt = opts.dayTo ?? 31;
      if (dom < _df || dom > _dt) continue;

      // Mês alvo
      let dSet = daysActive.get(uid);
      if (!dSet) {
        dSet = new Set();
        daysActive.set(uid, dSet);
      }
      dSet.add(dateStr);
      points.set(uid, (points.get(uid) ?? 0) + (c.points ?? 0));
      checkinsCount.set(uid, (checkinsCount.get(uid) ?? 0) + 1);

      for (const a of c.check_in_activities ?? []) {
        const k = a.platform_activity || "outros";
        modalities.set(k, (modalities.get(k) ?? 0) + 1);

        // Modalidades por usuário (platform_activity bruto)
        let uMod = userModalities.get(uid);
        if (!uMod) {
          uMod = new Map();
          userModalities.set(uid, uMod);
        }
        uMod.set(k, (uMod.get(k) ?? 0) + 1);

        // Esportes agrupados por usuário
        const sport = groupSport(k);
        let uSport = userSports.get(uid);
        if (!uSport) {
          uSport = new Map();
          userSports.set(uid, uSport);
        }
        uSport.set(sport, (uSport.get(sport) ?? 0) + 1);
      }

      // Coletar fotos do mês
      for (const media of c.check_in_media ?? []) {
        const t = media.medium_type ?? "";
        const url = media.url ?? "";
        const thumb = media.thumbnail_url ?? "";
        if (t.startsWith("image") || url.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)) {
          monthPhotos.push({
            checkinId: c.id,
            memberId: uid,
            memberName: name,
            title: c.title ?? null,
            occurredAt: c.occurred_at,
            photoUrl: thumb || url,
            duration: c.duration ?? null,
          });
        }
      }

      // Coletar check-in do mês para validação
      targetMonthCheckIns.push({
        id: c.id,
        account_id: uid,
        memberName: name,
        occurred_at: c.occurred_at,
        duration: c.duration ?? null,
        title: c.title ?? null,
        points: c.points ?? null,
        check_in_activities: c.check_in_activities ?? [],
      });

      if (opts.useVideoDynamic) {
        for (const media of c.check_in_media ?? []) {
          const t = media.medium_type ?? "";
          const url = media.url ?? "";
          if (t.includes("video") || url.toLowerCase().endsWith(".mp4")) {
            let vids = videosByUser.get(uid);
            if (!vids) {
              vids = [];
              videosByUser.set(uid, vids);
            }
            if (!vids.includes(url)) vids.push(url);
          }
        }
      }

      const hour = dt.getUTCHours();
      let period: string;
      if (hour >= 5 && hour < 12) period = "Manhã";
      else if (hour >= 12 && hour < 18) period = "Tarde";
      else if (hour >= 18 && hour < 23) period = "Noite";
      else period = "Madrugada";
      schedules.set(period, (schedules.get(period) ?? 0) + 1);
    } catch {
      // skip
    }
  }

  // Cálculo de dias corridos para projeção (respeitando janela dayFrom/dayTo)
  const today = new Date();
  const totalDaysInMonth = new Date(opts.year, opts.month, 0).getDate();
  const dayFrom = Math.max(1, Math.min(opts.dayFrom ?? 1, totalDaysInMonth));
  const dayTo = Math.max(dayFrom, Math.min(opts.dayTo ?? totalDaysInMonth, totalDaysInMonth));
  const daysInMonth = dayTo - dayFrom + 1; // tamanho da janela
  let daysElapsed: number;
  let monthCompleted: boolean;
  if (today.getFullYear() === opts.year && today.getMonth() + 1 === opts.month) {
    const todayDom = today.getDate();
    if (todayDom < dayFrom) { daysElapsed = 0; monthCompleted = false; }
    else if (todayDom >= dayTo) { daysElapsed = daysInMonth; monthCompleted = true; }
    else { daysElapsed = todayDom - dayFrom + 1; monthCompleted = false; }
  } else if (today.getFullYear() > opts.year || (today.getFullYear() === opts.year && today.getMonth() + 1 > opts.month)) {
    daysElapsed = daysInMonth;
    monthCompleted = true;
  } else {
    daysElapsed = daysInMonth;
    monthCompleted = false;
  }
  if (daysElapsed < 1) daysElapsed = 1;

  const historicalAvg = (uid: number): number | null => {
    const hMap = historicalByMonth.get(uid);
    if (!hMap) return null;
    const months = [...hMap.entries()].filter(([k]) => k !== targetKey);
    if (months.length === 0) return null;
    const total = months.reduce((s, [, set]) => s + set.size, 0);
    return Math.round((total / months.length) * 10) / 10;
  };

  // Active list
  const actives: ActiveParticipant[] = [];
  const inactives: InactiveRow[] = [];

  for (const [uid, name] of idToName.entries()) {
    if (isExcluded(name)) continue;
    const days = daysActive.get(uid)?.size ?? 0;

    if (days === 0) {
      const total = historicalTotal.get(uid) ?? 0;
      if (total > 0) {
        const last = lastCheckIn.get(uid) ?? null;
        const monthsActive = historicalByMonth.get(uid)?.size ?? 0;
        const priority: InactiveRow["priority"] = total >= 50 ? "Alta" : total >= 20 ? "Média" : "Baixa";
        inactives.push({ id: uid, name, total, monthsActive, lastCheckIn: last, priority });
      }
      continue;
    }

    const pts = Math.round((points.get(uid) ?? 0) * 10) / 10;
    const vids = videosByUser.get(uid) ?? [];
    const mh = historicalAvg(uid);
    const projection = Math.round((days / daysElapsed) * daysInMonth * 10) / 10;
    const variation = mh && mh > 0 ? Math.round(((projection - mh) / mh) * 1000) / 10 : null;

    actives.push({
      id: uid,
      name,
      days,
      checkins: checkinsCount.get(uid) ?? 0,
      points: pts,
      activeReal: days >= opts.minActiveDays,
      reachedGoal: days >= opts.goalDays,
      hasVideo: vids.length > 0,
      videos: vids,
      historicalAvg: mh,
      projection,
      variationPct: variation,
    });
  }

  const rankingDays = [...actives].sort((a, b) => b.days - a.days || b.points - a.points);
  const rankingPoints = [...actives].sort((a, b) => b.points - a.points);
  const historicalCompare = actives
    .filter((a) => a.historicalAvg !== null && a.variationPct !== null)
    .sort((a, b) => (b.variationPct ?? 0) - (a.variationPct ?? 0));

  const inactivesSorted = [...inactives].sort((a, b) => b.total - a.total);
  const videosTab = [...rankingDays];

  // Métricas
  const totalActiveReal = actives.filter((a) => a.activeReal).length;
  const totalCheckIns = [...checkinsCount.values()].reduce((s, v) => s + v, 0);
  const totalGoal = actives.filter((a) => a.reachedGoal).length;
  const totalVideo = actives.filter((a) => a.hasVideo).length;
  const pctGoal = totalActiveReal ? Math.round((totalGoal / totalActiveReal) * 1000) / 10 : 0;
  const avgCi = totalActiveReal ? Math.round((totalCheckIns / totalActiveReal) * 10) / 10 : 0;

  // Modalidades
  const totalMod = [...modalities.values()].reduce((s, v) => s + v, 0);
  const modList = [...modalities.entries()]
    .map(([name, count]) => ({
      name: humanizeActivity(name),
      count,
      pct: totalMod ? Math.round((count / totalMod) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Modalidades por usuário
  const modalitiesByUser: ParticipantModality[] = [];
  for (const [uid, name] of idToName.entries()) {
    if (isExcluded(name)) continue;
    const uModMap = userModalities.get(uid);
    const uSportMap = userSports.get(uid);
    if ((uModMap && uModMap.size > 0) || (uSportMap && uSportMap.size > 0)) {
      const modalityArr = [...(uModMap ?? new Map<string, number>()).entries()]
        .map(([modName, count]) => ({
          name: humanizeActivity(modName),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const sportsArr = [...(uSportMap ?? new Map<string, number>()).entries()]
        .filter(([sportName]) => sportName !== "Outros")
        .map(([sportName, count]) => ({
          name: sportName,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      modalitiesByUser.push({
        id: uid,
        name,
        modalityCount: modalityArr.length,
        modalities: modalityArr,
        sportCount: sportsArr.length,
        sports: sportsArr,
      });
    }
  }
  modalitiesByUser.sort((a, b) => b.sportCount - a.sportCount || b.modalityCount - a.modalityCount || a.name.localeCompare(b.name, "pt-BR"));

  const totalSched = [...schedules.values()].reduce((s, v) => s + v, 0);
  const schedList = ["Manhã", "Tarde", "Noite", "Madrugada"]
    .filter((p) => schedules.has(p))
    .map((p) => ({
      name: p,
      count: schedules.get(p) ?? 0,
      pct: totalSched ? Math.round(((schedules.get(p) ?? 0) / totalSched) * 1000) / 10 : 0,
    }));

  // Evolução: TODOS os meses presentes no JSON, ordenados crescente
  const allMonthKeys = new Set<string>();
  for (const hMap of historicalByMonth.values()) {
    for (const k of hMap.keys()) allMonthKeys.add(k);
  }
  const evolutionMonths = [...allMonthKeys].sort().map((key) => {
    const [yy, mm] = key.split("-").map(Number);
    return { key, label: `${String(mm).padStart(2, "0")}/${yy}`, m: mm, y: yy };
  });

  // Todos os usuários com pelo menos 1 check-in no histórico, ordenados por total desc
  const allUserIds = [...historicalTotal.entries()]
    .filter(([uid]) => {
      const n = idToName.get(uid);
      return n && !isExcluded(n);
    })
    .sort((a, b) => b[1] - a[1])
    .map(([uid]) => uid);

  // Top 5 por TOTAL histórico de check-ins
  const topUserIds = allUserIds.slice(0, 5);
  const topUsers = topUserIds.map((uid) => idToName.get(uid)!);

  // Resolver colisões de short name (mantém ordem por total desc)
  const shortNameByUid = new Map<number, string>();
  const usedShort = new Map<string, number>();
  for (const uid of allUserIds) {
    const full = idToName.get(uid)!;
    let sn = shortName(full);
    const count = (usedShort.get(sn) ?? 0) + 1;
    usedShort.set(sn, count);
    if (count > 1) sn = `${sn} (${count})`;
    shortNameByUid.set(uid, sn);
  }

  const evolution: EvolutionPoint[] = evolutionMonths.map((mo) => {
    const byUser: Record<string, { days: number; points: number }> = {};
    for (const uid of allUserIds) {
      const sn = shortNameByUid.get(uid)!;
      const set = historicalByMonth.get(uid)?.get(mo.key);
      byUser[sn] = { days: set?.size ?? 0, points: 0 };
    }
    return { monthLabel: mo.label, monthKey: mo.key, byUser };
  });

  return {
    options: opts,
    monthLabel: `${MONTH_FULL_PT[opts.month - 1]} / ${opts.year}`,
    generatedAt: new Date().toISOString(),
    summary: {
      active: actives.length,
      activeReal: totalActiveReal,
      inactive: inactives.length,
      totalCheckIns,
      avgPerActive: avgCi,
      goalReached: totalGoal,
      goalReachedPct: pctGoal,
      videosSubmitted: totalVideo,
      daysElapsed,
      daysInMonth,
      monthCompleted,
    },
    rankingDays,
    rankingPoints,
    historicalCompare,
    inactives: inactivesSorted,
    videos: videosTab,
    modalities: modList,
    modalitiesByUser,
    schedules: schedList,
    evolution,
    evolutionUsers: topUserIds.map((uid) => shortNameByUid.get(uid)!),
    evolutionAllUsers: allUserIds.map((uid) => shortNameByUid.get(uid)!),
    monthPhotos,
    targetMonthCheckIns,
    allParticipants: (() => {
      const byId = new Map(actives.map((a) => [a.id, a]));
      const all: ActiveParticipant[] = [];
      for (const [uid, name] of idToName.entries()) {
        if (isExcluded(name)) continue;
        const existing = byId.get(uid);
        if (existing) {
          all.push(existing);
        } else {
          all.push({
            id: uid,
            name,
            days: 0,
            checkins: 0,
            points: 0,
            activeReal: false,
            reachedGoal: false,
            hasVideo: false,
            videos: [],
            historicalAvg: historicalAvg(uid),
            projection: 0,
            variationPct: null,
          });
        }
      }
      return all.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    })(),
  };
}

export type AvailableMonth = { key: string; month: number; year: number; label: string };

export function extractAvailableMonths(raw: RawData): AvailableMonth[] {
  const set = new Set<string>();
  for (const c of raw?.check_ins ?? []) {
    const d = new Date(c.occurred_at);
    const local = new Date(d.getTime() - 3 * 3600 * 1000);
    const y = local.getUTCFullYear();
    const m = local.getUTCMonth() + 1;
    set.add(`${y}-${String(m).padStart(2, "0")}`);
  }
  return [...set]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((k) => {
      const [y, m] = k.split("-").map(Number);
      return { key: k, year: y, month: m, label: `${MONTH_FULL_PT[m - 1]} / ${y}` };
    });
}

export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 2) return full;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

const ACTIVITY_PT: Record<string, string> = {
  strength_training: "Musculação",
  running: "Corrida",
  cycling: "Ciclismo",
  walking: "Caminhada",
  swimming: "Natação",
  functional_training: "Funcional",
  hiit: "HIIT",
  yoga: "Yoga",
  pilates: "Pilates",
  soccer: "Futebol",
  basketball: "Basquete",
  volleyball: "Vôlei",
  tennis: "Tênis",
  martial_arts: "Lutas",
  crossfit: "CrossFit",
  rowing: "Remo",
  dance: "Dança",
  hiking: "Trilha",
  outros: "Outros",
};

// Mapeamento de platform_activity -> esporte agrupado
// Atividades relacionadas são agrupadas em um único esporte
const SPORT_GROUP: Record<string, string> = {
  // Musculação / Força
  strength_training: "Musculação",
  weight_lifting: "Musculação",
  calisthenics: "Musculação",
  // Corrida
  running: "Corrida",
  treadmill: "Corrida",
  // Caminhada
  walking: "Caminhada",
  hiking: "Trilha",
  // Ciclismo
  cycling: "Ciclismo",
  spinning: "Ciclismo",
  stationary_bike: "Ciclismo",
  // Cardio (máquinas)
  cardio_machine: "Cardio",
  elliptical: "Cardio",
  stair_climber: "Cardio",
  stairs: "Cardio",
  mixed_cardio: "Cardio",
  aerobics: "Cardio",
  // Funcional / Cross
  functional_training: "Funcional",
  cross_training: "Funcional",
  crossfit: "CrossFit",
  hiit: "HIIT",
  // Futebol
  soccer: "Futebol",
  // Basquete
  basketball: "Basquete",
  // Vôlei
  volleyball: "Vôlei",
  beach_volleyball: "Vôlei",
  // Tênis / Beach Tennis
  tennis: "Tênis",
  beach_tennis: "Tênis",
  table_tennis: "Tênis",
  // Lutas / Artes Marciais
  martial_arts: "Lutas",
  bjj: "Lutas",
  wrestling: "Lutas",
  // Dança
  dance: "Dança",
  // Natação
  swimming: "Natação",
  // Patinação
  skating: "Patinação",
  // Mente e Corpo
  pilates: "Pilates",
  mind_and_body: "Pilates",
  yoga: "Yoga",
  // Esportes em equipe (genérico)
  team_sport: "Esporte em Equipe",
  rec_sport: "Esporte em Equipe",
  // Gaming
  fitness_gaming: "Gamificação",
  // Outros
  other: "Outros",
  outros: "Outros",
};

export function groupSport(platformActivity: string): string {
  const key = platformActivity || "outros";
  return SPORT_GROUP[key] ?? humanizeActivity(key);
}

export function countUniqueSports(activities: string[]): number {
  const sports = new Set(activities.map((a) => groupSport(a)));
  sports.delete("Outros");
  return sports.size;
}

function humanizeActivity(key: string): string {
  if (ACTIVITY_PT[key]) return ACTIVITY_PT[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
