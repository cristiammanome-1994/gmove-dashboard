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
  shortDurationCheckIns: { id: number; participant: string; date: string; duration: number; title: string | null }[];
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

  // 3. Detectar check-ins individuais com < 15 min
  const shortDurationCheckIns = detectShortDurationCheckIns(data, 15);

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
): { id: number; participant: string; date: string; duration: number; title: string | null }[] {
  if (!data.targetMonthCheckIns) return [];
  return data.targetMonthCheckIns
    .filter(ci => ci.duration !== null && ci.duration < threshold)
    .map(ci => ({
      id: ci.id,
      participant: ci.memberName,
      date: new Date(ci.occurred_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      duration: ci.duration!,
      title: ci.title,
    }))
    .sort((a, b) => a.duration - b.duration);
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

    // Outlier muito baixo
    if (p.points < config.minCalories && p.points > 0) {
      result.push({
        id: `outlier_low_${p.id}`,
        participant: p.name,
        date: 'Vários',
        reason: ['outlier_low'],
        severity: 'low' as const,
        value: { calories: p.points },
        suggestion: `Pontos ${p.points} < mínimo ${config.minCalories}. Pode ser erro de entrada.`,
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
