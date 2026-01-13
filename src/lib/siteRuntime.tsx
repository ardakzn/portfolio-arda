import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SiteData, SiteLanguage } from '../types/site';
import type { LocalizedString } from '../types/i18n';
import { getDefaultSite, loadSite } from './site';

type SiteRuntimeValue = {
  site: SiteData;
  languages: SiteLanguage[];
  defaultLanguage: string;
  language: string;
  setLanguage: (code: string) => void;
  t: (value: LocalizedString | string | undefined) => string;
  loading: boolean;
};

const LANGUAGE_STORAGE_KEY = 'codefolio:language:v1';

const SiteRuntimeContext = createContext<SiteRuntimeValue | null>(null);

function pickFirstNonEmpty(value: LocalizedString): string {
  for (const key of Object.keys(value)) {
    const v = (value[key] || '').trim();
    if (v) return v;
  }
  return '';
}

function resolveLocalized(value: LocalizedString, language: string, defaultLanguage: string): string {
  const direct = (value[language] || '').trim();
  if (direct) return direct;
  const fallback = (value[defaultLanguage] || '').trim();
  if (fallback) return fallback;
  return pickFirstNonEmpty(value);
}

function normalizeLang(code: string): string {
  return code.trim().toLowerCase();
}

function getQueryLang(): string | null {
  try {
    const url = new URL(window.location.href);
    const q = (url.searchParams.get('lang') || '').trim();
    return q ? normalizeLang(q) : null;
  } catch {
    return null;
  }
}

export function SiteRuntimeProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteData>(getDefaultSite());
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    void (async () => {
      try {
        const data = await loadSite();
        setSite(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const languages = useMemo<SiteLanguage[]>(() => {
    const list = site.languages || [];
    return list.length > 0 ? list : [{ code: 'en', label: 'EN' }];
  }, [site.languages]);

  const defaultLanguage = useMemo(() => normalizeLang(site.default_language || 'en'), [site.default_language]);

  useEffect(() => {
    const allowed = new Set(languages.map((l) => normalizeLang(l.code)));

    const queryLang = getQueryLang();
    if (queryLang && allowed.has(queryLang)) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, queryLang);
      setLanguageState(queryLang);
      return;
    }

    const stored = normalizeLang(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || '');
    if (stored && allowed.has(stored)) {
      setLanguageState(stored);
      return;
    }

    setLanguageState(allowed.has(defaultLanguage) ? defaultLanguage : normalizeLang(languages[0]?.code || 'en'));
  }, [defaultLanguage, languages]);

  const setLanguage = (code: string) => {
    const next = normalizeLang(code);
    const allowed = new Set(languages.map((l) => normalizeLang(l.code)));
    if (!allowed.has(next)) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setLanguageState(next);
  };

  const runtime = useMemo<SiteRuntimeValue>(() => {
    const t = (value: LocalizedString | string | undefined) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      return resolveLocalized(value, language, defaultLanguage);
    };
    return {
      site,
      languages,
      defaultLanguage,
      language,
      setLanguage,
      t,
      loading,
    };
  }, [defaultLanguage, language, languages, loading, site]);

  return <SiteRuntimeContext.Provider value={runtime}>{children}</SiteRuntimeContext.Provider>;
}

export function useSiteRuntime(): SiteRuntimeValue {
  const ctx = useContext(SiteRuntimeContext);
  if (!ctx) throw new Error('useSiteRuntime must be used within SiteRuntimeProvider');
  return ctx;
}
