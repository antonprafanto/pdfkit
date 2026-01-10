/**
 * PDF Viewer Component
 * Main container for PDF viewing with all controls and features
 */

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { ChatWithPDFPanel } from './ai/ChatWithPDFPanel';
import { DocumentAnalysisPanel } from './ai/DocumentAnalysisPanel';
import { usePDFStore } from '../store/pdf-store';
import { useViewportSize } from '../hooks/useViewportSize';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Spinner } from './ui';
import { useToast } from './ui/Toast';
import { useTranslation } from 'react-i18next';
import RibbonToolbar from './RibbonToolbar';

interface PDFViewerProps {
  onOpenMerge?: () => void;
  onOpenSplit?: () => void;
  onOpenDelete?: () => void;
  onOpenRotate?: () => void;
  onOpenReorder?: () => void;
  onOpenExtract?: () => void;
  onOpenExtractImages?: () => void;
  onOpenDuplicate?: () => void;
  onOpenExportImages?: () => void;
  onOpenImportImages?: () => void;
  onOpenConvertOffice?: () => void;
  onOpenEncryptPDF?: () => void;
  onOpenBulkEncrypt?: () => void;
  onOpenWatermark?: () => void;
  onOpenAddPageNumbers?: () => void;
  onOpenSignatures?: () => void;
  onOpenSignPDF?: () => void;
  onOpenUnlockPDF?: () => void;
  onOpenWebOptimize?: () => void;
  onOpenOverlay?: () => void;
  onOpenWebpageToPDF?: () => void;
  onOpenOCR?: () => void;
  onOpenCompress?: () => void;
  onOpenBatch?: () => void;
  onOpenPluginManager?: () => void;
  onConvert?: () => void; // PDF to Word/Excel conversion
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
  // Header actions - integrated into ribbon
  onSettings?: () => void;
  onAbout?: () => void;
  onShare?: () => void;
  onSearchTools?: () => void; // Open tool search dialog
  onCheckUpdates?: () => void;
  themeToggle?: React.ReactNode;
  isOnline?: boolean;
}

