import { useEffect, useState, useRef } from 'react';
import { ConnectivityIndicator } from './components/ConnectivityIndicator';
import { ThemeToggle } from './components/ThemeToggle';
import { AboutDialog } from './components/AboutDialog';
import { PDFViewer } from './components/PDFViewer';
import { RecentFilesList } from './components/RecentFilesList';
import { MergeDialog } from './components/editing/MergeDialog';
import { DeletePagesDialog } from './components/editing/DeletePagesDialog';
import { RotatePagesDialog } from './components/editing/RotatePagesDialog';
import { SplitPDFDialog } from './components/editing/SplitPDFDialog';
import { ReorderPagesDialog } from './components/editing/ReorderPagesDialog';
import { ExtractPagesDialog } from './components/editing/ExtractPagesDialog';
import { DuplicatePageDialog } from './components/editing/DuplicatePageDialog';
import { UnsavedChangesDialog } from './components/editing/UnsavedChangesDialog';
import { ExportImagesDialog } from './components/conversion/ExportImagesDialog';
import { ImportImagesDialog } from './components/conversion/ImportImagesDialog';
import { ConvertOfficeToPDFDialog } from './components/conversion/ConvertOfficeToPDFDialog';
import { EncryptPDFDialog } from './components/security/EncryptPDFDialog';
import { BulkEncryptDialog } from './components/security/BulkEncryptDialog';
import { WatermarkDialog } from './components/security/WatermarkDialog';
import { SignatureViewerDialog } from './components/security/SignatureViewerDialog';
import { SignPDFDialog } from './components/security/SignPDFDialog';
import { FormToolbar, FormDataDialog } from './components/forms';
import { usePDFStore } from './store/pdf-store';
import { useEditingStore } from './store/editing-store';
import { useAnnotationStore } from './store/annotation-store';
import { useFormsStore } from './store/forms-store';
import { useThemeStore } from './store/theme-store';
import { pdfService } from './lib/pdf-service';
import { pdfFormsService } from './lib/pdf-forms.service';
import { recentFilesManager, RecentFile } from './lib/recent-files';
import { extractAnnotationsFromPdf } from './lib/pdf-annotation-extract.service';
import { Button, Dialog } from './components/ui';

