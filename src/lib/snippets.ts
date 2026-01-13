import type { CodeAnnotation, CodeSnippet } from '../types/portfolio';
import { withBaseUrl } from './paths';

export type CodeSnippetWithAnnotations = CodeSnippet & { annotations?: CodeAnnotation[] };

function titleForSort(s: CodeSnippetWithAnnotations): string {
  const raw = s.title as unknown;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const preferred = (obj.en || obj.tr) as unknown;
    if (typeof preferred === 'string' && preferred.trim()) return preferred;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return '';
}

function sortSnippets(list: CodeSnippetWithAnnotations[]): CodeSnippetWithAnnotations[] {
  return [...list].sort((a, b) => {
    const ao = Number.isFinite(a.order_index) ? a.order_index : 0;
    const bo = Number.isFinite(b.order_index) ? b.order_index : 0;
    if (ao !== bo) return ao - bo;
    return (a.created_at || '').localeCompare(b.created_at || '') || titleForSort(a).localeCompare(titleForSort(b));
  });
}

export async function loadSnippetsFromFile(): Promise<CodeSnippetWithAnnotations[]> {
  const res = await fetch(withBaseUrl('/data/snippets.json'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load snippets.json');
  const data: unknown = await res.json();
  const list = Array.isArray(data) ? (data as CodeSnippetWithAnnotations[]) : [];
  return sortSnippets(list);
}
