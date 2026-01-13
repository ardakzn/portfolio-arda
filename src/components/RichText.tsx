import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeMarkdownText, slugifyHeading as slugifyHeadingStable } from '../lib/markdown';
import { withBaseUrl } from '../lib/paths';

type RichTextSize = 'normal' | 'small';

type Block =
  | { type: 'heading'; level: 2 | 3; text: string; tocHidden?: boolean }
  | { type: 'image'; alt: string; src: string }
  | { type: 'carousel'; images: { alt: string; src: string }[] }
  | { type: 'snippet'; id: string; caption?: string }
  | { type: 'youtube'; embedUrl: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('http://')) return true;
  if (trimmed.startsWith('mailto:')) return true;
  return false;
}

function normalizeInputText(input: string): string {
  return normalizeMarkdownText(input);
}

function toYouTubeEmbedUrl(inputUrl: string): string | null {
  try {
    const u = new URL(inputUrl);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '');
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }

    if (host === 'youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
      }
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)$/);
      if (embedMatch) return `https://www.youtube.com/embed/${encodeURIComponent(embedMatch[1])}`;
    }
  } catch {
    // ignore
  }
  return null;
}

function parseBlocks(input: string): Block[] {
  const lines = normalizeInputText(input).split('\n');
  const blocks: Block[] = [];

  let i = 0;
  const consumeParagraph = () => {
    const parts: string[] = [];
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) break;
      if (/^#{2,3}!\s+/.test(line) || /^#{2,3}\s+/.test(line)) break;
      if (/^-\s+/.test(line)) break;
      if (/^!\[[^\]]*]\([^)]+\)\s*$/.test(line.trim())) break;
      parts.push(line);
      i += 1;
    }
    const text = parts.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const h = line.match(/^(##|###)(!)?\s+(.+)$/);
    if (h) {
      const level = h[1] === '##' ? 2 : 3;
      const tocHidden = !!h[2];
      blocks.push({ type: 'heading', level, text: (h[3] || '').trim(), tocHidden });
      i += 1;
      continue;
    }

    const img = line.trim().match(/^!\[([^\]]*)]\(([^)]+)\)\s*$/);
    if (img) {
      const images: { alt: string; src: string }[] = [];

      const pushImg = (m: RegExpMatchArray) => {
        images.push({ alt: (m[1] || '').trim(), src: (m[2] || '').trim() });
      };

      pushImg(img);
      i += 1;

      // If multiple images appear back-to-back (optionally separated by blank lines),
      // render them as a lightweight carousel.
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) {
          i += 1;
          continue;
        }
        const m = next.match(/^!\[([^\]]*)]\(([^)]+)\)\s*$/);
        if (!m) break;
        pushImg(m);
        i += 1;
      }

      if (images.length <= 1) {
        blocks.push({ type: 'image', alt: images[0].alt, src: images[0].src });
      } else {
        blocks.push({ type: 'carousel', images });
      }
      continue;
    }

    const yt = line.trim().match(/^@youtube\(([^)]+)\)\s*$/i);
    if (yt) {
      const url = yt[1].trim();
      const embedUrl = toYouTubeEmbedUrl(url);
      if (embedUrl) {
        blocks.push({ type: 'youtube', embedUrl });
      } else {
        blocks.push({ type: 'paragraph', text: line });
      }
      i += 1;
      continue;
    }

    const snippet = line.trim().match(/^@snippet\(([^)]+)\)\s*$/i);
    if (snippet) {
      const inside = snippet[1].trim();
      const comma = inside.indexOf(',');
      const id = (comma === -1 ? inside : inside.slice(0, comma)).trim();
      const rawCaption = comma === -1 ? '' : inside.slice(comma + 1).trim();
      const caption =
        rawCaption.length > 1 &&
        ((rawCaption.startsWith('"') && rawCaption.endsWith('"')) || (rawCaption.startsWith("'") && rawCaption.endsWith("'")))
          ? rawCaption.slice(1, -1).trim()
          : rawCaption;
      blocks.push({ type: 'snippet', id, caption: caption || undefined });
      i += 1;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trimEnd();
        const m = l.match(/^-+\s+(.+)$/);
        if (!m) break;
        items.push(m[1].trim());
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: 'list', items });
      continue;
    }

    consumeParagraph();
  }

  return blocks;
}

