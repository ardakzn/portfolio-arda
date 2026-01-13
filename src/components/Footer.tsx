import { useSiteRuntime } from '../lib/siteRuntime';

export default function Footer() {
  const { site, t } = useSiteRuntime();

  return (
    <footer className="pt-10 pb-10 border-t border-white/5 text-center text-slate-500">
      <p>{t(site.footer?.text) || '© 2026 — Minimal color, high readability.'}</p>
    </footer>
  );
}

