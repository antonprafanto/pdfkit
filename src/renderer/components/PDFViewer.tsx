/**
 * PDF Viewer Component
 * Main container for PDF viewing with all controls and features
 */

import { useState, useRef } from 'react';
import { PDFPage } from './PDFPage';
import { PDFThumbnailSidebar } from './PDFThumbnailSidebar';
import { PDFContinuousView } from './PDFContinuousView';
import { PDFFacingView } from './PDFFacingView';
import { PDFSearchBar } from './PDFSearchBar';
import { PDFPropertiesDialog } from './PDFPropertiesDialog';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { SearchHighlight } from './PDFPage';
import { AnnotationToolbar, AnnotationListSidebar } from './annotations';
import { FormToolbar } from './forms';
import { usePDFStore } from '../store/pdf-store';
import { useViewportSize } from '../hooks/useViewportSize';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Button, Spinner, DropdownMenu } from './ui';

interface PDFViewerProps {
  onOpenMerge?: () => void;
  onOpenSplit?: () => void;
  onOpenDelete?: () => void;
  onOpenRotate?: () => void;
  onOpenReorder?: () => void;
  onOpenExtract?: () => void;
  onOpenDuplicate?: () => void;
  onOpenExportImages?: () => void;
  onOpenImportImages?: () => void;
  onOpenConvertOffice?: () => void;
  onOpenEncryptPDF?: () => void;
  onOpenBulkEncrypt?: () => void;
  onOpenWatermark?: () => void;
  onOpenSignatures?: () => void;
  onOpenSignPDF?: () => void;
  onOpenFile?: () => void;
  onOpenRecent?: () => void;
  onCloseDocument?: () => void;
  onDetectForms?: () => void;
  onExportFormData?: () => void;
  onImportFormData?: () => void;
  onSaveFilledPDF?: () => void;
  onSaveTemplate?: () => void; // NEW: Save PDF with fields structure
  onToggleFormsEditMode?: () => void;
  isDetectingForms?: boolean;
  isSavingTemplate?: boolean; // NEW: Loading state
}

