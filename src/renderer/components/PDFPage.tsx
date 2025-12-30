/**
 * PDF Page Component
 * Renders a single PDF page using canvas
 */

import { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy, PDFPageProxy } from '../lib/pdf-config';
import { Spinner } from './ui';
import { AnnotationOverlay } from './annotations';
import { FormFieldOverlay } from './forms/FormFieldOverlay';
import { FormFieldEditor } from './forms/FormFieldEditor';
import { useFormsStore } from '../store/forms-store';

export interface SearchHighlight {
  pageNumber: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

interface PDFPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  searchHighlights?: SearchHighlight[];
  onPageLoad?: (page: PDFPageProxy) => void;
  showAnnotations?: boolean;
  showForms?: boolean;
}

export function PDFPage({ document, pageNumber, scale, rotation, searchHighlights, onPageLoad, showAnnotations = false, showForms = false }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Forms store
  const { fields, editMode } = useFormsStore();

  // Get highlights for current page
  const currentPageHighlights = searchHighlights?.filter(h => h.pageNumber === pageNumber) || [];

  useEffect(() => {
    let isCancelled = false;
    
    const renderPage = async () => {
      if (!canvasRef.current || !document || isCancelled) return;

      try {
        setIsRendering(true);
        setError(null);

        // Cancel previous render task if exists and wait for cancellation
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
            // Wait for cancellation to complete
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (e) {
            // Ignore cancellation errors
          }
        }

        // Check again if component was unmounted during cancellation wait
        if (isCancelled || !canvasRef.current) return;

        // Get the page
        const page = await document.getPage(pageNumber);

        // Callback when page loads
        onPageLoad?.(page);

        // Get viewport with scale and rotation
        const pageViewport = page.getViewport({ scale, rotation });
        setViewport(pageViewport);

        // Setup canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        // Get device pixel ratio for crisp rendering on HD displays
        const pixelRatio = window.devicePixelRatio || 1;

        // Set canvas dimensions accounting for pixel ratio
        canvas.width = Math.floor(pageViewport.width * pixelRatio);
        canvas.height = Math.floor(pageViewport.height * pixelRatio);

        // Scale down canvas display size
        canvas.style.width = `${pageViewport.width}px`;
        canvas.style.height = `${pageViewport.height}px`;

        // Scale context to match pixel ratio
        context.scale(pixelRatio, pixelRatio);

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: pageViewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') {
          // Render was cancelled, ignore
          return;
        }
        if (!isCancelled) {
          console.error('Error rendering page:', pageNumber, err?.message);
          setError(`Failed to render page: ${err?.message || 'Unknown error'}`);
          setIsRendering(false);
        }
      }
    };

    renderPage();

    // Cleanup
    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
      }
    };
  }, [document, pageNumber, scale, rotation, onPageLoad]);

  return (
    <div className="relative bg-white">
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="shadow-lg"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'inline-block',
        }}
      />

      {/* Search highlights overlay */}
      {viewport && currentPageHighlights.length > 0 && (
        <svg
          className="absolute left-0 top-0 pointer-events-none"
          width={viewport.width}
          height={viewport.height}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        >
          {currentPageHighlights.map((highlight, index) =>
            highlight.rects.map((rect, rectIndex) => (
              <rect
                key={`${index}-${rectIndex}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="rgba(255, 235, 59, 0.4)"
                stroke="rgba(255, 193, 7, 0.8)"
                strokeWidth="1"
              />
            ))
          )}
        </svg>
      )}

      {/* Annotation overlay */}
      {showAnnotations && viewport && (
        <AnnotationOverlay
          pageNumber={pageNumber}
          width={viewport.width}
          height={viewport.height}
          scale={scale}
        />
      )}

      {/* Form fields overlay */}
      {showForms && viewport && (
        <FormFieldOverlay
          fields={fields}
          pageNumber={pageNumber}
          scale={scale}
          rotation={rotation}
        />
      )}

      {/* Form field editor (click-to-place) */}
      {editMode && viewport && (
        <FormFieldEditor
          pageNumber={pageNumber}
          scale={scale}
        />
      )}
    </div>
  );
}
