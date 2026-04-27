/**
 * PDF Facing Pages View Component
 * Renders pages side-by-side like a book
 */

import { PDFDocumentProxy } from '../lib/pdf-config';
import { PDFPage, SearchHighlight } from './PDFPage';
import { Button } from './ui';
import type { ViewMode } from '../lib/view-mode';

interface PDFFacingViewProps {
  document: PDFDocumentProxy;
  totalPages: number;
  scale: number;
  rotation: number;
  currentPage: number;
  mode: Extract<ViewMode, 'two-page' | 'book'>;
  searchHighlights?: SearchHighlight[];
  showAnnotations?: boolean;
  showForms?: boolean;
  onPageChange: (page: number) => void;
}

export function PDFFacingView({
  document,
  totalPages,
  scale,
  rotation,
  currentPage,
  mode,
  searchHighlights,
  showAnnotations,
  showForms,
  onPageChange,
}: PDFFacingViewProps) {
  const getVisiblePages = (page: number): [number | null, number | null] => {
    if (mode === 'book') {
      if (page === 1) {
        return [null, 1];
      }

      const leftPage = page % 2 === 0 ? page : page - 1;
      const rightPage = leftPage + 1;
      return [leftPage <= totalPages ? leftPage : null, rightPage <= totalPages ? rightPage : null];
    }

    const leftPage = page % 2 === 0 ? page - 1 : page;
    const rightPage = leftPage + 1;
    return [leftPage <= totalPages ? leftPage : null, rightPage <= totalPages ? rightPage : null];
  };

  const [leftPage, rightPage] = getVisiblePages(currentPage);

  const goToPreviousSpread = () => {
    if (mode === 'book') {
      if (currentPage === 1) return;
      if (currentPage === 2) {
        onPageChange(1);
      } else {
        const spreadStart = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        onPageChange(Math.max(1, spreadStart - 2));
      }
      return;
    }

    const spreadStart = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
    if (spreadStart > 1) {
      onPageChange(spreadStart - 2);
    } else {
      onPageChange(1);
    }
  };

  const goToNextSpread = () => {
    if (mode === 'book') {
      if (currentPage === 1) {
        onPageChange(2);
      } else {
        const spreadStart = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        onPageChange(Math.min(totalPages, spreadStart + 2));
      }
      return;
    } else {
      const spreadStart = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
      onPageChange(Math.min(totalPages, spreadStart + 2));
    }
  };

  const canGoPrevious = mode === 'book' ? currentPage > 1 : (currentPage % 2 === 0 ? currentPage - 1 : currentPage) > 1;
  const canGoNext =
    mode === 'book'
      ? currentPage < totalPages
      : (currentPage % 2 === 0 ? currentPage - 1 : currentPage) + 1 < totalPages;

  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
        <Button size="sm" variant="outline" onClick={goToPreviousSpread} disabled={!canGoPrevious}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous Spread
        </Button>

        <span className="text-sm text-gray-600 dark:text-gray-400">
          {leftPage && rightPage
            ? `Pages ${leftPage}-${rightPage}`
            : leftPage
              ? `Page ${leftPage}`
              : `Page ${rightPage}`}
        </span>

        <Button size="sm" variant="outline" onClick={goToNextSpread} disabled={!canGoNext}>
          Next Spread
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Pages */}
      <div className="flex flex-1 overflow-auto bg-gray-100 p-4 dark:bg-gray-900">
        <div className="m-auto flex items-center justify-center gap-4">
          {/* Left page */}
          {leftPage && (
            <div className="flex-shrink-0">
              <PDFPage
                document={document}
                pageNumber={leftPage}
                scale={scale}
                rotation={rotation}
                searchHighlights={searchHighlights}
                showAnnotations={showAnnotations}
                showForms={showForms}
              />
            </div>
          )}

          {/* Center divider */}
          {leftPage && rightPage && <div className="h-full w-px bg-gray-300 dark:bg-gray-700" />}

          {/* Right page */}
          {rightPage && (
            <div className="flex-shrink-0">
              <PDFPage
                document={document}
                pageNumber={rightPage}
                scale={scale}
                rotation={rotation}
                searchHighlights={searchHighlights}
                showAnnotations={showAnnotations}
                showForms={showForms}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