export function PDFViewer({
  onOpenMerge,
  onOpenSplit,
  onOpenDelete,
  onOpenRotate,
  onOpenReorder,
  onOpenExtract,
  onOpenDuplicate,
  onOpenExportImages,
  onOpenImportImages,
  onOpenConvertOffice,
  onOpenEncryptPDF,
  onOpenBulkEncrypt,
  onOpenWatermark,
  onOpenSignatures,
  onOpenSignPDF,
  onOpenFile,
  onOpenRecent,
  onCloseDocument,
  onDetectForms,
  onExportFormData,
  onImportFormData,
  onSaveFilledPDF,
  onSaveTemplate,
  onToggleFormsEditMode,
  isDetectingForms = false,
  isSavingTemplate = false,
}: PDFViewerProps = {}) {
  const {
    document,
    currentPage,
    totalPages,
    scale,
    rotation,
    isLoading,
    error,
    fileName,
    metadata,
    viewMode,
    nextPage,
    previousPage,
    goToPage,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth,
    fitToPage,
    rotateClockwise,
    rotateCounterClockwise,
    setViewMode,
  } = usePDFStore();

  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [searchHighlights, setSearchHighlights] = useState<SearchHighlight[]>([]);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [formsMode, setFormsMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const viewportSize = useViewportSize(contentRef);

  // Handle fit to width/page when document or viewport changes
  const handleFitToWidth = async () => {
    if (!document || !contentRef.current) return;

    const page = await document.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1, rotation });
    const pageWidth = viewport.width;

    fitToWidth(viewportSize.width, pageWidth);
  };

  const handleFitToPage = async () => {
    if (!document || !contentRef.current) return;

    const page = await document.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1, rotation });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    fitToPage(viewportSize.width, viewportSize.height, pageWidth, pageHeight);
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNextPage: nextPage,
    onPreviousPage: previousPage,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    onFitToWidth: handleFitToWidth,
    onFitToPage: handleFitToPage,
    onRotateClockwise: rotateClockwise,
    onRotateCounterClockwise: rotateCounterClockwise,
    onToggleSearch: () => setShowSearch(!showSearch),
    onFirstPage: () => goToPage(1),
    onLastPage: () => goToPage(totalPages),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading PDF</h3>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <svg className="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No PDF Opened</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Open a PDF file to get started</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* New Compact Toolbar */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        {/* Left Section: File info + Menus */}
        <div className="flex items-center gap-3">
          {/* PDF Icon + Filename */}
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
              {fileName || 'Document.pdf'}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* File Menu */}
          <DropdownMenu
            trigger={
              <>
                File
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            }
            items={[
              {
                label: 'Open PDF',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
                onClick: () => onOpenFile?.(),
              },
              {
                label: 'Recent Files',  
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                onClick: () => onOpenRecent?.(),
              },
              {
                label: 'Close Document',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
                onClick: () => onCloseDocument?.(),
                disabled: !document,
                separator: true,
              },
            ]}
          />

          {/* Tools Menu */}
          <DropdownMenu
            trigger={
              <>
                Tools
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            }
            items={[
              {
                label: 'Merge PDFs',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
                onClick: () => onOpenMerge?.(),
              },
              {
                label: 'Split PDF',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>,
                onClick: () => onOpenSplit?.(),
                disabled: !document,
              },
              {
                label: 'Export as Images',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                onClick: () => onOpenExportImages?.(),
                disabled: !document,
                separator: true,
              },
              {
                label: 'Import from Images',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
                onClick: () => onOpenImportImages?.(),
              },
              {
                label: 'Office to PDF',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                onClick: () => onOpenConvertOffice?.(),
                separator: true,
              },
              {
                label: 'Encrypt PDF',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
                onClick: () => onOpenEncryptPDF?.(),
                disabled: !document,
              },
              {
                label: 'Bulk Encrypt',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
                onClick: () => onOpenBulkEncrypt?.(),
                separator: true,
              },
              {
                label: 'Add Watermark',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
                onClick: () => onOpenWatermark?.(),
                disabled: !document,
              },
              {
                label: 'View Signatures',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                onClick: () => onOpenSignatures?.(),
                disabled: !document,
              },
              {
                label: 'Sign PDF',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
                onClick: () => onOpenSignPDF?.(),
                disabled: !document,
                separator: true,
              },
              {
                label: 'Delete Pages',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
                onClick: () => onOpenDelete?.(),
                disabled: !document,
                separator: true,
              },
              {
                label: 'Rotate Pages',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
                onClick: () => onOpenRotate?.(),
                disabled: !document,
              },
              {
                label: 'Reorder Pages',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
                onClick: () => onOpenReorder?.(),
                disabled: !document,
              },
              {
                label: 'Extract Pages',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
                onClick: () => onOpenExtract?.(),
                disabled: !document,
              },
              {
                label: 'Duplicate Page',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                onClick: () => onOpenDuplicate?.(),
                disabled: !document,
              },
            ]}
          />

          {/* View Menu */}
          <DropdownMenu
            trigger={
              <>
                View
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            }
            items={[
              {
                label: 'Single Page',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="16" strokeWidth={2} /></svg>,
                onClick: () => setViewMode('single'),
              },
              {
                label: 'Continuous Scroll',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
                onClick: () => setViewMode('continuous'),
              },
              {
                label: 'Facing Pages',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="16" strokeWidth={2} /><rect x="13" y="4" width="7" height="16" strokeWidth={2} /></svg>,
                onClick: () => setViewMode('facing'),
              },
              {
                label: showThumbnails ? 'Hide Thumbnails' : 'Show Thumbnails',
                icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
                onClick: () => setShowThumbnails(!showThumbnails),
                separator: true,
              },
            ]}
          />
        </div>

        {/* Center Section: Page Navigation */}
        <div className="flex flex-1 items-center justify-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(1)}
            disabled={currentPage <= 1}
            title="First Page (Home)"
            className="px-2"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={previousPage} disabled={currentPage <= 1} title="Previous Page" className="px-2">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Button>
          <div className="flex items-center gap-1.5 mx-1">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="w-14 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">/ {totalPages}</span>
          </div>
          <Button size="sm" variant="outline" onClick={nextPage} disabled={currentPage >= totalPages} title="Next Page" className="px-2">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last Page (End)"
            className="px-2"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Right Section: Zoom, Rotation, Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button size="sm" variant="outline" onClick={zoomOut} disabled={scale <= 0.25} title="Zoom Out">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          </Button>
          <span className="min-w-[3.5rem] text-center text-sm text-gray-600 dark:text-gray-400">{Math.round(scale * 100)}%</span>
          <Button size="sm" variant="outline" onClick={zoomIn} disabled={scale >= 5.0} title="Zoom In">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </Button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Rotation */}
          <Button size="sm" variant="outline" onClick={rotateCounterClockwise} title="Rotate Left">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </Button>
          <Button size="sm" variant="outline" onClick={rotateClockwise} title="Rotate Right">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
          </Button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Quick Actions */}
          <Button size="sm" variant="outline" onClick={() => setShowSearch(!showSearch)} title="Search">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowProperties(true)} title="Properties">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </Button>
          <Button
            size="sm"
            variant={annotationMode ? 'primary' : 'outline'}
            onClick={() => setAnnotationMode(!annotationMode)}
            title="Annotation Mode"
            className={annotationMode ? 'bg-purple-500 hover:bg-purple-600' : ''}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
          </Button>
          <Button
            size="sm"
            variant={formsMode ? 'primary' : 'outline'}
            onClick={() => setFormsMode(!formsMode)}
            title="Forms Mode"
            className={formsMode ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <PDFSearchBar
          document={document}
          scale={scale}
          rotation={rotation}
          onResultSelect={goToPage}
          onHighlightsChange={setSearchHighlights}
        />
      )}

      {/* Annotation Toolbar */}
      {annotationMode && <AnnotationToolbar />}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <PDFThumbnailSidebar
            document={document}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageSelect={goToPage}
          />
        )}

        {/* Annotation List Sidebar */}
        {annotationMode && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <AnnotationListSidebar onNavigateToPage={goToPage} />
          </div>
        )}

        {/* Forms Toolbar Sidebar */}
        {formsMode && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <FormToolbar
              onDetectForms={onDetectForms || (() => {})}
              onExportData={onExportFormData || (() => {})}
              onImportData={onImportFormData || (() => {})}
              onSaveFilled={onSaveFilledPDF || (() => {})}
              onSaveTemplate={onSaveTemplate || (() => {})}
              onToggleEditMode={onToggleFormsEditMode || (() => {})}
              isDetecting={isDetectingForms}
              isSavingTemplate={isSavingTemplate}
            />
          </div>
        )}

        {/* PDF Content - Different view modes */}
        {viewMode === 'single' && (
          <div ref={contentRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
            <div className="min-h-full flex items-center justify-center p-4">
              <PDFPage
                document={document}
                pageNumber={currentPage}
                scale={scale}
                rotation={rotation}
                searchHighlights={searchHighlights}
                showAnnotations={annotationMode}
                showForms={formsMode}
              />
            </div>
          </div>
        )}

        {viewMode === 'continuous' && (
          <div ref={contentRef} className="flex-1">
            <PDFContinuousView
              document={document}
              totalPages={totalPages}
              scale={scale}
              rotation={rotation}
              currentPage={currentPage}
              searchHighlights={searchHighlights}
              showAnnotations={annotationMode}
              showForms={formsMode}
              onPageChange={goToPage}
            />
          </div>
        )}

        {viewMode === 'facing' && (
          <div ref={contentRef} className="flex-1">
            <PDFFacingView
              document={document}
              totalPages={totalPages}
              scale={scale}
              rotation={rotation}
              currentPage={currentPage}
              searchHighlights={searchHighlights}
              showAnnotations={annotationMode}
              showForms={formsMode}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Properties Dialog */}
      <PDFPropertiesDialog
        open={showProperties}
        onClose={() => setShowProperties(false)}
        document={document}
        metadata={metadata}
        fileName={fileName}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}
