import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InteractiveCodeViewer from '../components/InteractiveCodeViewer';
import RichText from '../components/RichText';
import BlueprintMediaGallery from '../components/BlueprintMediaGallery';
import {
  BlueprintChevron,
  BlueprintMedia,
  BlueprintNodeHeader,
  BlueprintSectionTitle,
} from '../components/Blueprint';
import { releaseLabel } from '../lib/blueprintProject';
import { getProjectTags, loadProjectsList } from '../lib/projects';
import { parseProjectDetailContent } from '../lib/projectDetailContent';
import { loadSnippetsFromFile, type CodeSnippetWithAnnotations } from '../lib/snippets';
import { useSiteRuntime } from '../lib/siteRuntime';
import { withBaseUrl } from '../lib/paths';
import type { ProjectWithDetails } from '../types/portfolio';

type ProjectLinkKind = 'steam' | 'unity' | 'fab' | 'youtube' | 'external';

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}

function UnityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="m12.929 4.294 3.8 2.193c.136.077.141.29 0 .367l-4.516 2.608a.419.419 0 0 1-.424 0L7.274 6.854c-.139-.074-.142-.293 0-.367l3.797-2.193V0L1.376 5.598v11.195l3.717-2.146v-4.385c-.002-.157.182-.269.319-.184l4.514 2.607a.425.425 0 0 1 .214.368v5.213c.002.156-.182.268-.318.184l-3.8-2.193-3.717 2.145L12 24l9.695-5.598-3.717-2.145-3.8 2.193c-.134.082-.323-.025-.318-.184v-5.213c0-.157.087-.296.214-.368l4.514-2.607c.134-.082.323.022.319.184v4.385l3.717 2.146V5.598L12.929 0Z" />
    </svg>
  );
}

function FabIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <ellipse cx="12" cy="12" rx="10.25" ry="7.25" fill="currentColor" />
      <text
        x="12"
        y="15.15"
        fill="#0b0d10"
        fontFamily="Arial, sans-serif"
        fontSize="8.7"
        fontWeight="900"
        letterSpacing="-.45"
        textAnchor="middle"
      >
        FAB
      </text>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

function getProjectLinkKind(url: string): ProjectLinkKind {
  if (/(?:store\.)?steampowered\.com/i.test(url)) return 'steam';
  if (/assetstore\.unity\.com/i.test(url)) return 'unity';
  if (/(?:www\.)?fab\.com/i.test(url)) return 'fab';
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return 'youtube';
  return 'external';
}

function ProjectLinkIcon({ kind }: { kind: ProjectLinkKind }) {
  if (kind === 'steam') return <SteamIcon />;
  if (kind === 'unity') return <UnityIcon />;
  if (kind === 'fab') return <FabIcon />;
  if (kind === 'youtube') return <YouTubeIcon />;
  return <ExternalLink />;
}

