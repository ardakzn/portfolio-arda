import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Linkedin,
  Mail,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  BlueprintChevron,
  BlueprintMedia,
  BlueprintNodeHeader,
  BlueprintSectionTitle,
  BlueprintTypewriter,
} from '../components/Blueprint';
import {
  projectTone,
  projectTypeLabel,
  releaseLabel,
} from '../lib/blueprintProject';
import { getProjectTags, loadProjectsList } from '../lib/projects';
import { useSiteRuntime } from '../lib/siteRuntime';
import { withBaseUrl } from '../lib/paths';
import type { ProjectWithDetails } from '../types/portfolio';

const SLIDE_INTERVAL = 5000;

function GithubBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <path
        fill="#7d2ca8"
        transform="translate(3.36 3.36) scale(.72)"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

const copy = {
  en: {
    role: 'game developer',
    years: 'YEARS EXPERIENCE',
    steam: 'SHIPPED STEAM GAMES',
    tools: 'PUBLISHED TOOLS',
    featured: 'Featured work',
    skills: 'Skills',
    projects: 'Projects',
    filter: 'FilterProjects(tags)',
    tags: 'TAGS:',
    clear: 'clear',
    details: 'details',
    previous: 'previous',
    next: 'next',
    swipe: 'SWIPE',
    noResult: 'No projects match these tags.',
    showAll: 'Show all',
    contact: 'contact',
    workTogether: 'Let’s work together.',
    contactLead: 'I’m open to new opportunities and collaborations.',
    liveOn: 'Published',
    cvPreview: 'CV Preview',
    close: 'Close',
    download: 'Download PDF',
    openTab: 'Open in new tab',
  },
  tr: {
    role: 'game developer',
    years: 'YIL DENEYİM',
    steam: 'SHIPPED STEAM OYUNU',
    tools: 'YAYINLANMIŞ TOOL',
    featured: 'Öne çıkanlar',
    skills: 'Yetkinlikler',
    projects: 'Projeler',
    filter: 'FilterProjects(tags)',
    tags: 'ETİKETLER:',
    clear: 'temizle',
    details: 'detaylar',
    previous: 'önceki',
    next: 'sonraki',
    swipe: 'KAYDIR',
    noResult: 'Bu etiketlerle eşleşen proje bulunamadı.',
    showAll: 'Tümünü göster',
    contact: 'iletişim',
    workTogether: 'Birlikte çalışalım.',
    contactLead: 'Yeni fırsatlara ve iş birliklerine açığım.',
    liveOn: 'Yayında',
    cvPreview: 'CV Önizleme',
    close: 'Kapat',
    download: 'PDF’i indir',
    openTab: 'Yeni sekmede aç',
  },
} as const;

type CardProps = {
  project: ProjectWithDetails;
  language: string;
  title: string;
  summary: string;
  detailLabel: string;
  period: string;
};