function renderInline(text: string, size: RichTextSize) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const [full, label, hrefRaw] = match;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const href = hrefRaw.trim();
    if (isSafeUrl(href)) {
      parts.push(
        <a
          key={`${match.index}-${full}`}
          href={href}
          target={href.startsWith('/') ? undefined : '_blank'}
          rel={href.startsWith('/') ? undefined : 'noreferrer'}
          className={size === 'small' ? 'text-[#3be3ff] hover:text-[#f9b234] underline underline-offset-2' : 'text-[#3be3ff] hover:text-[#f9b234] underline underline-offset-2'}
        >
          {label}
        </a>,
      );
    } else {
      parts.push(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function Carousel({
  images,
}: {
  images: { alt: string; src: string }[];
}) {
  const safeImages = useMemo(() => images.filter((img) => isSafeUrl(img.src)).map((img) => ({ ...img, src: withBaseUrl(img.src) })), [images]);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const prev = () => {
    if (safeImages.length <= 1) return;
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  };

  const next = () => {
    if (safeImages.length <= 1) return;
    setIndex((i) => (i + 1) % safeImages.length);
  };

  useEffect(() => {
    if (safeImages.length <= 1) return;
    if (hovered) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeImages.length);
    }, 4500);
    return () => window.clearInterval(t);
  }, [hovered, safeImages.length]);

  if (safeImages.length === 0) return null;
  const current = safeImages[Math.max(0, Math.min(index, safeImages.length - 1))];

  return (
    <div
      className="my-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="relative w-full pt-[56.25%]">
          {safeImages.map((img, i) => (
            <img
              key={`${img.src}-${i}`}
              src={img.src}
              alt={img.alt || 'image'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              loading="lazy"
            />
          ))}
        </div>

        {current.alt && (
          <div className="absolute inset-x-0 bottom-0">
            <div className="h-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 py-4">
              <div className="max-w-full">
                <div className="text-sm sm:text-base text-slate-100/90 font-normal italic leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                  {current.alt}
                </div>
              </div>
            </div>
          </div>
        )}

        {safeImages.length > 1 && (
          <div className={`pointer-events-none absolute inset-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
              className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0e1526]/75 p-3 text-white shadow-lg transition hover:bg-[#0e1526] hover:-translate-x-0.5 active:scale-95 active:bg-[#0e1526] active:shadow-none"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-[#f9b234]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
              className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0e1526]/75 p-3 text-white shadow-lg transition hover:bg-[#0e1526] hover:translate-x-0.5 active:scale-95 active:bg-[#0e1526] active:shadow-none"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-[#f9b234]" />
            </button>
          </div>
        )}

        {safeImages.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {safeImages.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setIndex(dotIdx)}
                className={`h-2.5 w-2.5 rounded-full border transition ${
                  dotIdx === index ? 'bg-[#3be3ff] border-[#3be3ff]/60' : 'bg-white/20 border-white/20 hover:bg-white/30'
                }`}
                aria-label={`Go to image ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RichText({
  text,
  className,
  size = 'normal',
  snippetRenderer,
  headingIdPrefix = '',
}: {
  text: string | null | undefined;
  className?: string;
  size?: RichTextSize;
  snippetRenderer?: (id: string, caption?: string) => React.ReactNode | null | undefined;
  headingIdPrefix?: string;
}) {
  if (!text) return null;
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;

  const headingCounts = new Map<string, number>();

  return (
    <div className={className}>
      {blocks.map((b, idx) => {
        if (b.type === 'heading') {
          const Tag = b.level === 2 ? 'h2' : 'h3';
          const base = `${headingIdPrefix}${slugifyHeadingStable(b.text) || 'section'}`;
          const count = (headingCounts.get(base) || 0) + 1;
          headingCounts.set(base, count);
          const id = count === 1 ? base : `${base}-${count}`;
          return (
            <Tag
              key={idx}
              id={id}
              className={
                size === 'small'
                  ? 'text-sm font-semibold text-white mt-2 mb-1'
                  : b.level === 2
                    ? 'text-xl font-semibold text-white mt-5 mb-2'
                    : 'text-lg font-semibold text-white mt-4 mb-2'
              }
            >
              {b.text}
            </Tag>
          );
        }

        if (b.type === 'image') {
          const safe = isSafeUrl(b.src);
          if (!safe) return null;
          const src = withBaseUrl(b.src);
          return (
            <figure key={idx} className="my-4">
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <img src={src} alt={b.alt || 'image'} className="w-full" loading="lazy" />
                {b.alt && (
                  <figcaption className="absolute inset-x-0 bottom-0">
                    <div className="h-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 px-5 py-4">
                      <div className="max-w-full">
                        <div className="text-sm sm:text-base text-slate-100/90 font-normal italic leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                          {b.alt}
                        </div>
                      </div>
                    </div>
                  </figcaption>
                )}
              </div>
            </figure>
          );
        }

        if (b.type === 'carousel') {
          return <Carousel key={idx} images={b.images} />;
        }

        if (b.type === 'snippet') {
          const node = snippetRenderer ? snippetRenderer(b.id, b.caption) : null;
          if (!node) {
            return (
              <div key={idx} className="my-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Unknown snippet: <span className="font-mono text-xs">{b.id}</span>
              </div>
            );
          }

          return <React.Fragment key={idx}>{node}</React.Fragment>;
        }

        if (b.type === 'youtube') {
          return (
            <div key={idx} className="my-4">
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 pt-[56.25%]">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={b.embedUrl}
                  title="YouTube video"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }

        if (b.type === 'list') {
          return (
            <ul key={idx} className={size === 'small' ? 'list-disc pl-5 space-y-1 text-xs text-slate-200' : 'list-disc pl-6 space-y-1 text-sm text-slate-200'}>
              {b.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item, size)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={idx}
            className={
              size === 'small'
                ? 'text-xs text-slate-200 leading-relaxed whitespace-pre-wrap'
                : 'text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-wrap'
            }
          >
            {renderInline(b.text, size)}
          </p>
        );
      })}
    </div>
  );
}
