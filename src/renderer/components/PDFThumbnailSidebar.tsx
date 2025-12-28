/**
 * PDF Thumbnail Sidebar
 * Shows thumbnails of all pages for quick navigation
 */

import { PDFDocumentProxy } from '../lib/pdf-config';
import { PDFThumbnail } from './PDFThumbnail';

interface PDFThumbnailSidebarProps {
  document: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
}

export function PDFThumbnailSidebar({
  document,
  currentPage,
  totalPages,
  onPageSelect,
}: PDFThumbnailSidebarProps) {
  return (
    <div className="h-full w-48 overflow-y-auto border-r border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        Pages
      </h3>
      <div className="space-y-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <PDFThumbnail
            key={pageNum}
            document={document}
            pageNumber={pageNum}
            isActive={pageNum === currentPage}
            onClick={() => onPageSelect(pageNum)}
          />
        ))}
      </div>
    </div>
  );
}
