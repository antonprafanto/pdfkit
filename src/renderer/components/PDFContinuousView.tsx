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
  onNoTextContent?: () => void;
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
  onNoTextContent,
}: PDFContinuousViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  // Track if we're doing a programmatic scroll (from thumbnail click or navigation)
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track the last page we scrolled to programmatically
  const lastProgrammaticPageRef = useRef<number>(currentPage);

  // Scroll to current page when it changes (from thumbnail click or navigation)
  useEffect(() => {
    const pageElement = pageRefs.current.get(currentPage);
    const container = containerRef.current;

    if (pageElement && container) {
      // Only scroll if the page actually changed from outside (not from scroll detection)
      if (lastProgrammaticPageRef.current !== currentPage) {
        // Mark that we're doing a programmatic scroll
        isProgrammaticScrollRef.current = true;
        lastProgrammaticPageRef.current = currentPage;

        // Use exact calculation to prevent scrollIntoView from scrolling the outer document body
        const containerRect = container.getBoundingClientRect();
        const elementRect = pageElement.getBoundingClientRect();
        const scrollTop = container.scrollTop + elementRect.top - containerRect.top;

        container.scrollTo({ top: scrollTop, behavior: 'smooth' });

        // Clear the flag after scroll animation completes
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500); // Give enough time for smooth scroll to complete
      }
    }
  }, [currentPage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Detect which page is currently visible (only when user scrolls manually)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Skip if this is a programmatic scroll (from thumbnail click or navigation)
      if (isProgrammaticScrollRef.current) {
        return;
      }

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
            // Update the last programmatic page to prevent re-scroll
            lastProgrammaticPageRef.current = pageNum;
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
      <div className="mx-auto flex flex-col gap-4 items-center">
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
              onNoTextContent={pageNum === 1 ? onNoTextContent : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
