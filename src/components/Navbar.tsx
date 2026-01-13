import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronDown, Github, Linkedin } from 'lucide-react';
import { useSiteRuntime } from '../lib/siteRuntime';

const navLinkBase =
  'px-2.5 py-1.5 sm:px-3 sm:py-2 max-[360px]:px-2 max-[360px]:py-1 rounded-full text-sm sm:text-base max-[360px]:text-xs transition-all duration-300 border border-transparent';

const navLinkActive =
  'text-white border-white/10 bg-white/5 shadow-sm shadow-cyan-500/10';

const navLinkInactive =
  'text-slate-300 hover:text-white hover:border-white/10 hover:-translate-y-0.5';

export default function Navbar() {
  const { site, languages, language, setLanguage, t } = useSiteRuntime();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  const brand = t(site.navbar?.brand);
  const navHome = t(site.navbar?.nav_home);
  const navProjects = t(site.navbar?.nav_projects);
  const githubUrl = site.links?.github_url || 'https://github.com';
  const linkedinUrl = site.links?.linkedin_url || 'https://linkedin.com';

  const currentLangLabel = useMemo(() => {
    const found = languages.find((l) => l.code === language);
    return found?.label || language.toUpperCase();
  }, [language, languages]);

  useEffect(() => {
    if (!langMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = langMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setLangMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [langMenuOpen]);

  const languageSelector =
    languages.length === 2 ? (
      <div className="inline-flex rounded-full border border-white/10 bg-white/5 overflow-hidden">
        {languages.map((l) => {
          const active = l.code === language;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`px-3 py-1.5 text-sm sm:text-base transition ${
                active ? 'bg-[#3be3ff] text-slate-950 font-semibold' : 'text-slate-200 hover:bg-white/10'
              } max-[360px]:px-2 max-[360px]:py-1 max-[360px]:text-xs`}
              aria-pressed={active}
              title={l.label}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    ) : languages.length > 2 ? (
      <div ref={langMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setLangMenuOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3 sm:py-2 max-[360px]:px-2 max-[360px]:py-1 rounded-full text-sm sm:text-base max-[360px]:text-xs border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 transition"
          aria-label="Language"
          aria-haspopup="menu"
          aria-expanded={langMenuOpen}
        >
          <span className="font-semibold">{currentLangLabel}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {langMenuOpen && (
          <div className="absolute right-0 mt-2 w-28 sm:w-32 rounded-2xl border border-white/10 bg-[#0b1221]/95 backdrop-blur shadow-2xl shadow-black/40 overflow-hidden">
            <div className="py-2" role="menu" aria-label="Language options">
              {languages.map((l) => {
                const active = l.code === language;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm max-[360px]:text-xs transition ${
                      active ? 'bg-white/10 text-white font-semibold' : 'text-slate-200 hover:bg-white/5'
                    }`}
                    role="menuitem"
                  >
                    <span className="truncate">{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : null;

  return (
    <header id="site-header" className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0c1324]/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <Link
          to="/"
          className="text-white font-semibold tracking-tight text-base sm:text-lg md:text-xl relative shrink-0 max-w-[60vw] truncate"
        >
          {brand || 'Codefolio'}
          <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#3be3ff] opacity-70"></span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 max-[360px]:w-full max-[360px]:justify-start">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
            }
          >
            {navHome || 'Home'}
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
            }
          >
            {navProjects || 'Projects'}
          </NavLink>
          <span className="text-white/15 max-[360px]:hidden">|</span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          {languageSelector}
        </div>
      </div>
    </header>
  );
}
