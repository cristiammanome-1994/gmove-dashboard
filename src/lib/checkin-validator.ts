// src/lib/checkin-validator.ts

import { ProcessedDashboard } from './gmove-processor';
import { ValidationConfig, loadValidationConfig } from './validation-config';

export interface SuspiciousCheckIn {
  id: string;
  participant: string;
  date: string;
  reason: string[];
  severity: 'low' | 'medium' | 'high';
  value: {
    duration?: number;
    distance?: number;
    calories?: number;
  };
  suggestion: string;
}

export interface ValidationResult {
  total: number;
  valid: number;
  suspicious: SuspiciousCheckIn[];
  byReason: Record<string, number>;
  bySeverity: Record<'low' | 'medium' | 'high', number>;
  shortDurationCheckIns: {
    id: number;
    participant: string;
    date: string;
    duration: number;
    dailyTotalDuration: number;
    title: string | null;
    distanceKm: number | null;
    activities: string[];
    isDailyTotal: boolean;
  }[];
}

export function validateCheckIns(data: ProcessedDashboard | null): ValidationResult {
  if (!data) {
    return {
      total: 0,
      valid: 0,
      suspicious: [],
      byReason: {},
      bySeverity: { low: 0, medium: 0, high: 0 },
      shortDurationCheckIns: [],
    };
  }

  const config = loadValidationConfig();
  const suspicious: SuspiciousCheckIn[] = [];

  // 1. Detectar duração curta (por participante)
  suspicious.push(...detectShortDuration(data, config));

  // 2. Detectar outliers de calorias
  suspicious.push(...detectOutliers(data, config));

  // 3. Detectar check-ins individuais com < 30 min (exceção: corrida/caminhada >= 2km)
  const shortDurationCheckIns = detectShortDurationCheckIns(data, 30);

  // 4. Contar por razão
  const byReason: Record<string, number> = {};
  suspicious.forEach(s => {
    s.reason.forEach(r => {
      byReason[r] = (byReason[r] || 0) + 1;
    });
  });

  // 5. Remover duplicatas
  const uniqueSuspicious = removeDuplicates(suspicious);

  return {
    total: data.rankingDays?.length ?? 0,
    valid: (data.rankingDays?.length ?? 0) - uniqueSuspicious.length,
    suspicious: uniqueSuspicious,
    byReason,
    bySeverity: countBySeverity(uniqueSuspicious),
    shortDurationCheckIns,
  };
}

