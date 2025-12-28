/**
 * PDF Continuous View Component
 * Renders all pages in a scrollable container
 */

import { useEffect, useRef } from 'react';
import { PDFDocumentProxy } from '../lib/pdf-config';
import { PDFPage, SearchHighlight } from './PDFPage';

interface PDFContinuousViewProps {
  document: PDFDocumentProxy;
  totalPages: number;
  scale: number;
  rotation: number;
  currentPage: number;
  searchHighlights?: SearchHighlight[];
  showAnnotations?: boolean;
  showForms?: boolean;
  onPageChange: (page: number) => void;
}

export function PDFContinuousView({
  document,
  totalPages,
  scale,
  rotation,
  currentPage,
  searchHighlights,
  showAnnotations,
  showForms,
  onPageChange,
}: PDFContinuousViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll to current page when it changes
  useEffect(() => {
    const pageElement = pageRefs.current.get(currentPage);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Detect which page is currently visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollCenter = scrollTop + containerHeight / 2;

      // Find which page is in the center of the viewport
      for (const [pageNum, element] of pageRefs.current.entries()) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementTop = rect.top - containerRect.top + scrollTop;
        const elementBottom = elementTop + rect.height;

        if (scrollCenter >= elementTop && scrollCenter <= elementBottom) {
          if (pageNum !== currentPage) {
            onPageChange(pageNum);
          }
          break;
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage, onPageChange]);

  return (
    <div ref={containerRef} className="h-full overflow-auto bg-gray-100 p-4 dark:bg-gray-900">
      <div className="mx-auto flex flex-col gap-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <div
            key={pageNum}
            ref={(el) => {
              if (el) {
                pageRefs.current.set(pageNum, el);
              }
            }}
            className="relative"
          >
            {/* Page number indicator */}
            <div className="absolute -left-20 top-2 text-sm text-gray-500 dark:text-gray-400">
              {pageNum}
            </div>

            <PDFPage
              document={document}
              pageNumber={pageNum}
              scale={scale}
              rotation={rotation}
              searchHighlights={searchHighlights}
              showAnnotations={showAnnotations}
              showForms={showForms}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
