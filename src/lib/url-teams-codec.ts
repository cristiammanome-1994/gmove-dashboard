import type { Team, Assignments } from "./teams-storage";

export interface TeamsData {
  teams: Team[];
  assignments: Assignments;
}

export function encodeTeamsToURL(data: TeamsData): string {
  try {
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    console.error("Erro ao encodar equipes:", e);
    return "";
  }
}

export function decodeTeamsFromURL(encoded: string): TeamsData | null {
  try {
    if (!encoded) return null;
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json) as TeamsData;
    if (!Array.isArray(data?.teams) || typeof data?.assignments !== "object" || data.assignments === null) {
      return null;
    }
    return data;
  } catch (e) {
    console.error("Erro ao decodar equipes:", e);
    return null;
  }
}

export function getTeamsFromURL(): TeamsData | null {
  try {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("teams");
    if (!encoded) return null;
    return decodeTeamsFromURL(encoded);
  } catch (e) {
    console.error("Erro ao ler URL:", e);
    return null;
  }
}

export function hasTeamsInURL(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("teams");
  } catch {
    return false;
  }
}

export function generateShareURL(data: TeamsData): string {
  const encoded = encodeTeamsToURL(data);
  if (!encoded) return "";
  const base = window.location.origin + window.location.pathname;
  return `${base}?teams=${encoded}`;
}

export function clearURLTeams() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("teams");
    window.history.replaceState({}, document.title, url.toString());
  } catch (e) {
    console.error("Erro ao limpar URL:", e);
  }
}
