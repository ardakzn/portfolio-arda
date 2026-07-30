import { getProjectTags } from './projects';
import type { ProjectWithDetails } from '../types/portfolio';

export type BlueprintTone =
  | 'function'
  | 'event'
  | 'game'
  | 'tool'
  | 'prototype'
  | 'freelance'
  | 'jam';

export function projectTone(
  project: Pick<ProjectWithDetails, 'tags' | 'tech_stack'>,
): BlueprintTone {
  const tags = getProjectTags(project).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => tag.includes('steam'))) return 'game';
  if (
    tags.some(
      (tag) =>
        tag.includes('plugin') ||
        tag.includes('tool') ||
        tag.includes('asset store'),
    )
  ) {
    return 'tool';
  }
  if (tags.some((tag) => tag.includes('gamejam') || tag.includes('game jam'))) {
    return 'jam';
  }
  if (tags.some((tag) => tag.includes('vr'))) return 'prototype';
  if (tags.some((tag) => tag.includes('freelance'))) return 'freelance';
  return 'function';
}

export function projectTypeLabel(
  project: Pick<ProjectWithDetails, 'tags' | 'tech_stack'>,
): string {
  const tags = getProjectTags(project);
  const lower = tags.map((tag) => tag.toLowerCase());

  if (lower.includes('steam')) return 'Game · Steam';
  if (lower.includes('asset store')) return 'Package · Asset Store';
  if (lower.includes('plugin')) return 'Plugin · Tool';
  if (lower.some((tag) => tag.includes('gamejam') || tag.includes('game jam'))) {
    return 'Game Jam · Project';
  }
  if (lower.includes('vr')) return 'Prototype · VR';
  if (lower.includes('freelance')) return 'Freelance · Project';
  return tags.slice(0, 2).join(' · ') || 'Project';
}

export function releaseLabel(
  project: Pick<ProjectWithDetails, 'tags' | 'tech_stack' | 'links'>,
  language: string,
): string {
  const tags = getProjectTags(project).map((tag) => tag.toLowerCase());
  const linkText = (project.links || [])
    .map((link) => {
      const label =
        typeof link.label === 'string'
          ? link.label
          : link.label?.[language] || link.label?.en || link.label?.tr || '';
      return `${link.kind || ''} ${label}`.toLowerCase();
    })
    .join(' ');

  if (tags.includes('steam') || linkText.includes('steam')) {
    return language === 'tr' ? "STEAM'DE YAYINDA" : 'LIVE ON STEAM';
  }
  if (tags.includes('asset store') || linkText.includes('asset store')) {
    return language === 'tr'
      ? "ASSET STORE'DA YAYINDA"
      : 'LIVE ON ASSET STORE';
  }
  if (linkText.includes('fab') || linkText.includes('marketplace')) {
    return language === 'tr' ? "FAB'DE YAYINDA" : 'LIVE ON FAB';
  }
  return '';
}
