export type ProjectMediaKind = 'image' | 'video' | 'youtube';

export interface ProjectMediaItem {
  kind: ProjectMediaKind;
  src: string;
  alt: string;
  thumbnail?: string;
}

export interface ProjectTextSection {
  title: string;
  content: string;
  kind: 'problem' | 'solution' | 'section';
}

export interface ParsedProjectDetailContent {
  overview: string;
  sections: ProjectTextSection[];
  media: ProjectMediaItem[];
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.trim());
}

function youtubeEmbed(input: string): { src: string; thumbnail?: string } | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    let id = '';

    if (host === 'youtu.be') {
      id = url.pathname.replace(/^\//, '');
    } else if (host === 'youtube.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
      else id = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || '';
    }

    if (!id) return null;
    const safeId = encodeURIComponent(id);
    return {
      src: `https://www.youtube.com/embed/${safeId}`,
      thumbnail: `https://i.ytimg.com/vi/${safeId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

function normalizedTitle(title: string): string {
  return title
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function sectionKind(title: string): ProjectTextSection['kind'] {
  const normalized = normalizedTitle(title);
  if (normalized.includes('problem')) return 'problem';
  if (
    normalized.includes('cozum') ||
    normalized.includes('solution') ||
    normalized.includes('approach')
  ) {
    return 'solution';
  }
  return 'section';
}

function compactMarkdown(lines: string[]): string {
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function parseProjectDetailContent(
  markdown: string,
): ParsedProjectDetailContent {
  const media: ProjectMediaItem[] = [];
  const contentLines: string[] = [];

  for (const rawLine of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim();
    const image = line.match(/^!\[([^\]]*)]\(([^)]+)\)\s*$/);
    if (image) {
      const src = image[2].trim();
      media.push({
        kind: isVideoUrl(src) ? 'video' : 'image',
        src,
        alt: image[1].trim(),
      });
      continue;
    }

    const youtube = line.match(/^@youtube\(([^)]+)\)\s*$/i);
    if (youtube) {
      const embed = youtubeEmbed(youtube[1].trim());
      if (embed) {
        media.push({
          kind: 'youtube',
          src: embed.src,
          thumbnail: embed.thumbnail,
          alt: 'YouTube showcase',
        });
      }
      continue;
    }

    if (/^@media\([^)]*\)\s*$/i.test(line)) continue;
    contentLines.push(rawLine);
  }

  const groups: Array<{ title: string | null; lines: string[] }> = [];
  let current: { title: string | null; lines: string[] } = {
    title: null,
    lines: [],
  };

  for (const line of contentLines) {
    const heading = line.match(/^#{2,3}!?\s+(.+?)\s*$/);
    if (heading) {
      groups.push(current);
      current = { title: heading[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  groups.push(current);

  let overview = '';
  const sections: ProjectTextSection[] = [];

  for (const group of groups) {
    const body = compactMarkdown(group.lines);
    if (!group.title) {
      overview = body;
      continue;
    }

    const kind = sectionKind(group.title);
    if (body) sections.push({ title: group.title, content: body, kind });
  }

  return {
    overview,
    sections,
    media,
  };
}
