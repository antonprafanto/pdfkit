/**
 * PDF Thumbnail Component
 * Renders a small preview of a PDF page
 */

import { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from '../lib/pdf-config';
import { Spinner } from './ui';

interface PDFThumbnailProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}

export function PDFThumbnail({ document, pageNumber, isActive, onClick }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderThumbnail = async () => {
      if (!canvasRef.current || !document || isCancelled) return;

      try {
        setIsLoading(true);
        setError(false);

        // Cancel previous render task if exists
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (e) {
            // Ignore cancellation errors
          }
        }

        if (isCancelled || !canvasRef.current) return;

        const page = await document.getPage(pageNumber);

        // Use smaller scale for thumbnails
        const viewport = page.getViewport({ scale: 0.3 });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        
        if (!isCancelled) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') {
          return;
        }
        if (!isCancelled) {
          console.error(`Error rendering thumbnail ${pageNumber}:`, err?.message);
          setError(true);
          setIsLoading(false);
        }
      }
    };

    renderThumbnail();

    // Cleanup
    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [document, pageNumber]);

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Thumbnail preview */}
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded bg-white dark:bg-gray-800">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full object-contain"
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>

      {/* Page number */}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Page {pageNumber}
      </span>
    </button>
  );
}
