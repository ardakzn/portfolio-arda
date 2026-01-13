import type { ProjectWithDetails } from '../types/portfolio';

const DRAFT_KEY = 'codefolio:projects:draft:v1';

export function loadDraftProjects(): ProjectWithDetails[] | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProjectWithDetails[]) : null;
  } catch {
    return null;
  }
}

export function saveDraftProjects(projects: ProjectWithDetails[]): void {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(projects, null, 2));
}

export function clearDraftProjects(): void {
  window.localStorage.removeItem(DRAFT_KEY);
}

