export const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

export const routerBasename = baseUrl === '/' ? '/' : baseUrl.replace(/\/$/, '');

export function withBaseUrl(input: string): string {
  const value = (input || '').trim();
  if (!value) return baseUrl;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) return value;

  const normalized = value.startsWith('/') ? value : `/${value}`;
  if (baseUrl !== '/' && normalized.startsWith(baseUrl)) return normalized;
  return `${baseUrl}${normalized.replace(/^\//, '')}`;
}

