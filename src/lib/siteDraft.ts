import type { SiteData } from '../types/site';

const DRAFT_KEY = 'codefolio:site:draft:v1';

export function loadDraftSite(): SiteData | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as SiteData;
  } catch {
    return null;
  }
}

export function saveDraftSite(site: SiteData): void {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(site, null, 2));
}

export function clearDraftSite(): void {
  window.localStorage.removeItem(DRAFT_KEY);
}

