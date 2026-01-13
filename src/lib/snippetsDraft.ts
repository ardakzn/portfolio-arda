import type { CodeSnippetWithAnnotations } from './snippets';

const DRAFT_KEY = 'codefolio:snippets:draft:v1';

export function loadDraftSnippets(): CodeSnippetWithAnnotations[] | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CodeSnippetWithAnnotations[]) : null;
  } catch {
    return null;
  }
}

export function saveDraftSnippets(list: CodeSnippetWithAnnotations[]): void {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(list, null, 2));
}

export function clearDraftSnippets(): void {
  window.localStorage.removeItem(DRAFT_KEY);
}

