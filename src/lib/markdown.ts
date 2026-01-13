export type MarkdownHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

export function normalizeMarkdownText(input: string): string {
  return (
    (input || '')
      // Handle literal backslash escapes coming from user-provided JSON like "\\n"
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n')
      // Normalize real CRLF to LF
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
  );
}

export function slugifyHeading(input: string): string {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractMarkdownHeadings(markdown: string, headingIdPrefix: string): MarkdownHeading[] {
  const lines = normalizeMarkdownText(markdown).split('\n');
  const counts = new Map<string, number>();
  const items: MarkdownHeading[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const h = line.match(/^(##|###)(!)?\s+(.+)$/);
    if (!h) continue;
    const level = h[1] === '##' ? 2 : 3;
    const hidden = !!h[2];
    const label = (h[3] || '').trim();
    if (!label) continue;
    if (hidden) continue; // "##!" -> don't show in TOC

    const base = `${headingIdPrefix}${slugifyHeading(label) || 'section'}`;
    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    items.push({ id, label, level });
  }

  return items;
}

