import { ProcessedDashboard, RawData, ProcessOptions } from "./gmove-processor";

const KEY = "gmove_admin_dashboard_v1";
const RAW_KEY = "gmove_admin_raw_v1";
const OPTS_KEY = "gmove_admin_opts_v1";

export function saveDashboard(d: ProcessedDashboard) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch (e) {
    console.error("Falha ao salvar no localStorage", e);
  }
}

export function loadDashboard(): ProcessedDashboard | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProcessedDashboard;
    // Validate schema — discard caches from older versions missing fields
    if (
      !parsed?.summary ||
      !Array.isArray(parsed?.rankingDays) ||
      !Array.isArray(parsed?.rankingPoints) ||
      !Array.isArray(parsed?.historicalCompare) ||
      !Array.isArray(parsed?.inactives) ||
      !Array.isArray(parsed?.videos) ||
      !Array.isArray(parsed?.modalities) ||
      !Array.isArray(parsed?.schedules) ||
      !Array.isArray(parsed?.evolution) ||
      !Array.isArray(parsed?.evolutionUsers) ||
      !Array.isArray(parsed?.evolutionAllUsers) ||
      !Array.isArray(parsed?.allParticipants)
    ) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDashboard() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(RAW_KEY);
  localStorage.removeItem(OPTS_KEY);
}

export function saveRaw(raw: RawData): boolean {
  try {
    localStorage.setItem(RAW_KEY, JSON.stringify(raw));
    window.dispatchEvent(new CustomEvent("gmove:raw-updated"));
    return true;
  } catch (e) {
    console.warn("JSON bruto não cacheado (localStorage cheio).", e);
    return false;
  }
}

export function loadRaw(): RawData | null {
  try {
    const r = localStorage.getItem(RAW_KEY);
    if (!r) return null;
    return JSON.parse(r) as RawData;
  } catch {
    return null;
  }
}

export function saveOpts(o: ProcessOptions) {
  try { localStorage.setItem(OPTS_KEY, JSON.stringify(o)); } catch {}
}

export function loadOpts(): ProcessOptions | null {
  try {
    const r = localStorage.getItem(OPTS_KEY);
    if (!r) return null;
    return JSON.parse(r) as ProcessOptions;
  } catch { return null; }
}
