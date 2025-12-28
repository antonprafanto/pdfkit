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
    // Safety check for document (use window.document to avoid conflict with PDF document variable)
    const htmlDoc = window.document;
    if (htmlDoc && htmlDoc.documentElement) {
      // Apply theme from localStorage
      if (theme === 'dark') {
        htmlDoc.documentElement.classList.add('dark');
      } else {
        htmlDoc.documentElement.classList.remove('dark');
      }
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
        <div className="flex items-center gap-2">
          {/* Support Buttons */}
          <button
            onClick={() => window.electronAPI.openExternal('https://wa.me/6281155339393')}
            className="rounded-lg p-2 text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors shadow-sm"
            title="Contact Support via WhatsApp (0811-5533-9393)"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>

          <button
            onClick={() => window.electronAPI.openExternal('https://trakteer.id/limitless7/tip')}
            className="rounded-lg p-2 text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 dark:from-pink-600 dark:to-purple-700 dark:hover:from-pink-700 dark:hover:to-purple-800 transition-colors shadow-sm"
            title="Support Us via Trakteer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

          <button
            onClick={() => window.electronAPI.openExternal('https://github.com/antonprafanto/pdfkit/issues')}
            className="rounded-lg p-2 text-gray-700 dark:text-gray-300 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-sm"
            title="Report Issue on GitHub"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

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
            <div className="h-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center">
                <div className="max-w-5xl w-full px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                  {/* Logo/Icon */}
                  <div className="inline-flex items-center justify-center w-28 h-28 mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  </div>

                  {/* Title */}
                  <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Modern PDF Management
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                    Everything you need to work with PDFs—merge, split, convert, secure, and more.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={triggerFileInput}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
                    >
                      Open PDF File
                    </button>
                    <button
                      onClick={() => setShowRecentFiles(true)}
                      className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                    >
                      Recent Files
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    or drag and drop your PDF here
                  </p>
                </div>

                {/* Quick Tools Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Quick Tools
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Office to PDF */}
                    <button
                      onClick={() => setShowConvertOfficeDialog(true)}
                      className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 mb-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Office to PDF</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Word, Excel, PowerPoint</p>
                      </div>
                    </button>

                    {/* Merge PDFs */}
                    <button
                      onClick={() => setShowMergeDialog(true)}
                      className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 mb-4 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Merge PDFs</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Combine multiple files</p>
                      </div>
                    </button>

                    {/* Images to PDF */}
                    <button
                      onClick={() => setShowImportImagesDialog(true)}
                      className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 mb-4 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Images to PDF</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Create from images</p>
                      </div>
                    </button>

                    {/* Bulk Encrypt */}
                    <button
                      onClick={() => setShowBulkEncryptDialog(true)}
                      className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 mb-4 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Bulk Encrypt</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Protect multiple PDFs</p>
                      </div>
                    </button>
                  </div>
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
