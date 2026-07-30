import type { LocalizedText } from '../types/i18n';
import type { ProjectWithDetails } from '../types/portfolio';

type ExtractedLegacyFields = {
  markdown: string;
  items: string[];
  result: string;
};

function normalizedTitle(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isLegacyTechnicalTitle(value: string): boolean {
  const title = normalizedTitle(value);
  return title.includes('technical') || title.includes('teknik detay') || title.includes('tech stack');
}

function isMediaDirective(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^!\[([^\]]*)]\(([^)]+)\)\s*$/.test(trimmed) ||
    /^@youtube\(([^)]+)\)\s*$/i.test(trimmed) ||
    /^@media\(([^)]*)\)\s*$/i.test(trimmed)
  );
}

function compact(value: string): string {
  return value.replace(/\n{3,}/g, '\n\n').trim();
}

function extractLegacyFields(markdown: string): ExtractedLegacyFields {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const headingPattern = /^#{2,3}!?\s+(.+?)\s*$/;
  const start = lines.findIndex((line) => {
    const heading = line.match(headingPattern);
    return heading ? isLegacyTechnicalTitle(heading[1]) : false;
  });

  if (start < 0) return { markdown, items: [], result: '' };

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (headingPattern.test(lines[index])) {
      end = index;
      break;
    }
  }

  const section = lines.slice(start + 1, end);
  const items = section
    .map((line) => line.trim().match(/^-\s+(.+)$/)?.[1]?.trim() || '')
    .filter(Boolean);
  const firstListIndex = section.findIndex((line) => /^-\s+/.test(line.trim()));
  const result =
    firstListIndex < 0
      ? ''
      : compact(
          section
            .slice(firstListIndex + 1)
            .filter((line) => !/^-\s+/.test(line.trim()) && !isMediaDirective(line))
            .join('\n'),
        );
  const mediaLines = section.filter(isMediaDirective);

  return {
    markdown: compact([...lines.slice(0, start), ...mediaLines, ...lines.slice(end)].join('\n')),
    items,
    result,
  };
}

export function migrateLegacyProjectStructuredFields(project: ProjectWithDetails): ProjectWithDetails {
  if ('technical_details' in project || 'result' in project) return project;

  const extractedByLanguage: Record<string, ExtractedLegacyFields> = {};
  let description: LocalizedText;

  if (typeof project.description === 'string') {
    const extracted = extractLegacyFields(project.description);
    description = extracted.markdown;
    extractedByLanguage.default = extracted;
  } else {
    const nextDescription: Record<string, string | undefined> = {};
    for (const [language, markdown] of Object.entries(project.description || {})) {
      const extracted = extractLegacyFields(markdown || '');
      nextDescription[language] = extracted.markdown;
      extractedByLanguage[language] = extracted;
    }
    description = nextDescription;
  }

  const extractedItems =
    extractedByLanguage.en?.items ||
    Object.values(extractedByLanguage).find((entry) => entry.items.length > 0)?.items ||
    [];
  const technicalDetails =
    Array.isArray(project.technical_details) && project.technical_details.length > 0
      ? project.technical_details
      : extractedItems;

  let result = project.result;
  if (!result) {
    if (typeof project.description === 'string') {
      result = extractedByLanguage.default?.result || '';
    } else {
      const localizedResult: Record<string, string | undefined> = {};
      for (const [language, extracted] of Object.entries(extractedByLanguage)) {
        if (extracted.result) localizedResult[language] = extracted.result;
      }
      result = localizedResult;
    }
  }

  return {
    ...project,
    description,
    technical_details: technicalDetails,
    result,
  };
}