function detectShortDurationCheckIns(
  data: ProcessedDashboard,
  threshold: number
): {
  id: number;
  participant: string;
  date: string;
  duration: number;
  dailyTotalDuration: number;
  title: string | null;
  distanceKm: number | null;
  activities: string[];
  isDailyTotal: boolean;
}[] {
  if (!data.targetMonthCheckIns || data.targetMonthCheckIns.length === 0) return [];

  // 1. Group check-ins by participant + date
  const dayKey = (ci: { occurred_at: string }) => {
    const d = new Date(ci.occurred_at);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  type DayGroup = {
    key: string;
    participant: string;
    checkIns: typeof data.targetMonthCheckIns;
    totalDuration: number;
    totalDistanceKm: number | null;
    checkHasException: boolean;
  };

  const dayGroups = new Map<string, DayGroup>();

  for (const ci of data.targetMonthCheckIns) {
    if (ci.duration === null) continue;

    const key = `${ci.account_id}_${dayKey(ci)}`;
    let group = dayGroups.get(key);
    if (!group) {
      group = {
        key,
        participant: ci.memberName,
        checkIns: [],
        totalDuration: 0,
        totalDistanceKm: null,
        checkHasException: false,
      };
      dayGroups.set(key, group);
    }
    group.checkIns.push(ci);
    group.totalDuration += ci.duration;

    // Sum distance
    let distKm: number | null = null;
    if (ci.distance_miles) {
      const miles = parseFloat(ci.distance_miles.replace(',', '.'));
      distKm = miles * 1.60934;
    } else if (ci.check_in_activities) {
      for (const activity of ci.check_in_activities) {
        const act = activity as { distance_miles?: string | null };
        if (act.distance_miles) {
          const miles = parseFloat(act.distance_miles.replace(',', '.'));
          distKm = miles * 1.60934;
          break;
        }
      }
    }
    if (distKm !== null) {
      group.totalDistanceKm = (group.totalDistanceKm ?? 0) + distKm;
    }

    // Check if individual check-in qualifies for running/walking ≥ 2km exception
    if (!group.checkHasException) {
      const activities = ci.check_in_activities
        ?.map((a: { platform_activity?: string | null }) => a.platform_activity)
        .filter((a: string | null | undefined) => a != null) ?? [];
      const isRunningOrWalking = activities.some((a: string) =>
        a === 'running' || a === 'walking' || a === 'treadmill'
      );
      if (isRunningOrWalking && distKm !== null && distKm >= 2) {
        group.checkHasException = true;
      }
    }
  }

  // 2. Find days with total duration < threshold and no exception
  const flaggedDayKeys = new Set<string>();
  for (const group of dayGroups.values()) {
    if (group.totalDuration < threshold && !group.checkHasException) {
      flaggedDayKeys.add(group.key);
    }
  }

  // 3. Return all check-ins from flagged days
  const result: {
    id: number;
    participant: string;
    date: string;
    duration: number;
    dailyTotalDuration: number;
    title: string | null;
    distanceKm: number | null;
    activities: string[];
    isDailyTotal: boolean;
  }[] = [];

  for (const [key, group] of dayGroups) {
    if (!flaggedDayKeys.has(key)) continue;

    for (const ci of group.checkIns) {
      let distanceKm: number | null = null;
      if (ci.distance_miles) {
        const miles = parseFloat(ci.distance_miles.replace(',', '.'));
        distanceKm = miles * 1.60934;
      } else if (ci.check_in_activities) {
        for (const activity of ci.check_in_activities) {
          const act = activity as { distance_miles?: string | null };
          if (act.distance_miles) {
            const miles = parseFloat(act.distance_miles.replace(',', '.'));
            distanceKm = miles * 1.60934;
            break;
          }
        }
      }

      const activities = ci.check_in_activities
        ?.map((a: { platform_activity?: string | null }) => a.platform_activity)
        .filter((a: string | null | undefined) => a != null) ?? [];

      result.push({
        id: ci.id,
        participant: ci.memberName,
        date: new Date(ci.occurred_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
        duration: ci.duration!,
        dailyTotalDuration: group.totalDuration,
        title: ci.title,
        distanceKm,
        activities,
        isDailyTotal: group.checkIns.length > 1,
      });
    }
  }

  // Sort by daily total duration (ascending), then by individual duration
  return result.sort((a, b) =>
    a.dailyTotalDuration - b.dailyTotalDuration || a.duration - b.duration
  );
}

function detectShortDuration(
  data: ProcessedDashboard,
  config: ValidationConfig
): SuspiciousCheckIn[] {
  if (!data.rankingDays) return [];

  return data.rankingDays
    .filter(p => {
      const minutes = p.days * 24 * 60;
      return minutes < config.minDurationMinutes && minutes > 0;
    })
    .map(p => ({
      id: `short_dur_${p.id}`,
      participant: p.name,
      date: 'Vários dias',
      reason: ['short_duration'],
      severity: 'high' as const,
      value: { duration: Math.round(p.days * 24 * 60) },
      suggestion: `Duração ${Math.round(
        p.days * 24 * 60
      )}min < mínimo ${config.minDurationMinutes}min. Pode ser insuficiente.`,
    }));
}

function detectOutliers(
  data: ProcessedDashboard,
  config: ValidationConfig
): SuspiciousCheckIn[] {
  if (!data.rankingPoints || data.rankingPoints.length === 0) return [];

  const result: SuspiciousCheckIn[] = [];
  const calories = data.rankingPoints
    .map(p => p.points)
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (calories.length < 4) return [];

  // Calcular quartis
  const q1 = calories[Math.floor(calories.length * 0.25)];
  const q3 = calories[Math.floor(calories.length * 0.75)];
  const iqr = q3 - q1;
  const upper = q3 + config.outlierMultiplier * iqr;

  data.rankingPoints.forEach(p => {
    // Outlier muito alto
    if (p.points > upper) {
      result.push({
        id: `outlier_high_${p.id}`,
        participant: p.name,
        date: 'Vários',
        reason: ['outlier_high'],
        severity: 'medium' as const,
        value: { calories: p.points },
        suggestion: `Pontos ${p.points} > limite ${Math.round(upper)}. Verificar validade dos check-ins.`,
      });
    }
  });

  return result;
}

function removeDuplicates(items: SuspiciousCheckIn[]): SuspiciousCheckIn[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.participant + item.reason.sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countBySeverity(items: SuspiciousCheckIn[]) {
  return {
    low: items.filter(i => i.severity === 'low').length,
    medium: items.filter(i => i.severity === 'medium').length,
    high: items.filter(i => i.severity === 'high').length,
  };
}