export function PDFViewer({
  onOpenMerge,
  onOpenSplit,
  onOpenDelete,
  onOpenRotate,
  onOpenReorder,
  onOpenExtract,
  onOpenExtractImages,
  onOpenDuplicate,
  onOpenExportImages,
  onOpenImportImages,
  onOpenConvertOffice,
  onOpenEncryptPDF,
  onOpenBulkEncrypt,
  onOpenWatermark,
  onOpenAddPageNumbers,
  onOpenSignatures,
  onOpenSignPDF,
  onOpenUnlockPDF,
  onOpenWebOptimize,
  onOpenOverlay,
  onOpenWebpageToPDF,
  onOpenOCR,
  onOpenCompress,
  onOpenBatch,
  onOpenFile,
  onOpenRecent,
  onCloseDocument,
  onDetectForms,
  onExportFormData,
  onImportFormData,
  onSaveFilledPDF,
  onSaveTemplate,
  onToggleFormsEditMode,
  onOpenPluginManager,
  onConvert,
  isDetectingForms = false,
  isSavingTemplate = false,
  // Header actions
  onSettings,
  onAbout,
  onShare,
  onSearchTools,
  onCheckUpdates,
  themeToggle,
  isOnline,
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
    filePath,
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

  const toast = useToast();
  const { t } = useTranslation();

  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [searchHighlights, setSearchHighlights] = useState<SearchHighlight[]>([]);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [formsMode, setFormsMode] = useState(false);
  const [aiMode, setAIMode] = useState(false);
  const [aiPanel, setAIPanel] = useState<'chat' | 'analysis'>('chat');
  const [scanPdfNotified, setScanPdfNotified] = useState(false); // Track if we've shown scan PDF notification
  const contentRef = useRef<HTMLDivElement>(null);
  const viewportSize = useViewportSize(contentRef);
  
  // Reset scan notification when document changes
  useEffect(() => {
    setScanPdfNotified(false);
  }, [document]);
  
  // Handler for PDFs without selectable text (scanned PDFs)
  const handleNoTextContent = () => {
    if (!scanPdfNotified) {
      setScanPdfNotified(true);
      // Show toast-style notification (using alert for now)
      setTimeout(() => {
        alert('Dokumen ini sepertinya hasil scan. Text selection tidak tersedia.\n\nGunakan fitur OCR untuk mengekstrak text dari dokumen scan.');
      }, 100);
    }
  };
  
  // Ctrl+F keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Ctrl+F to toggle search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Handle print - opens PDF with system default app for proper preview
  const handlePrint = useCallback(async () => {
    if (!document) return;
    try {
      // Show loading info with i18n (no auto-close, user must close manually)
      toast.addToast(t('print.preparing'), {
        description: t('print.preparingDescription'),
        variant: 'info',
        duration: 0  // 0 = no auto-close
      });

      // Get PDF bytes from document
      const data = await document.getData();
      console.log('[PDFViewer] Got PDF data, size:', data.length);

      // Add delay (2 seconds) so user can read the notification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Convert to regular array for IPC serialization
      const result = await window.electronAPI.printPDF({
        pdfBytes: Array.from(data) as unknown as Uint8Array,
        fileName: fileName || 'document.pdf',
        pdfPath: filePath || undefined
      });

      console.log('[PDFViewer] printPDF result:', result);

      if (result.success) {
        // Show success message explaining what happened with i18n (no auto-close)
        toast.addToast(t('print.opened'), {
          description: t('print.openedDescription'),
          variant: 'success',
          duration: 0  // 0 = no auto-close, user must click X
        });
      } else {
        toast.addToast(t('print.failed'), {
          description: result.error || t('errors.unknownError'),
          variant: 'error',
          duration: 0  // 0 = no auto-close
        });
      }
    } catch (err) {
      console.error('[PDFViewer] Print error:', err);
      toast.addToast(t('print.failed'), {
        description: t('print.failedDescription'),
        variant: 'error',
        duration: 0  // 0 = no auto-close
      });
    }
  }, [document, fileName, filePath, toast, t]);

  // Listen for print trigger from main process (Menu Ctrl+P accelerator)
  useEffect(() => {
    // Safety check - onTriggerPrint may not exist if preload hasn't been reloaded
    if (typeof window.electronAPI?.onTriggerPrint !== 'function') {
      console.warn('[PDFViewer] onTriggerPrint not available yet');
      return;
    }
    console.log('[PDFViewer] Setting up trigger-print listener');
    const unsubscribe = window.electronAPI.onTriggerPrint(() => {
      console.log('[PDFViewer] Received trigger-print from main process');
      handlePrint();
    });
    return () => unsubscribe();
  }, [handlePrint]);

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
    onPrint: handlePrint, // Add print handler for Ctrl+P
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
      {/* Ribbon Toolbar */}
      <RibbonToolbar
        onOpenFile={onOpenFile}
        onOpenRecent={onOpenRecent}
        onCloseDocument={onCloseDocument}
        currentPage={currentPage}
        totalPages={totalPages}
        onGoToPage={goToPage}
        onPreviousPage={previousPage}
        onNextPage={nextPage}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => setShowThumbnails(!showThumbnails)}
        onRotateClockwise={rotateClockwise}
        onRotateCounterClockwise={rotateCounterClockwise}
        annotationMode={annotationMode}
        onToggleAnnotationMode={() => setAnnotationMode(!annotationMode)}
        formsMode={formsMode}
        onToggleFormsMode={() => setFormsMode(!formsMode)}
        aiMode={aiMode}
        onToggleAIMode={() => setAIMode(!aiMode)}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onShowProperties={() => setShowProperties(true)}
        onOpenMerge={onOpenMerge}
        onOpenSplit={onOpenSplit}
        onOpenRotate={onOpenRotate}
        onOpenDelete={onOpenDelete}
        onOpenReorder={onOpenReorder}
        onOpenExtract={onOpenExtract}
        onOpenExtractImages={onOpenExtractImages}
        onOpenDuplicate={onOpenDuplicate}
        onOpenExportImages={onOpenExportImages}
        onOpenImportImages={onOpenImportImages}
        onOpenConvertOffice={onOpenConvertOffice}
        onOpenEncryptPDF={onOpenEncryptPDF}
        onOpenBulkEncrypt={onOpenBulkEncrypt}
        onOpenWatermark={onOpenWatermark}
        onOpenAddPageNumbers={onOpenAddPageNumbers}
        onOpenSignatures={onOpenSignatures}
        onOpenSignPDF={onOpenSignPDF}
        onOpenUnlockPDF={onOpenUnlockPDF}
        onOpenWebOptimize={onOpenWebOptimize}
        onOpenOverlay={onOpenOverlay}
        onOpenWebpageToPDF={onOpenWebpageToPDF}
        onOpenOCR={onOpenOCR}
        onOpenCompress={onOpenCompress}
        onOpenBatch={onOpenBatch}
        onOpenPluginManager={onOpenPluginManager}
        onConvert={onConvert}
        hasDocument={!!document}
        filePath={filePath || undefined}
        fileName={fileName || undefined}
        onPrint={handlePrint}
        onSettings={onSettings}
        onAbout={onAbout}
        onShare={onShare}
        onSearchTools={onSearchTools}
        onCheckUpdates={onCheckUpdates}
        themeToggle={themeToggle}
        isOnline={isOnline}
      />

      {/* Annotation Toolbar */}
      {annotationMode && <AnnotationToolbar />}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <PDFThumbnailSidebar
            document={document}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageSelect={goToPage}
          />
        )}

        {/* Floating Search Bar - positioned in content area */}
        {showSearch && (
          <PDFSearchBar
            document={document}
            scale={scale}
            rotation={rotation}
            onResultSelect={goToPage}
            onHighlightsChange={setSearchHighlights}
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

        {/* AI Panel Sidebar */}
        {aiMode && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
            {/* AI Panel Tab Selector */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setAIPanel('chat')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${aiPanel === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setAIPanel('analysis')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${aiPanel === 'analysis' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📊 Analysis
              </button>
            </div>
            {/* AI Panel Content */}
            <div className="flex-1 overflow-hidden">
              {aiPanel === 'chat' && (
                <ChatWithPDFPanel
                  pdfDocument={document}
                  documentId={fileName || 'document'}
                  onPageClick={goToPage}
                />
              )}
              {aiPanel === 'analysis' && (
                <DocumentAnalysisPanel
                  pdfDocument={document}
                  documentId={fileName || 'document'}
                />
              )}
            </div>
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
                onNoTextContent={handleNoTextContent}
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
              onNoTextContent={handleNoTextContent}
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
