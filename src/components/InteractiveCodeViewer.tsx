import { useEffect, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, Info } from 'lucide-react';
import { CodeSnippet, CodeAnnotation } from '../types/portfolio';
import RichText from './RichText';
import { useSiteRuntime } from '../lib/siteRuntime';
import type { LocalizedString } from '../types/i18n';

const uiClickForDetails: LocalizedString = { en: 'Click for details', tr: 'Detaylar için tıkla' };
const uiLine: LocalizedString = { en: 'Line', tr: 'Satır' };
const uiDetailedExplanation: LocalizedString = { en: 'Detailed explanation', tr: 'Detaylı açıklama' };

interface InteractiveCodeViewerProps {
  snippet: CodeSnippet;
  annotations: CodeAnnotation[];
  hideHeader?: boolean;
}

export default function InteractiveCodeViewer({ snippet, annotations, hideHeader = false }: InteractiveCodeViewerProps) {
  const { t } = useSiteRuntime();
  const [hoveredAnnotation, setHoveredAnnotation] = useState<CodeAnnotation | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<CodeAnnotation | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const inlineCode = useMemo(() => (t(snippet.code) || '').trim(), [snippet.code, t]);
  const snippetTitle = useMemo(() => (t(snippet.title) || '').trim(), [snippet.title, t]);
  const snippetDescription = useMemo(() => (t(snippet.description) || '').trim(), [snippet.description, t]);

  const [loadedCode, setLoadedCode] = useState<string | null>(inlineCode || null);

  useEffect(() => {
    let didCancel = false;
    const load = async () => {
      if (inlineCode) {
        setLoadedCode(inlineCode);
        return;
      }

      if (snippet.code_path) {
        try {
          const res = await fetch(snippet.code_path);
          if (!res.ok) throw new Error('Failed to fetch code file');
          const text = await res.text();
          if (!didCancel) setLoadedCode(text);
        } catch (err) {
          console.error('Error loading code from path', snippet.code_path, err);
        }
      }
    };
    load();
    return () => {
      didCancel = true;
    };
  }, [inlineCode, snippet.code_path]);

  useEffect(() => {
    setHoveredAnnotation(null);
    setSelectedAnnotation(null);
  }, [snippet.id]);

  const handleLineHover = (lineIndex: number, event: React.MouseEvent) => {
    const lineAnnotations = annotations.filter((a) => a.line_number === lineIndex + 1);

    if (lineAnnotations.length > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left,
        y: rect.top - 10,
      });
      setHoveredAnnotation(lineAnnotations[0]);
    }
  };

  const handleLineLeave = () => {
    setHoveredAnnotation(null);
  };

  const handleLineClick = (lineIndex: number) => {
    const lineAnnotations = annotations.filter((a) => a.line_number === lineIndex + 1);
    if (lineAnnotations.length > 0) {
      setSelectedAnnotation(lineAnnotations[0]);
    }
  };

  const getLineClassName = (lineIndex: number): string => {
    const hasAnnotation = annotations.some((a) => a.line_number === lineIndex + 1);
    return hasAnnotation ? 'cursor-pointer hover:bg-[#f9b234]/10 hover:border-l-2 hover:border-[#f9b234] pl-2 transition-all' : '';
  };

  return (
    <div className="relative">
      <div className="bg-[#0f172a]/90 rounded-2xl overflow-hidden border border-white/5 shadow-lg shadow-black/20 max-h-[75vh] flex flex-col">
        {!hideHeader && (
          <>
            <div className="bg-[#101a2f]/90 px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3be3ff]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f9b234]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white/60"></div>
                </div>
                <span className="text-slate-200 text-sm font-semibold tracking-tight">{snippetTitle || snippet.id}</span>
              </div>
              <span className="text-xs text-slate-100 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {snippet.language.toUpperCase()}
              </span>
            </div>

            {snippetDescription && (
              <div className="px-6 py-3 bg-[#3be3ff]/5 border-b border-white/5">
                <p className="text-sm text-slate-200">{snippetDescription}</p>
              </div>
            )}
          </>
        )}

        <div className="relative overflow-hidden flex-1">
          <div className="relative max-h-[60vh] overflow-auto">
            <SyntaxHighlighter
              language={snippet.language}
              style={vscDarkPlus}
              showLineNumbers
              wrapLines
              lineProps={(lineNumber) => ({
                className: getLineClassName(lineNumber - 1),
                onMouseEnter: (e: React.MouseEvent) => handleLineHover(lineNumber - 1, e),
                onMouseLeave: handleLineLeave,
                onClick: () => handleLineClick(lineNumber - 1),
              })}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: 'transparent',
                fontSize: '0.875rem',
                borderLeft: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              {loadedCode || inlineCode || ''}
            </SyntaxHighlighter>
          </div>

          {hoveredAnnotation && !selectedAnnotation && (
            <div
              className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: 'translateY(-100%)',
              }}
            >
              <div className="bg-[#0f172a] border border-[#f9b234]/40 rounded-lg shadow-2xl p-4 max-w-sm backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#f9b234] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{t(hoveredAnnotation.tooltip_title)}</h4>
                    <RichText text={t(hoveredAnnotation.tooltip_content)} size="small" />
                    <p className="text-xs text-[#3be3ff] mt-2">{t(uiClickForDetails)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedAnnotation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs font-semibold bg-[#f9b234]/15 text-[#f9b234] rounded">
                    {selectedAnnotation.detail_type}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{t(selectedAnnotation.tooltip_title)}</h3>
                </div>
                <p className="text-sm text-slate-300">
                  {t(uiLine)} {selectedAnnotation.line_number}
                </p>
              </div>
              <button onClick={() => setSelectedAnnotation(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-200" />
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-invert max-w-none">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
                  <RichText text={t(selectedAnnotation.tooltip_content)} />
                </div>
                {(t(selectedAnnotation.detail_content) || '').trim() && (
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-white">{t(uiDetailedExplanation)}</h4>
                    <RichText text={t(selectedAnnotation.detail_content)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
