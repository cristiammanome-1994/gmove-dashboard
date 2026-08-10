// Armazenamento das equipes (dinâmicas) e atribuições dos participantes.
// As equipes podem ser adicionadas, renomeadas e removidas.
// Suporta carregar equipes a partir do parâmetro ?teams=... na URL.

import { getTeamsFromURL, generateShareURL } from "./url-teams-codec";


export type TeamColor =
  | "blue" | "green" | "orange" | "purple"
  | "pink" | "amber" | "cyan" | "rose" | "teal" | "indigo";

export type Team = { id: string; name: string; color: TeamColor };
export type Assignments = Record<string, string>; // participantId -> teamId

const KEY_TEAMS = "gmove_teams_v2";
const KEY_ASSIGN = "gmove_team_assignments_v2";
const LEGACY_ASSIGN = "gmove_team_assignments";

export const TEAM_COLORS: TeamColor[] = [
  "blue", "green", "orange", "purple", "pink", "amber", "cyan", "rose", "teal", "indigo",
];

export const DEFAULT_TEAMS: Team[] = [
  { id: "A", name: "Equipe A", color: "blue" },
  { id: "B", name: "Equipe B", color: "green" },
  { id: "C", name: "Equipe C", color: "orange" },
  { id: "D", name: "Equipe D", color: "purple" },
];

// Tailwind precisa ver as classes literalmente — declaração estática por cor.
export const COLOR_CLASSES: Record<TeamColor, {
  chip: string; border: string; bg: string; text: string; bar: string; ring: string;
}> = {
  blue:   { chip: "bg-blue-600 text-white",   border: "border-blue-300",   bg: "bg-blue-50/60",   text: "text-blue-700",   bar: "bg-blue-500",   ring: "ring-blue-400" },
  green:  { chip: "bg-green-600 text-white",  border: "border-green-300",  bg: "bg-green-50/60",  text: "text-green-700",  bar: "bg-green-500",  ring: "ring-green-400" },
  orange: { chip: "bg-orange-600 text-white", border: "border-orange-300", bg: "bg-orange-50/60", text: "text-orange-700", bar: "bg-orange-500", ring: "ring-orange-400" },
  purple: { chip: "bg-purple-600 text-white", border: "border-purple-300", bg: "bg-purple-50/60", text: "text-purple-700", bar: "bg-purple-500", ring: "ring-purple-400" },
  pink:   { chip: "bg-pink-600 text-white",   border: "border-pink-300",   bg: "bg-pink-50/60",   text: "text-pink-700",   bar: "bg-pink-500",   ring: "ring-pink-400" },
  amber:  { chip: "bg-amber-600 text-white",  border: "border-amber-300",  bg: "bg-amber-50/60",  text: "text-amber-700",  bar: "bg-amber-500",  ring: "ring-amber-400" },
  cyan:   { chip: "bg-cyan-600 text-white",   border: "border-cyan-300",   bg: "bg-cyan-50/60",   text: "text-cyan-700",   bar: "bg-cyan-500",   ring: "ring-cyan-400" },
  rose:   { chip: "bg-rose-600 text-white",   border: "border-rose-300",   bg: "bg-rose-50/60",   text: "text-rose-700",   bar: "bg-rose-500",   ring: "ring-rose-400" },
  teal:   { chip: "bg-teal-600 text-white",   border: "border-teal-300",   bg: "bg-teal-50/60",   text: "text-teal-700",   bar: "bg-teal-500",   ring: "ring-teal-400" },
  indigo: { chip: "bg-indigo-600 text-white", border: "border-indigo-300", bg: "bg-indigo-50/60", text: "text-indigo-700", bar: "bg-indigo-500", ring: "ring-indigo-400" },
};

export const TEAMS_EVENT = "gmove:teams-updated";

function emit() {
  try { window.dispatchEvent(new CustomEvent(TEAMS_EVENT)); } catch {}
}

export function loadTeams(): Team[] {
  try {
    const urlData = getTeamsFromURL();
    if (urlData?.teams && urlData.teams.length > 0) {
      try { localStorage.setItem(KEY_TEAMS, JSON.stringify(urlData.teams)); } catch {}
      return urlData.teams;
    }
    const raw = localStorage.getItem(KEY_TEAMS);
    if (!raw) return [...DEFAULT_TEAMS];
    const parsed = JSON.parse(raw) as Team[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_TEAMS];
    return parsed;
  } catch {
    return [...DEFAULT_TEAMS];
  }
}


export function saveTeams(teams: Team[]) {
  try {
    localStorage.setItem(KEY_TEAMS, JSON.stringify(teams));
    emit();
  } catch (e) {
    console.warn("Falha ao salvar equipes", e);
  }
}

export function loadAssignments(): Assignments {
  try {
    const urlData = getTeamsFromURL();
    if (urlData?.assignments) {
      try { localStorage.setItem(KEY_ASSIGN, JSON.stringify(urlData.assignments)); } catch {}
      return urlData.assignments;
    }
    const raw = localStorage.getItem(KEY_ASSIGN);
    if (raw) return JSON.parse(raw) as Assignments;
    // migração do formato legado (A|B|C|D coincide com IDs default)
    const legacy = localStorage.getItem(LEGACY_ASSIGN);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Assignments;
      localStorage.setItem(KEY_ASSIGN, JSON.stringify(parsed));
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}


export function saveAssignments(a: Assignments) {
  try {
    localStorage.setItem(KEY_ASSIGN, JSON.stringify(a));
    emit();
  } catch (e) {
    console.warn("Falha ao salvar atribuições", e);
  }
}

export function nextTeamColor(existing: Team[]): TeamColor {
  const used = new Set(existing.map((t) => t.color));
  return TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[existing.length % TEAM_COLORS.length];
}

export function generateTeamId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateShareableURL(): string {
  const teams = loadTeams();
  const assignments = loadAssignments();
  return generateShareURL({ teams, assignments });
}

