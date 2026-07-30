import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronsRight } from 'lucide-react';
import type { BlueprintTone } from '../lib/blueprintProject';

const toneClasses: Record<BlueprintTone, string> = {
  function: 'bp-node-header--function',
  event: 'bp-node-header--event',
  game: 'bp-node-header--game',
  tool: 'bp-node-header--tool',
  prototype: 'bp-node-header--prototype',
  freelance: 'bp-node-header--freelance',
  jam: 'bp-node-header--jam',
};

export function BlueprintTypewriter({
  text,
  delay = 0,
  speed = 42,
  className = '',
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [started, setStarted] = useState(false);
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    setStarted(false);
    setVisibleText('');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStarted(true);
      setVisibleText(text);
      return;
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setStarted(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    if (!started || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let index = 0;
    let interval = 0;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) window.clearInterval(interval);
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [delay, speed, started, text]);

  return (
    <span
      ref={ref}
      className={`bp-typewriter ${started ? 'has-cursor' : ''} ${className}`}
      style={{ '--bp-typewriter-width': `${Math.max(1, text.length)}ch` } as CSSProperties}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{visibleText}</span>
    </span>
  );
}

export function BlueprintNodeHeader({
  children,
  tone = 'function',
  aside,
  className = '',
}: {
  children: ReactNode;
  tone?: BlueprintTone;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bp-node-header ${toneClasses[tone]} ${className}`}>
      <span className="min-w-0 truncate">{children}</span>
      {aside ? <span className="bp-node-header__aside">{aside}</span> : null}
    </div>
  );
}

export function BlueprintSectionTitle({
  code,
  comment,
  pinColor = '#6fa8c9',
  className = '',
  typeCode = false,
}: {
  code: string;
  comment: string;
  pinColor?: string;
  className?: string;
  typeCode?: boolean;
}) {
  return (
    <div className={`bp-section-title ${className}`}>
      <span className="bp-pin" style={{ backgroundColor: pinColor }} />
      {typeCode ? <BlueprintTypewriter text={code} speed={38} /> : <span>{code}</span>}
      <span className="bp-comment">// {comment}</span>
      <span className="bp-section-title__line" />
    </div>
  );
}

export function BlueprintChevron({ className = '' }: { className?: string }) {
  return <ChevronsRight className={className} aria-hidden="true" />;
}

export function BlueprintSpinner() {
  return (
    <span className="bp-media-spinner" role="status" aria-label="Compiling">
      <span className="bp-media-spinner__ring" aria-hidden="true" />
      <span className="bp-media-spinner__label" aria-hidden="true">
        compiling...
      </span>
    </span>
  );
}

export function BlueprintMedia({
  image,
  video,
  alt,
  autoPlay = false,
  className = '',
  eager = false,
}: {
  image?: string;
  video?: string;
  alt: string;
  autoPlay?: boolean;
  className?: string;
  eager?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showVideo = Boolean(video && !videoFailed);
  const showImage = Boolean((!video || videoFailed) && image && !imageFailed);
  const failed = !showVideo && !showImage;

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !showVideo) return;

    let disposed = false;
    element.muted = true;
    element.defaultMuted = true;
    element.volume = 0;
    element.loop = autoPlay;

    const syncPlayback = () => {
      if (disposed) return;
      if (!autoPlay || document.visibilityState === 'hidden') {
        element.pause();
        if (!autoPlay) {
          try {
            element.currentTime = 0;
          } catch {
            // Metadata may not be available yet.
          }
        }
        return;
      }
      void element.play().catch(() => {
        // A later canplay/visibility event retries playback.
      });
    };

    syncPlayback();
    element.addEventListener('canplay', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    const playbackGuard = window.setInterval(syncPlayback, 400);

    return () => {
      disposed = true;
      window.clearInterval(playbackGuard);
      element.removeEventListener('canplay', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      element.pause();
    };
  }, [autoPlay, showVideo, video]);

  return (
    <div className={`bp-media ${className}`}>
      {!ready && !failed ? <BlueprintSpinner /> : null}
      {showVideo ? (
        <video
          ref={videoRef}
          src={video}
          poster={image}
          muted
          autoPlay={autoPlay}
          loop={autoPlay}
          playsInline
          preload={autoPlay || eager ? 'auto' : 'metadata'}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate nopictureinpicture"
          onLoadedData={(event) => {
            event.currentTarget.defaultMuted = true;
            event.currentTarget.volume = 0;
            setReady(true);
          }}
          onCanPlay={(event) => {
            event.currentTarget.muted = true;
            event.currentTarget.defaultMuted = true;
            event.currentTarget.volume = 0;
            setReady(true);
            if (autoPlay && document.visibilityState !== 'hidden') {
              void event.currentTarget.play().catch(() => {});
            }
          }}
          onPlay={() => setReady(true)}
          onError={() => {
            setReady(false);
            setVideoFailed(true);
          }}
          className={ready ? 'is-ready' : ''}
        />
      ) : showImage ? (
        <img
          src={image}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setReady(true)}
          onError={() => setImageFailed(true)}
          className={ready ? 'is-ready' : ''}
        />
      ) : null}
      {failed ? (
        <div className="bp-media-fallback" role="img" aria-label={alt}>
          <span>media::unavailable</span>
        </div>
      ) : null}
    </div>
  );
}