function ProjectCard({ project, language, title, summary, detailLabel, period }: CardProps) {
  const image = project.thumbnail_image_url ? withBaseUrl(project.thumbnail_image_url) : undefined;
  const tags = getProjectTags(project);
  const release = releaseLabel(project, language);

  return (
    <Link to={`/project/${project.slug}`} className="bp-project-card">
      <BlueprintNodeHeader tone={projectTone(project)}>{projectTypeLabel(project)}</BlueprintNodeHeader>
      <BlueprintMedia image={image} alt={title} className="bp-project-card__media" />
      <div className="bp-project-card__body">
        <h3>{title}</h3>
        {release ? (
          <span className="bp-release-badge">
            <span />
            {release}
          </span>
        ) : null}
        <p>{summary}</p>
        <div className="bp-tags" aria-label="Project tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="bp-project-card__footer">
          <span>{period}</span>
          <span className="bp-details-link">
            {detailLabel}
            <BlueprintChevron />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventNode({ name, label }: { name: string; label: string }) {
  return (
    <div className="bp-event-sequence" aria-hidden="true">
      <div className="bp-event-node">
        <span className="bp-event-node__event">
          <span className="bp-exec-pin" />
          <strong>{name}</strong>
        </span>
        <span className="bp-event-node__output">{label}</span>
      </div>
      <span className="bp-flow-wire" />
    </div>
  );
}

export default function Home() {
  const { site, t, language } = useSiteRuntime();
  const ui = language === 'tr' ? copy.tr : copy.en;
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projectStripIndex, setProjectStripIndex] = useState(0);
  const [projectStripDragging, setProjectStripDragging] = useState(false);
  const [projectsEntered, setProjectsEntered] = useState(false);
  const [statProgress, setStatProgress] = useState(0);
  const [cvOpen, setCvOpen] = useState(false);
  const featuredTouchStartRef = useRef<number | null>(null);
  const projectStripRef = useRef<HTMLDivElement | null>(null);
  const projectDragRef = useRef<{
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  } | null>(null);
  const suppressProjectClickRef = useRef(false);
  const cvDialogRef = useRef<HTMLDivElement | null>(null);
  const cvCloseRef = useRef<HTMLButtonElement | null>(null);

  const cvUrl = withBaseUrl((site.links?.cv_pdf_url || '/assets/CV.pdf').trim() || '/assets/CV.pdf');

  useEffect(() => {
    let active = true;
    void loadProjectsList()
      .then((items) => {
        if (!active) return;
        setProjects(items);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      setProjectsEntered(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProjectsEntered(true);
      return;
    }

    const timer = window.setTimeout(() => setProjectsEntered(true), 500);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStatProgress(1);
      return;
    }

    let frame = 0;
    let startTime = 0;
    const delay = window.setTimeout(() => {
      const tick = (time: number) => {
        if (!startTime) startTime = time;
        const linearProgress = Math.min((time - startTime) / 1100, 1);
        setStatProgress(1 - Math.pow(1 - linearProgress, 3));
        if (linearProgress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, 600);

    return () => {
      window.clearTimeout(delay);
      window.cancelAnimationFrame(frame);
    };
  }, [loading]);

  const featured = useMemo(() => {
    const featuredWithVideo = projects.filter((project) => project.featured && project.thumbnail_video_url);
    if (featuredWithVideo.length > 0) return featuredWithVideo.slice(0, 3);
    const marked = projects.filter((project) => project.featured);
    return (marked.length > 0 ? marked : projects).slice(0, 3);
  }, [projects]);

  useEffect(() => {
    if (featured.length <= 1 || carouselPaused) return;
    const id = window.setTimeout(() => setSlideIndex((index) => (index + 1) % featured.length), SLIDE_INTERVAL);
    return () => window.clearTimeout(id);
  }, [carouselPaused, featured.length, slideIndex]);

  useEffect(() => {
    if (slideIndex >= featured.length) setSlideIndex(0);
  }, [featured.length, slideIndex]);

  const tags = useMemo(
    () =>
      Array.from(new Set(projects.flatMap((project) => getProjectTags(project))))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (selectedTags.length === 0) return projects;
    return projects.filter((project) => {
      const projectTags = getProjectTags(project).map((tag) => tag.toLowerCase());
      return selectedTags.every((tag) => projectTags.includes(tag.toLowerCase()));
    });
  }, [projects, selectedTags]);

  const visibleProjects = filteredProjects;

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  useEffect(() => {
    setProjectStripIndex(0);
    projectStripRef.current?.scrollTo({ left: 0 });
  }, [selectedTags]);

  const scrollProjectStrip = (target: number) => {
    const strip = projectStripRef.current;
    if (!strip || visibleProjects.length === 0) return;
    const index = Math.max(0, Math.min(target, visibleProjects.length - 1));
    const card = strip.children.item(index) as HTMLElement | null;
    if (!card) return;
    const left = card.offsetLeft - (strip.clientWidth - card.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    setProjectStripIndex(index);
  };

  const updateProjectStripIndex = () => {
    const strip = projectStripRef.current;
    if (!strip || strip.children.length === 0) return;
    const center = strip.scrollLeft + strip.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(strip.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setProjectStripIndex(closestIndex);
  };

  const startProjectDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || window.matchMedia('(min-width: 901px)').matches) return;
    projectDragRef.current = {
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
    setProjectStripDragging(true);
  };

  const moveProjectDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const drag = projectDragRef.current;
    if (!drag) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) drag.moved = true;
    if (!drag.moved) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - delta;
  };

  const endProjectDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const drag = projectDragRef.current;
    if (!drag) return;
    projectDragRef.current = null;
    setProjectStripDragging(false);
    if (!drag.moved) return;

    suppressProjectClickRef.current = true;
    window.setTimeout(() => {
      suppressProjectClickRef.current = false;
    }, 120);

    const strip = event.currentTarget;
    const center = strip.scrollLeft + strip.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(strip.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    scrollProjectStrip(closestIndex);
  };

  useEffect(() => {
    if (!cvOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cvCloseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCvOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        cvDialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ) || [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [cvOpen]);

  const steamCount = projects.filter((project) => getProjectTags(project).some((tag) => tag.toLowerCase() === 'steam')).length;
  const toolCount = projects.filter((project) =>
    getProjectTags(project).some((tag) => ['plugin', 'asset store'].includes(tag.toLowerCase())),
  ).length;
  const yearsExperience = Math.max(0, Math.round(Number(site.home?.years_experience) || 5));
  const animatedYears = Math.round(yearsExperience * statProgress);
  const animatedSteamCount = Math.round((steamCount || 2) * statProgress);
  const animatedToolCount = Math.round((toolCount || 2) * statProgress);
  const homeLead = t(site.home?.lead).split('{years}').join(String(yearsExperience));

  const skills = [
    { title: 'Unreal Engine / C++', detail: 'gameplay systems · plugins', color: '#4ec9b0' },
    { title: 'Unity / C#', detail: 'tooling · asset store', color: '#c9a44e' },
    { title: 'Multiplayer', detail: 'netcode · replication', color: '#c94e6f' },
    { title: 'AI Behavior', detail: 'behavior trees · EQS', color: '#9c6fc9' },
    { title: language === 'tr' ? 'VR Prototipleri' : 'VR Prototypes', detail: 'interaction · UI-state', color: '#6fa8c9' },
  ];

  const formatPeriod = (project: ProjectWithDetails) => {
    const start = t(project.period_start);
    const end = t(project.period_end);
    if (start && end) return `${start} — ${end}`;
    return start || end || '';
  };

  return (
    <div className="blueprint-site">
      <Navbar />
      <main className="bp-shell bp-home">
        <section className="bp-hero" aria-label={t(site.home?.headline) || 'Arda Kozan'}>
          <div className="bp-hero__mobile-identity bp-enter bp-enter--1">
            <EventNode name="OnInit()" label="run" />
            <h1>
              {t(site.home?.headline) || 'Arda Kozan'}
              <span>
                <BlueprintChevron />
                <BlueprintTypewriter text={ui.role} delay={260} speed={54} />
              </span>
            </h1>
          </div>
          <div className="bp-hero__copy bp-enter bp-enter--1">
            <div className="bp-hero__desktop-identity">
              <EventNode name="OnInit()" label="run" />
              <h1>
                {t(site.home?.headline) || 'Arda Kozan'}
                <span>
                  <BlueprintChevron />
                  <BlueprintTypewriter text={ui.role} delay={260} speed={54} />
                </span>
              </h1>
            </div>
            <p>{homeLead}</p>
            <div className="bp-hero__actions">
              <button type="button" className="bp-button bp-button--primary" onClick={() => setCvOpen(true)}>
                {t(site.home?.cta_cv) || ui.cvPreview}
              </button>
            </div>
            <div className="bp-stats" aria-label="Career summary">
              <div>
                <span className="bp-stat-label">
                  <i style={{ background: '#6fa8c9' }} />
                  {ui.years}
                </span>
                <strong className="bp-stat-breathe">{animatedYears}+</strong>
              </div>
              <div>
                <span className="bp-stat-label">
                  <i style={{ background: '#4ec9b0' }} />
                  {ui.steam}
                </span>
                <strong>{animatedSteamCount}</strong>
              </div>
              <div>
                <span className="bp-stat-label">
                  <i style={{ background: '#c9a44e' }} />
                  {ui.tools}
                </span>
                <strong>{animatedToolCount}</strong>
              </div>
            </div>
          </div>

          <div
            className="bp-featured-wrap bp-enter bp-enter--2"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onTouchStart={(event) => {
              featuredTouchStartRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = featuredTouchStartRef.current;
              featuredTouchStartRef.current = null;
              if (start === null || featured.length <= 1) return;
              const delta = (event.changedTouches[0]?.clientX ?? start) - start;
              if (Math.abs(delta) <= 40) return;
              setSlideIndex((index) => (index + (delta < 0 ? 1 : -1) + featured.length) % featured.length);
            }}
          >
            <div className="bp-featured">
              <BlueprintNodeHeader
                aside={`index: ${String(Math.min(slideIndex + 1, Math.max(1, featured.length))).padStart(2, '0')}/${String(
                  Math.max(1, featured.length),
                ).padStart(2, '0')}`}
              >
                <span>ƒ GetFeaturedProject()</span>{' '}
                <span className="bp-comment">// {ui.featured}</span>
              </BlueprintNodeHeader>
              <div className="bp-featured__viewport">
                <div className="bp-featured__track" style={{ transform: `translate3d(-${slideIndex * 100}%,0,0)` }}>
                  {loading && featured.length === 0 ? (
                    <div className="bp-featured__slide bp-featured__slide--loading" aria-hidden="true">
                      <div className="bp-media">
                        <div className="bp-media-spinner">
                          <span className="bp-media-spinner__ring" />
                          <span className="bp-media-spinner__label">compiling...</span>
                        </div>
                      </div>
                      <div className="bp-featured__meta bp-featured__meta--loading">
                        <div>
                          <span className="bp-featured-loading-line bp-featured-loading-line--title" />
                          <span className="bp-featured-loading-line" />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {featured.map((project, index) => {
                    const title = t(project.title);
                    const release = releaseLabel(project, language);
                    return (
                      <Link key={project.slug} to={`/project/${project.slug}`} className="bp-featured__slide">
                        <BlueprintMedia
                          image={project.thumbnail_image_url ? withBaseUrl(project.thumbnail_image_url) : undefined}
                          video={
                            index === slideIndex && project.thumbnail_video_url
                              ? withBaseUrl(project.thumbnail_video_url)
                              : undefined
                          }
                          alt={title}
                          autoPlay={index === slideIndex && Boolean(project.thumbnail_video_url)}
                          eager={index === 0}
                        />
                        {release ? (
                          <span className="bp-release-badge bp-release-badge--overlay">
                            <span />
                            {release}
                          </span>
                        ) : null}
                        <div className="bp-featured__meta">
                          <div>
                            <h2>{title}</h2>
                            <p>return: {getProjectTags(project).slice(0, 3).join(' · ')}</p>
                          </div>
                          <span>out ●</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {featured.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="bp-carousel-arrow bp-carousel-arrow--prev"
                      onClick={() => setSlideIndex((index) => (index - 1 + featured.length) % featured.length)}
                      aria-label={ui.previous}
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      type="button"
                      className="bp-carousel-arrow bp-carousel-arrow--next"
                      onClick={() => setSlideIndex((index) => (index + 1) % featured.length)}
                      aria-label={ui.next}
                    >
                      <ChevronRight />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="bp-carousel-dots" aria-label="Featured slides">
              {featured.map((project, index) => (
                <button
                  type="button"
                  key={project.slug}
                  className={index === slideIndex ? 'is-active' : ''}
                  onClick={() => setSlideIndex(index)}
                  aria-label={`${ui.featured} ${index + 1}`}
                  aria-current={index === slideIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bp-skills bp-enter bp-enter--3" aria-labelledby="skills-title">
          <BlueprintSectionTitle code="ƒ GetSkills()" comment={ui.skills} />
          <h2 id="skills-title" className="sr-only">
            {ui.skills}
          </h2>
          <div className="bp-skills__grid">
            {skills.map((skill) => (
              <div key={skill.title} className="bp-skill-card">
                <span className="bp-pin" style={{ background: skill.color }} />
                <span>
                  <strong>{skill.title}</strong>
                  <small>{skill.detail}</small>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="projeler" className="bp-projects bp-enter bp-enter--4" aria-labelledby="projects-title">
          <BlueprintSectionTitle code="ForEach(Projects)" comment={ui.projects} />
          <h2 id="projects-title" className="sr-only">
            {ui.projects}
          </h2>

          <div className={`bp-filter ${filtersOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="bp-filter__header"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="project-filters"
            >
              <span>ƒ {ui.filter}</span>
              <span>
                return: {filteredProjects.length}/{projects.length}
                <ChevronDown />
              </span>
            </button>
            <div
              id="project-filters"
              className="bp-filter__body"
              aria-hidden={!filtersOpen}
            >
              <span className="bp-filter__label">{ui.tags}</span>
              <div className="bp-filter__chips">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      className={active ? 'is-active' : ''}
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      disabled={!filtersOpen}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 ? (
                <button
                  type="button"
                  className="bp-filter__clear"
                  disabled={!filtersOpen}
                  onClick={() => {
                    setSelectedTags([]);
                  }}
                >
                  <X />
                  {ui.clear}
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="bp-project-grid bp-project-grid--loading" aria-label="Loading projects">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="bp-project-skeleton" />
              ))}
            </div>
          ) : visibleProjects.length > 0 ? (
            <>
              <div
                className={`bp-project-grid ${projectStripDragging ? 'is-dragging' : ''}`}
                ref={projectStripRef}
                onScroll={updateProjectStripIndex}
                onMouseDown={startProjectDrag}
                onMouseMove={moveProjectDrag}
                onMouseUp={endProjectDrag}
                onMouseLeave={endProjectDrag}
                onDragStart={(event) => event.preventDefault()}
                onClickCapture={(event) => {
                  if (!suppressProjectClickRef.current) return;
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                {visibleProjects.map((project, index) => (
                  <div
                    key={project.slug}
                    className={`bp-project-entry ${projectsEntered ? 'is-entered' : ''}`}
                    style={{ '--bp-index': index } as React.CSSProperties}
                  >
                    <ProjectCard
                      project={project}
                      language={language}
                      title={t(project.title)}
                      summary={t(project.summary)}
                      detailLabel={ui.details}
                      period={formatPeriod(project)}
                    />
                  </div>
                ))}
              </div>
              {visibleProjects.length > 1 ? (
                <div className="bp-project-strip-nav" aria-label={ui.projects}>
                  <button
                    type="button"
                    onClick={() => scrollProjectStrip(0)}
                    disabled={projectStripIndex === 0}
                    aria-label={`${ui.projects}: 1`}
                  >
                    <BlueprintChevron />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollProjectStrip(projectStripIndex - 1)}
                    disabled={projectStripIndex === 0}
                    aria-label={ui.previous}
                  >
                    <ChevronLeft />
                  </button>
                  <span>
                    {String(projectStripIndex + 1).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')} ·{' '}
                    {ui.swipe}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollProjectStrip(projectStripIndex + 1)}
                    disabled={projectStripIndex === visibleProjects.length - 1}
                    aria-label={ui.next}
                  >
                    <ChevronRight />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollProjectStrip(visibleProjects.length - 1)}
                    disabled={projectStripIndex === visibleProjects.length - 1}
                    aria-label={`${ui.projects}: ${visibleProjects.length}`}
                  >
                    <BlueprintChevron />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="bp-empty">
              <p>{ui.noResult}</p>
              <button
                type="button"
                className="bp-button bp-button--secondary"
                onClick={() => {
                  setSelectedTags([]);
                }}
              >
                {ui.showAll}
              </button>
            </div>
          )}

        </section>

        <section id="iletisim" className="bp-contact bp-enter bp-enter--5" aria-labelledby="contact-title">
          <div>
            <EventNode name="OnExit()" label={ui.contact} />
            <h2 id="contact-title">{ui.workTogether}</h2>
            <p>{ui.contactLead}</p>
          </div>
          <div className="bp-contact__actions">
            <a className="bp-button bp-button--primary" href={`mailto:${site.links?.email || 'arda.kzn@gmail.com'}`}>
              <Mail />
              SendMessage()
            </a>
            <a className="bp-button bp-profile-link bp-profile-link--github" href={site.links?.github_url} target="_blank" rel="noreferrer">
              <GithubBrandIcon />
              GitHub
            </a>
            <a className="bp-button bp-profile-link bp-profile-link--linkedin" href={site.links?.linkedin_url} target="_blank" rel="noreferrer">
              <Linkedin />
              LinkedIn
            </a>
          </div>
        </section>

        <Footer />
      </main>

      {cvOpen ? (
        <div className="bp-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCvOpen(false)}>
          <div ref={cvDialogRef} className="bp-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cv-title">
            <BlueprintNodeHeader aside="PDF">ƒ OpenDocument()</BlueprintNodeHeader>
            <div className="bp-modal__toolbar">
              <div>
                <span>{ui.cvPreview}</span>
                <h2 id="cv-title">{t(site.home?.cv_modal_title)}</h2>
              </div>
              <button ref={cvCloseRef} type="button" onClick={() => setCvOpen(false)} aria-label={ui.close}>
                <X />
              </button>
            </div>
            <div className="bp-modal__actions">
              <a href={cvUrl} download className="bp-button bp-button--primary">
                <Download />
                {ui.download}
              </a>
              <a href={cvUrl} target="_blank" rel="noreferrer" className="bp-button bp-button--secondary">
                {ui.openTab}
                <BlueprintChevron />
              </a>
            </div>
            <iframe src={`${cvUrl}#zoom=page-width`} title={ui.cvPreview} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
