import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  X,
  Youtube,
} from 'lucide-react';
import { withBaseUrl } from '../lib/paths';
import type { ProjectMediaItem } from '../lib/projectDetailContent';
import { BlueprintSpinner } from './Blueprint';

function resolvedItem(item: ProjectMediaItem): ProjectMediaItem {
  if (item.kind === 'youtube') return item;
  return { ...item, src: withBaseUrl(item.src) };
}

function MediaSurface({
  item,
  fullscreen = false,
  onReady,
}: {
  item: ProjectMediaItem;
  fullscreen?: boolean;
  onReady?: () => void;
}) {
  if (item.kind === 'video') {
    return (
      <video
        key={item.src}
        src={item.src}
        muted={!fullscreen}
        autoPlay
        loop
        controls={fullscreen}
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate nopictureinpicture"
        onLoadedData={(event) => {
          event.currentTarget.muted = !fullscreen;
          event.currentTarget.defaultMuted = !fullscreen;
          event.currentTarget.volume = fullscreen ? 1 : 0;
          void event.currentTarget.play().catch(() => {});
          onReady?.();
        }}
      />
    );
  }

  if (item.kind === 'youtube') {
    return (
      <iframe
        key={item.src}
        src={`${item.src}?rel=0${fullscreen ? '&autoplay=1' : ''}`}
        title={item.alt || 'YouTube showcase'}
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={onReady}
      />
    );
  }

  return (
    <img
      key={item.src}
      src={item.src}
      alt={item.alt || 'Project media'}
      loading="eager"
      onLoad={onReady}
    />
  );
}

function MediaThumbnail({ item }: { item: ProjectMediaItem }) {
  if (item.thumbnail) {
    return <img src={item.thumbnail} alt="" loading="lazy" />;
  }
  if (item.kind === 'video') {
    return (
      <video
        src={item.src}
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate nopictureinpicture"
        onLoadedMetadata={(event) => {
          try {
            event.currentTarget.currentTime = 0.05;
          } catch {
            // The first decoded frame remains a valid thumbnail fallback.
          }
        }}
      />
    );
  }
  return <img src={item.src} alt="" loading="lazy" />;
}

export default function BlueprintMediaGallery({
  items,
  language,
}: {
  items: ProjectMediaItem[];
  language: string;
}) {
  const safeItems = items.map(resolvedItem);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const item = safeItems[index];
  const count = safeItems.length;
  const previous = useCallback(
    () => setIndex((value) => (value - 1 + count) % count),
    [count],
  );
  const next = useCallback(
    () => setIndex((value) => (value + 1) % count),
    [count],
  );

  useEffect(() => {
    setReady(false);
  }, [index]);

  useEffect(() => {
    if (!fullscreen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
      if (event.key === 'ArrowLeft' && count > 1) previous();
      if (event.key === 'ArrowRight' && count > 1) next();
      if (event.key === 'Tab') {
        const buttons = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), video[controls], iframe',
          ) || [],
        );
        if (!buttons.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [count, fullscreen, next, previous]);

  if (!item) return null;

  const kindLabel =
    item.kind === 'video' ? 'video' : item.kind === 'youtube' ? 'video' : 'image';
  const previousLabel = language === 'tr' ? 'Önceki medya' : 'Previous media';
  const nextLabel = language === 'tr' ? 'Sonraki medya' : 'Next media';
  const fullscreenLabel = language === 'tr' ? 'TAM EKRAN' : 'FULLSCREEN';
  const standaloneYoutube = item.kind === 'youtube' && count === 1;

  return (
    <>
      <div className={`bp-media-browser ${standaloneYoutube ? 'bp-media-browser--youtube' : ''}`}>
        <div className="bp-media-browser__header">
          {standaloneYoutube ? (
            <span className="bp-media-browser__youtube-title">
              <Youtube />
              GetYouTubeVideo()
            </span>
          ) : (
            <>
              <span>
                media[{index}] · {kindLabel}
              </span>
              <span>
                {String(index + 1).padStart(2, '0')}/
                {String(count).padStart(2, '0')}
              </span>
            </>
          )}
        </div>

        <div className={`bp-media-browser__viewer ${ready ? 'is-ready' : ''}`}>
          {!ready ? <BlueprintSpinner /> : null}
          <MediaSurface item={item} onReady={() => setReady(true)} />

          {count > 1 ? (
            <>
              <button
                type="button"
                className="bp-media-browser__arrow bp-media-browser__arrow--previous"
                onClick={previous}
                aria-label={previousLabel}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="bp-media-browser__arrow bp-media-browser__arrow--next"
                onClick={next}
                aria-label={nextLabel}
              >
                <ChevronRight />
              </button>
            </>
          ) : null}

          {item.kind !== 'youtube' ? (
            <button
              type="button"
              className="bp-media-browser__fullscreen"
              onClick={() => setFullscreen(true)}
            >
              <Maximize />
              {fullscreenLabel}
            </button>
          ) : null}
        </div>

        <div className="bp-media-browser__caption">
          <span>[info]</span>
          <p>{item.alt || (language === 'tr' ? 'Proje medyası' : 'Project media')}</p>
        </div>

        {count > 1 ? (
          <div className="bp-media-browser__strip" aria-label="Project media">
            {safeItems.map((media, mediaIndex) => (
              <button
                type="button"
                key={`${media.src}-${mediaIndex}`}
                className={
                  mediaIndex === index
                    ? 'bp-media-browser__thumbnail is-active'
                    : 'bp-media-browser__thumbnail'
                }
                onClick={() => setIndex(mediaIndex)}
                aria-label={`${language === 'tr' ? 'Medyayı göster' : 'Show media'} ${mediaIndex + 1}`}
                aria-pressed={mediaIndex === index}
              >
                <MediaThumbnail item={media} />
                <span>{media.kind === 'image' ? 'IMG' : 'VID'}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {fullscreen ? (
        <div
          ref={dialogRef}
          className="bp-media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={item.alt || 'Project media'}
          onClick={() => setFullscreen(false)}
        >
          <div
            className="bp-media-lightbox__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bp-media-lightbox__header">
              <span>
                media[{index}] · {kindLabel}
              </span>
              <button
                ref={closeRef}
                type="button"
                className="bp-media-lightbox__close"
                onClick={() => setFullscreen(false)}
                aria-label={language === 'tr' ? 'Medyayı kapat' : 'Close media'}
              >
                <X />
                {language === 'tr' ? 'KAPAT (ESC)' : 'CLOSE (ESC)'}
              </button>
            </div>

            <div className="bp-media-lightbox__surface">
              <MediaSurface item={item} fullscreen />
            </div>

            <div className="bp-media-lightbox__footer">
              {count > 1 ? (
                <button
                  type="button"
                  className="bp-media-lightbox__nav"
                  onClick={previous}
                  aria-label={previousLabel}
                >
                  <ChevronLeft />
                  {language === 'tr' ? 'önceki' : 'previous'}
                </button>
              ) : (
                <span />
              )}

              <span className="bp-media-lightbox__caption">
                <strong>[info]</strong>
                <span>
                  {item.alt ||
                    (language === 'tr' ? 'Proje medyası' : 'Project media')}
                </span>
              </span>

              {count > 1 ? (
                <button
                  type="button"
                  className="bp-media-lightbox__nav"
                  onClick={next}
                  aria-label={nextLabel}
                >
                  {language === 'tr' ? 'sonraki' : 'next'}
                  <ChevronRight />
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
