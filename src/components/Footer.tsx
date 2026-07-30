import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useSiteRuntime } from '../lib/siteRuntime';

function normalizeGoatcounterBase(rawInput: string): string {
  const raw = (rawInput || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, '').replace(/\/count$/i, '');
  }

  if (raw.includes('goatcounter.com')) {
    return `https://${raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '').replace(/\/count$/i, '')}`;
  }

  return `https://${raw}.goatcounter.com`;
}

function counterPathForUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/counter/${path}.json`;
}

export default function Footer() {
  const { site, t } = useSiteRuntime();
  const location = useLocation();
  const [views, setViews] = useState<number | null>(null);
  const [compileComplete, setCompileComplete] = useState(false);
  const compileRef = useRef<HTMLSpanElement | null>(null);
  const goatBase = useMemo(() => normalizeGoatcounterBase(site.links?.goatcounter_code || ''), [site.links?.goatcounter_code]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCompileComplete(true);
      return;
    }

    const element = compileRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setCompileComplete(true);
      return;
    }

    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        timer = window.setTimeout(() => setCompileComplete(true), 700);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!goatBase) {
      setViews(null);
      return;
    }

    const endpoint = `${goatBase}${counterPathForUrl(location.pathname || '/')}`;
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`status ${res.status}`);

        const data: unknown = await res.json();
        const count = Number((data as { count?: number })?.count);
        if (Number.isFinite(count) && count >= 0) setViews(count);
        else setViews(null);
      } catch {
        setViews(null);
      }
    })();

    return () => controller.abort();
  }, [goatBase, location.pathname]);

  return (
    <footer className="bp-footer">
      <p>{t(site.footer?.text) || '© 2026 Arda Kozan'}</p>
      <p className="bp-footer__status">
        node_count: 10 ·{' '}
        <span ref={compileRef} className={`bp-footer__compile ${compileComplete ? 'is-complete' : ''}`}>
          {compileComplete ? 'compiled ✓' : 'compiling...'}
        </span>
      </p>
      {views !== null && (
        <div className="bp-footer__views">
          <span>
            <Eye />
            {views}
          </span>
        </div>
      )}
    </footer>
  );
}
