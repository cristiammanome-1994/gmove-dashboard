// src/lib/validation-config.ts

export interface ValidationConfig {
  minDurationMinutes: number;
  minDistanceKm: number;
  outlierMultiplier: number;
  maxDurationHours: number;
  maxDistanceKm: number;
  minCalories: number;
  gapDays: number;
}

export const DEFAULT_CONFIG: ValidationConfig = {
  minDurationMinutes: 30,
  minDistanceKm: 2,
  outlierMultiplier: 1.5,
  maxDurationHours: 3,
  maxDistanceKm: 50,
  minCalories: 50,
  gapDays: 7,
};

export function loadValidationConfig(): ValidationConfig {
  try {
    const saved = localStorage.getItem('gmove_validation_config');
    if (!saved) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch (error) {
    console.warn('Erro ao carregar config de validação:', error);
    return DEFAULT_CONFIG;
  }
}

export function saveValidationConfig(config: ValidationConfig) {
  try {
    localStorage.setItem('gmove_validation_config', JSON.stringify(config));
  } catch (error) {
    console.warn('Erro ao salvar config de validação:', error);
  }
}
