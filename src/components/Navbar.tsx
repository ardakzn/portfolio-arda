import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSiteRuntime } from '../lib/siteRuntime';

export default function Navbar() {
  const { site, languages, language, setLanguage, t } = useSiteRuntime();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const brand = t(site.navbar?.brand);
  const navProjects = t(site.navbar?.nav_projects);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;

    const sectionId = decodeURIComponent(location.hash.slice(1));
    const scrollToSection = () => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const frame = window.requestAnimationFrame(scrollToSection);
    const settleTimer = window.setTimeout(scrollToSection, 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
    };
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = mobileMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((value) => !value);
  };

  const languageSelector = (
    <div className="bp-language" aria-label="Language">
      {languages.map((item) => {
        const active = item.code === language;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            className={active ? 'is-active' : ''}
            aria-pressed={active}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const navItems = (
    <>
      <Link to={{ pathname: '/', hash: '#projeler' }} onClick={() => setMobileMenuOpen(false)}>
        {navProjects || (language === 'tr' ? 'Projeler' : 'Projects')}
      </Link>
      <Link to={{ pathname: '/', hash: '#iletisim' }} onClick={() => setMobileMenuOpen(false)}>
        {language === 'tr' ? 'İletişim' : 'Contact'}
      </Link>
    </>
  );

  return (
    <>
      <header id="site-header" className="bp-navbar">
        <div className="bp-shell bp-navbar__inner">
          <Link to="/" className="bp-brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="bp-brand__pin" />
            <span>{brand || 'Arda Kozan'}</span>
            <span className="bp-brand__suffix">.dev</span>
          </Link>

          <div className="bp-navbar__right">
            <nav className="bp-navlinks" aria-label="Primary navigation">
              {navItems}
            </nav>
            <span className="bp-nav-divider" aria-hidden="true" />
            <div className="bp-language--desktop">{languageSelector}</div>
            <div ref={mobileMenuRef} className="bp-mobile-nav">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="bp-mobile-nav__trigger"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
              {mobileMenuOpen && (
                <div id="mobile-navigation" className="bp-mobile-nav__panel">
                  <nav>{navItems}</nav>
                  {languageSelector}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="bp-navbar-spacer" aria-hidden="true" />
    </>
  );
}