function App() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showDeletePagesDialog, setShowDeletePagesDialog] = useState(false);
  const [showRotatePagesDialog, setShowRotatePagesDialog] = useState(false);
  const [showSplitPDFDialog, setShowSplitPDFDialog] = useState(false);
  const [showReorderPagesDialog, setShowReorderPagesDialog] = useState(false);
  const [showExtractPagesDialog, setShowExtractPagesDialog] = useState(false);
  const [showDuplicatePageDialog, setShowDuplicatePageDialog] = useState(false);
  const [showExportImagesDialog, setShowExportImagesDialog] = useState(false);
  const [showImportImagesDialog, setShowImportImagesDialog] = useState(false);
  const [showConvertOfficeDialog, setShowConvertOfficeDialog] = useState(false);
  const [showEncryptPDFDialog, setShowEncryptPDFDialog] = useState(false);
  const [showBulkEncryptDialog, setShowBulkEncryptDialog] = useState(false);
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
  const [showSignatureViewerDialog, setShowSignatureViewerDialog] = useState(false);
  const [showSignPDFDialog, setShowSignPDFDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);
  const [showFormsDataDialog, setShowFormsDataDialog] = useState(false);
  const [formsDataDialogMode, setFormsDataDialogMode] = useState<'import' | 'export'>('export');
  const [isDetectingForms, setIsDetectingForms] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    document,
    fileName,
    setDocument,
    setMetadata,
    setFileName,
    setIsLoading,
    setError,
    reset,
  } = usePDFStore();

  const { hasUnsavedChanges, reset: resetEditingStore, setOriginalFile } = useEditingStore();
  const { setFields, fields, editMode, toggleEditMode, setEditMode, isDirty, setDirty } = useFormsStore();
  const { theme, setTheme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    // Apply theme from localStorage
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Get initial connectivity status
    window.electronAPI.getConnectivityStatus().then(setIsOnline);

    // Listen for connectivity changes
    const unsubscribe = window.electronAPI.onConnectivityStatusChanged((status) => {
      setIsOnline(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle file open
  const handleFileOpen = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load PDF
      const pdfDocument = await pdfService.loadFromFile(file);
      setDocument(pdfDocument);
      setFileName(file.name);

      // Get metadata
      const metadata = await pdfService.getMetadata(pdfDocument);
      if (metadata) {
        setMetadata(metadata);
      }

      // Add to recent files
      recentFilesManager.addRecentFile({
        path: file.name, // In browser context, we use file.name as identifier
        name: file.name,
        pageCount: pdfDocument.numPages,
      });

      // Store original file for signature viewer and other features
      setOriginalFile(file);

      // Load annotations for this document
      useAnnotationStore.getState().setCurrentDocument(file.name);
      
      // Extract and merge annotations from PDF file
      try {
        const buffer = await file.arrayBuffer();
        const pdfBytesData = new Uint8Array(buffer);

        // Store PDF bytes for forms and other operations
        setPdfBytes(pdfBytesData);

        const importedAnnotations = await extractAnnotationsFromPdf(pdfBytesData);
        
        if (importedAnnotations.length > 0) {
          useAnnotationStore.getState().mergeWithImportedAnnotations(importedAnnotations);
          console.log(`Imported ${importedAnnotations.length} annotations from PDF`);
        }
      } catch (err) {
        console.error('Failed to extract annotations from PDF:', err);
        // Continue even if extraction fails
      }

      setIsLoading(false);
      setShowRecentFiles(false);
    } catch (err) {
      console.error('Error opening PDF:', err);
      setError('Failed to open PDF file');
      setIsLoading(false);
    }
  };

  // Handle recent file selection
  const handleRecentFileSelect = async (recentFile: RecentFile) => {
    // In a real app, we would load from the path
    // For now, we'll just show a message that the user needs to select the file
    alert(`Please locate: ${recentFile.name}`);
    setShowRecentFiles(false);
    triggerFileInput();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileOpen(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle close document with unsaved changes check
  const handleCloseDocument = () => {
    if (hasUnsavedChanges) {
      setPendingCloseAction(() => () => {
        reset();
        resetEditingStore();
      });
      setShowUnsavedChangesDialog(true);
    } else {
      reset();
      resetEditingStore();
    }
  };

  const handleDiscardChanges = () => {
    if (pendingCloseAction) {
      pendingCloseAction();
      setPendingCloseAction(null);
    }
    setShowUnsavedChangesDialog(false);
  };

  const handleCancelClose = () => {
    setPendingCloseAction(null);
    setShowUnsavedChangesDialog(false);
  };

  // Forms handlers
  const handleDetectForms = async () => {
    if (!document) return;

    setIsDetectingForms(true);
    try {
      const detectedFields = await pdfFormsService.detectFormFields(document);
      setFields(detectedFields);

      if (detectedFields.length === 0) {
        alert(
          'No interactive form fields detected in this PDF.\n\n' +
          'This PDF may be a static form (image-based).\n\n' +
          'You can:\n' +
          '1. Click "Create New Fields" to manually add form fields\n' +
          '2. Use a PDF with interactive AcroForm fields'
        );
      } else {
        alert(`Found ${detectedFields.length} form field(s)!`);
      }
    } catch (error) {
      console.error('Error detecting forms:', error);
      alert('Failed to detect form fields');
    } finally {
      setIsDetectingForms(false);
    }
  };

  const handleExportFormData = () => {
    setFormsDataDialogMode('export');
    setShowFormsDataDialog(true);
  };

  const handleImportFormData = () => {
    setFormsDataDialogMode('import');
    setShowFormsDataDialog(true);
  };

  const handleSaveFilledPDF = async () => {
    if (!document) return;

    try {
      // Get current PDF bytes (we need the original file)
      // For now, we'll need to ask user to select the original file again
      // In a real implementation, we'd store the original bytes
      alert('Save filled PDF: This feature requires the original PDF bytes. Implementation in progress.');

      // TODO: Implement proper save with filled form data
      // const formData = pdfFormsService.exportFormData(fields);
      // const filledPdfBytes = await pdfFormsService.fillFormFields(originalPdfBytes, formData);
      // await window.electronAPI.savePDF(filledPdfBytes, fileName || 'filled-form.pdf');

      setDirty(false);
    } catch (error) {
      console.error('Error saving filled PDF:', error);
      alert('Failed to save filled PDF');
    }
  };

  const handleToggleEditMode = () => {
    toggleEditMode();
  };

  const handleSaveTemplate = async () => {
    if (!pdfBytes || fields.length === 0) {
      alert('No PDF or fields available');
      return;
    }

    try {
      setIsSavingTemplate(true);

      console.log('[App] Saving PDF template with fields...');

      // Generate PDF with fields structure
      const pdfWithFields = await pdfFormsService.saveFieldsStructureToPDF(pdfBytes, fields);

      // Suggest filename
      const suggestedName = fileName
        ? fileName.replace('.pdf', '_template.pdf')
        : 'template.pdf';

      // Step 1: Open save dialog to get file path
      const savePath = await window.electronAPI.saveFileDialog(suggestedName);

      if (!savePath) {
        // User cancelled
        console.log('[App] Save cancelled by user');
        return;
      }

      // Step 2: Save PDF bytes to file
      const result = await window.electronAPI.savePdfFile(savePath, pdfWithFields);

      if (result.success) {
        console.log('[App] Template saved successfully:', savePath);
        alert(
          `✅ Template saved successfully!\n\n` +
          `File: ${savePath}\n\n` +
          `This PDF now contains ${fields.length} interactive form field(s).\n\n` +
          `You can open it in:\n` +
          `• Adobe Acrobat Reader\n` +
          `• Google Chrome\n` +
          `• Microsoft Edge\n` +
          `• Foxit Reader\n` +
          `• Any other PDF reader\n\n` +
          `The form fields will be fully interactive and can be filled, saved, and shared!`
        );
      } else {
        throw new Error(result.error || 'Failed to save file');
      }
    } catch (error) {
      console.error('[App] Save template error:', error);
      alert(
        `❌ Failed to save template\n\n` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `Please try again or check the console for details.`
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileOpen(file);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header / Toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">PDF Kit</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">v0.1.0</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* About Button */}
          <button
            onClick={() => setShowAboutDialog(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="About PDF Kit"
          >
            About
          </button>

          {/* Connectivity Indicator */}
          <ConnectivityIndicator isOnline={isOnline} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Content Area - Full Width */}
        <div
          className="flex flex-1 flex-col"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!document ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No PDF Opened
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Open a PDF file or drag and drop here
                </p>
                <Button className="mt-6" onClick={triggerFileInput}>
                  Open File
                </Button>

                {/* Quick Tools - No PDF Required */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 w-full max-w-md">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                    Quick Tools (no PDF required)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowConvertOfficeDialog(true)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="text-xl">📄</span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Office to PDF</div>
                        <div className="text-xs text-gray-500">Word, Excel, PPT</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowMergeDialog(true)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="text-xl">🔗</span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Merge PDFs</div>
                        <div className="text-xs text-gray-500">Combine files</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowImportImagesDialog(true)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="text-xl">🖼️</span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Images to PDF</div>
                        <div className="text-xs text-gray-500">Create from images</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowBulkEncryptDialog(true)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="text-xl">🔒</span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Bulk Encrypt</div>
                        <div className="text-xs text-gray-500">Protect multiple PDFs</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PDFViewer
              onOpenMerge={() => setShowMergeDialog(true)}
              onOpenSplit={() => setShowSplitPDFDialog(true)}
              onOpenDelete={() => setShowDeletePagesDialog(true)}
              onOpenRotate={() => setShowRotatePagesDialog(true)}
              onOpenReorder={() => setShowReorderPagesDialog(true)}
              onOpenExtract={() => setShowExtractPagesDialog(true)}
              onOpenDuplicate={() => setShowDuplicatePageDialog(true)}
              onOpenExportImages={() => setShowExportImagesDialog(true)}
              onOpenImportImages={() => setShowImportImagesDialog(true)}
              onOpenConvertOffice={() => setShowConvertOfficeDialog(true)}
              onOpenEncryptPDF={() => setShowEncryptPDFDialog(true)}
              onOpenBulkEncrypt={() => setShowBulkEncryptDialog(true)}
              onOpenWatermark={() => setShowWatermarkDialog(true)}
              onOpenSignatures={() => setShowSignatureViewerDialog(true)}
              onOpenSignPDF={() => setShowSignPDFDialog(true)}
              onOpenFile={triggerFileInput}
              onOpenRecent={() => setShowRecentFiles(true)}
              onCloseDocument={handleCloseDocument}
              onDetectForms={handleDetectForms}
              onExportFormData={handleExportFormData}
              onImportFormData={handleImportFormData}
              onSaveFilledPDF={handleSaveFilledPDF}
              onSaveTemplate={handleSaveTemplate}
              onToggleFormsEditMode={handleToggleEditMode}
              isDetectingForms={isDetectingForms}
              isSavingTemplate={isSavingTemplate}
            />
          )}
        </div>
      </main>

      {/* Status Bar */}
      <footer className="flex h-8 items-center justify-between border-t border-gray-200 bg-white px-4 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div>
          {document
            ? `Page ${usePDFStore.getState().currentPage} of ${usePDFStore.getState().totalPages}`
            : 'Ready'}
        </div>
        <div>PDF Kit - Open Source PDF Management</div>
      </footer>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Recent Files Dialog */}
      <Dialog
        open={showRecentFiles}
        onClose={() => setShowRecentFiles(false)}
        title="Recent Files"
        description="Recently opened PDF documents"
      >
        <RecentFilesList onFileSelect={handleRecentFileSelect} />
      </Dialog>

      {/* Merge PDFs Dialog */}
      <MergeDialog
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
      />

      {/* Delete Pages Dialog */}
      <DeletePagesDialog
        open={showDeletePagesDialog}
        onClose={() => setShowDeletePagesDialog(false)}
      />

      {/* Rotate Pages Dialog */}
      <RotatePagesDialog
        open={showRotatePagesDialog}
        onClose={() => setShowRotatePagesDialog(false)}
      />

      {/* Split PDF Dialog */}
      <SplitPDFDialog
        open={showSplitPDFDialog}
        onClose={() => setShowSplitPDFDialog(false)}
      />

      {/* Reorder Pages Dialog */}
      <ReorderPagesDialog
        open={showReorderPagesDialog}
        onClose={() => setShowReorderPagesDialog(false)}
      />

      {/* Extract Pages Dialog */}
      <ExtractPagesDialog
        open={showExtractPagesDialog}
        onClose={() => setShowExtractPagesDialog(false)}
      />

      {/* Duplicate Page Dialog */}
      <DuplicatePageDialog
        open={showDuplicatePageDialog}
        onClose={() => setShowDuplicatePageDialog(false)}
      />

      {/* Export Images Dialog */}
      <ExportImagesDialog
        open={showExportImagesDialog}
        onClose={() => setShowExportImagesDialog(false)}
      />

      {/* Import Images Dialog */}
      <ImportImagesDialog
        open={showImportImagesDialog}
        onClose={() => setShowImportImagesDialog(false)}
      />

      {/* Convert Office to PDF */}
      <ConvertOfficeToPDFDialog
        open={showConvertOfficeDialog}
        onClose={() => setShowConvertOfficeDialog(false)}
      />

      {/* Encrypt PDF Dialog */}
            <EncryptPDFDialog
        open={showEncryptPDFDialog}
        onClose={() => setShowEncryptPDFDialog(false)}
      />

      {/* Bulk Encrypt Dialog */}
      <BulkEncryptDialog
        open={showBulkEncryptDialog}
        onClose={() => setShowBulkEncryptDialog(false)}
      />

      {/* Watermark Dialog */}
      <WatermarkDialog
        open={showWatermarkDialog}
        onClose={() => setShowWatermarkDialog(false)}
      />

      {/* Signature Viewer Dialog */}
      <SignatureViewerDialog
        open={showSignatureViewerDialog}
        onClose={() => setShowSignatureViewerDialog(false)}
      />

      {/* Sign PDF Dialog */}
      <SignPDFDialog
        open={showSignPDFDialog}
        onClose={() => setShowSignPDFDialog(false)}
      />

      {/* Unsaved Changes Warning */}
      <UnsavedChangesDialog
        open={showUnsavedChangesDialog}
        onClose={handleCancelClose}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelClose}
      />

      {/* Form Data Import/Export Dialog */}
      <FormDataDialog
        isOpen={showFormsDataDialog}
        mode={formsDataDialogMode}
        onClose={() => setShowFormsDataDialog(false)}
        pdfTitle={fileName}
      />

      {/* About Dialog */}
      <AboutDialog isOpen={showAboutDialog} onClose={() => setShowAboutDialog(false)} />
    </div>
  );
}

export default App;