const text = {
  en: {
    back: 'Back to ForEach(Projects)',
    notFound: 'Project not found',
    home: 'Back to home',
    tech: 'Technical Details',
    next: 'NEXT PROJECT',
    inspect: 'inspect',
    overview: 'Overview',
    media: 'Systems in action',
  },
  tr: {
    back: 'ForEach(Projects) listesine dön',
    notFound: 'Proje bulunamadı',
    home: 'Ana sayfaya dön',
    tech: 'Teknik Detaylar',
    next: 'SONRAKİ PROJE',
    inspect: 'incele',
    overview: 'Genel Bakış',
    media: 'Sistemler iş başında',
  },
} as const;

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useSiteRuntime();
  const ui = language === 'tr' ? text.tr : text.en;
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [snippets, setSnippets] = useState<CodeSnippetWithAnnotations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([loadProjectsList(), loadSnippetsFromFile()])
      .then(([projectList, snippetList]) => {
        if (!active) return;
        setProjects(projectList);
        setSnippets(snippetList);
      })
      .catch((error) => console.error('Error loading project:', error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  const project = projects.find((item) => item.slug === slug) || null;
  const projectIndex = project ? projects.findIndex((item) => item.slug === project.slug) : -1;
  const nextProject = projectIndex >= 0 && projects.length > 1 ? projects[(projectIndex + 1) % projects.length] : null;

  const snippetById = useMemo(() => {
    const map = new Map<string, CodeSnippetWithAnnotations>();
    snippets.forEach((snippet) => map.set(snippet.id, snippet));
    return map;
  }, [snippets]);

  if (loading) {
    return (
      <div className="blueprint-site bp-page-state">
        <span className="bp-media-spinner" role="status" aria-label="Compiling">
          <span className="bp-media-spinner__ring" aria-hidden="true" />
          <span className="bp-media-spinner__label" aria-hidden="true">
            compiling...
          </span>
        </span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="blueprint-site bp-page-state">
        <div className="bp-empty">
          <h1>{ui.notFound}</h1>
          <Link to="/" className="bp-button bp-button--secondary">
            {ui.home}
          </Link>
        </div>
      </div>
    );
  }

  const title = t(project.title);
  const summary = t(project.summary);
  const description = t(project.description);
  const tags = getProjectTags(project);
  const start = t(project.period_start);
  const end = t(project.period_end);
  const period = start && end ? `${start} — ${end}` : start || end;
  const release = releaseLabel(project, language);
  const links = (project.links || []).filter((link) => (link.url || '').trim());
  const blocks = (project.content_blocks || [])
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const parsedContent = parseProjectDetailContent(description);
  const technicalItems = Array.isArray(project.technical_details)
    ? project.technical_details.map((item) => item.trim()).filter(Boolean)
    : [];
  const result = t(project.result).trim();

  const renderSnippet = (id: string, caption?: string) => {
    const snippet = snippetById.get(id);
    if (!snippet) return null;
    const descriptionText = (caption || '').trim() || t(snippet.description);
    return (
      <details className="bp-snippet">
        <summary>
          <span>
            <strong>ƒ {t(snippet.title) || snippet.id}</strong>
            {descriptionText ? <small>// {descriptionText}</small> : null}
          </span>
          <span>
            {(snippet.language || '').toUpperCase()}
            <ChevronDown />
          </span>
        </summary>
        <div className="bp-snippet__content">
          <InteractiveCodeViewer snippet={snippet} annotations={snippet.annotations || []} hideHeader />
        </div>
      </details>
    );
  };

  return (
    <div className="blueprint-site">
      <Navbar />
      <main className="bp-shell bp-project-detail">
        <Link to="/#projeler" className="bp-back-link">
          <BlueprintChevron />
          {ui.back}
        </Link>

        <article>
          <header className="bp-project-hero bp-enter bp-enter--1">
            <BlueprintNodeHeader
              tone="function"
              aside={
                release ? (
                  <span className="bp-release-badge">
                    <span />
                    {release}
                  </span>
                ) : null
              }
            >
              ƒ GetProject(<span className="bp-string">"{project.slug}"</span>)
            </BlueprintNodeHeader>
            <div className="bp-project-hero__body">
              <div className="bp-project-hero__copy">
                <h1>{title}</h1>
                <p>{summary}</p>
                <div className="bp-tags">
                  {tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bp-project-hero__actions">
                {links.map((link) => {
                  const href = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(link.url) ? link.url : withBaseUrl(link.url);
                  const linkKind = getProjectLinkKind(link.url);
                  return (
                    <a
                      key={`${link.url}-${t(link.label)}`}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`bp-button bp-project-link bp-project-link--${linkKind}`}
                    >
                      <ProjectLinkIcon kind={linkKind} />
                      {t(link.label)}
                    </a>
                  );
                })}
                {period ? (
                  <span className="bp-period">
                    <Calendar />
                    {period}
                  </span>
                ) : null}
              </div>
            </div>
            <BlueprintMedia
              image={project.thumbnail_image_url ? withBaseUrl(project.thumbnail_image_url) : undefined}
              video={project.thumbnail_video_url ? withBaseUrl(project.thumbnail_video_url) : undefined}
              alt={title}
              autoPlay
              eager
              className="bp-project-hero__media"
            />
          </header>

          <div className="bp-project-layout">
            <div className="bp-project-content">
              {parsedContent.overview ? (
                <section className="bp-content-section bp-enter bp-enter--2">
                  <BlueprintSectionTitle
                    code="ƒ GetOverview()"
                    comment={ui.overview}
                  />
                  <RichText
                    text={parsedContent.overview}
                    className="blueprint-richtext"
                    headingIdPrefix="overview--"
                    snippetRenderer={renderSnippet}
                  />
                </section>
              ) : null}

              {parsedContent.sections.map((section, index) => {
                const functionName =
                  section.kind === 'problem'
                    ? 'GetProblem'
                    : section.kind === 'solution'
                      ? 'GetSolution'
                      : `GetSection${index + 1}`;
                const pinColor =
                  section.kind === 'problem'
                    ? '#c94e6f'
                    : section.kind === 'solution'
                      ? '#7fd6a4'
                      : '#6fa8c9';

                return (
                  <section
                    key={`${section.title}-${index}`}
                    className="bp-content-section"
                  >
                    <BlueprintSectionTitle
                      code={`ƒ ${functionName}()`}
                      comment={section.title}
                      pinColor={pinColor}
                    />
                    <RichText
                      text={section.content}
                      className="blueprint-richtext"
                      headingIdPrefix={`section-${index}--`}
                      snippetRenderer={renderSnippet}
                    />
                  </section>
                );
              })}

              {parsedContent.media.length > 0 ? (
                <section className="bp-content-section bp-media-section">
                  <BlueprintSectionTitle
                    code="ƒ GetMedia()"
                    comment={ui.media}
                  />
                  <BlueprintMediaGallery
                    items={parsedContent.media}
                    language={language}
                  />
                </section>
              ) : null}

              {result ? (
                <section className="bp-result-node">
                  <RichText
                    text={result}
                    className="blueprint-richtext"
                    headingIdPrefix="result--"
                    snippetRenderer={renderSnippet}
                  />
                </section>
              ) : null}

              {blocks.map((block, index) => {
                const blockTitle = t(block.title) || `${ui.overview} ${index + 2}`;
                return (
                  <section key={block.id || index} className="bp-content-section">
                    <BlueprintSectionTitle code={`ƒ GetSection(${index + 1})`} comment={blockTitle} />
                    <RichText
                      text={t(block.content)}
                      className="blueprint-richtext"
                      headingIdPrefix={`content-${block.id || index}--`}
                      snippetRenderer={renderSnippet}
                    />
                  </section>
                );
              })}
            </div>

            <aside className="bp-project-sidebar bp-enter bp-enter--3">
              {technicalItems.length > 0 ? (
                <div className="bp-tech-node">
                  <BlueprintNodeHeader tone="game">
                    ƒ GetTechStack() <span className="bp-comment">// {ui.tech}</span>
                  </BlueprintNodeHeader>
                  <ul>
                    {technicalItems.map((tag, index) => {
                      const colors = ['#4ec9b0', '#c9a44e', '#c94e6f', '#9c6fc9', '#6fa8c9'];
                      return (
                        <li key={tag}>
                          <span className="bp-pin" style={{ background: colors[index % colors.length] }} />
                          {tag}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {nextProject ? (
                <Link to={`/project/${nextProject.slug}`} className="bp-next-project">
                  <small>{ui.next}</small>
                  <strong>{t(nextProject.title)}</strong>
                  <span>
                    {ui.inspect}
                    <BlueprintChevron />
                  </span>
                </Link>
              ) : null}
            </aside>
          </div>
        </article>

        <Footer />
      </main>
    </div>
  );
}
