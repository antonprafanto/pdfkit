import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ConnectivityIndicator } from './components/ConnectivityIndicator';
import { ThemeToggle } from './components/ThemeToggle';
import { AboutDialog } from './components/AboutDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { PDFPasswordDialog } from './components/PDFPasswordDialog';
import { PDFViewer } from './components/PDFViewer';
import { RecentFilesList } from './components/RecentFilesList';
import { MergeDialog } from './components/editing/MergeDialog';
import { DeletePagesDialog } from './components/editing/DeletePagesDialog';
import { RotatePagesDialog } from './components/editing/RotatePagesDialog';
import { SplitPDFDialog } from './components/editing/SplitPDFDialog';
import { ReorderPagesDialog } from './components/editing/ReorderPagesDialog';
import { ExtractPagesDialog } from './components/editing/ExtractPagesDialog';
import { ExtractImagesDialog } from './components/editing/ExtractImagesDialog';
import { DuplicatePageDialog } from './components/editing/DuplicatePageDialog';
import { UnsavedChangesDialog } from './components/editing/UnsavedChangesDialog';
import { ExportImagesDialog } from './components/conversion/ExportImagesDialog';
import { ImportImagesDialog } from './components/conversion/ImportImagesDialog';
import { ConvertOfficeToPDFDialog } from './components/conversion/ConvertOfficeToPDFDialog';
import { EncryptPDFDialog } from './components/security/EncryptPDFDialog';
import { BulkEncryptDialog } from './components/security/BulkEncryptDialog';
import { WatermarkDialog } from './components/security/WatermarkDialog';
import { AddPageNumbersDialog } from './components/editing/AddPageNumbersDialog';
import { SignatureViewerDialog } from './components/security/SignatureViewerDialog';
import { SignPDFDialog } from './components/security/SignPDFDialog';
import { UnlockPDFDialog } from './components/security/UnlockPDFDialog';
import { OCRDialog } from './components/ocr';
import { CompressionDialog, WebOptimizePDFDialog } from './components/compression';
import { OverlayPDFDialog } from './components/editing/OverlayPDFDialog';
import { WebpageToPDFDialog } from './components/tools/WebpageToPDFDialog';
import { PDFConvertDialog } from './components/PDFConvertDialog';
import { BatchOperationsDialog } from './components/batch';
import { PluginManagerDialog } from './components/plugins';
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog';
import { FormDataDialog } from './components/forms';
import { usePDFStore } from './store/pdf-store';
import { useEditingStore } from './store/editing-store';
import { useAnnotationStore } from './store/annotation-store';
import { useFormsStore } from './store/forms-store';
import { useThemeStore } from './store/theme-store';
import { useSettingsStore, FONT_OPTIONS } from './store/settings-store';
import { initializeAIService } from './store/ai-store';
import { pdfService } from './lib/pdf-service';
import { pdfFormsService } from './lib/pdf-forms.service';
import { recentFilesManager, RecentFile } from './lib/recent-files';
import { extractAnnotationsFromPdf } from './lib/pdf-annotation-extract.service';
import { Button, Dialog } from './components/ui';
import { UpdateNotification } from './components/UpdateNotification';
import { FeatureHighlightsDialog, shouldShowFeatureHighlights } from './components/FeatureHighlightsDialog';
import { ShareDialog } from './components/ShareDialog';
import { TabBar } from './components/TabBar';
import { ToolsGrid, ToolAction } from './components/home/ToolsGrid';
import { ToolSearchDialog } from './components/ToolSearchDialog';

// Define pending action type based on tool action but limited to file-dependent actions
type PendingAction = ToolAction | null;

function App() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showDeletePagesDialog, setShowDeletePagesDialog] = useState(false);
  const [showRotatePagesDialog, setShowRotatePagesDialog] = useState(false);
  const [showSplitPDFDialog, setShowSplitPDFDialog] = useState(false);
  const [showReorderPagesDialog, setShowReorderPagesDialog] = useState(false);
  const [showExtractPagesDialog, setShowExtractPagesDialog] = useState(false);
  const [showExtractImagesDialog, setShowExtractImagesDialog] = useState(false);
  const [showDuplicatePageDialog, setShowDuplicatePageDialog] = useState(false);
  const [showExportImagesDialog, setShowExportImagesDialog] = useState(false);
  const [showImportImagesDialog, setShowImportImagesDialog] = useState(false);
  const [showConvertOfficeDialog, setShowConvertOfficeDialog] = useState(false);
  const [showEncryptPDFDialog, setShowEncryptPDFDialog] = useState(false);
  const [showBulkEncryptDialog, setShowBulkEncryptDialog] = useState(false);
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
  const [showAddPageNumbersDialog, setShowAddPageNumbersDialog] = useState(false);
  const [showSignatureViewerDialog, setShowSignatureViewerDialog] = useState(false);
  const [showSignPDFDialog, setShowSignPDFDialog] = useState(false);
  const [showUnlockPDFDialog, setShowUnlockPDFDialog] = useState(false);
  const [showWebOptimizeDialog, setShowWebOptimizeDialog] = useState(false);
  const [showOverlayDialog, setShowOverlayDialog] = useState(false);
  const [showWebpageToPDFDialog, setShowWebpageToPDFDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [showCompressionDialog, setShowCompressionDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);
  const [showFormsDataDialog, setShowFormsDataDialog] = useState(false);
  const [formsDataDialogMode, setFormsDataDialogMode] = useState<'import' | 'export'>('export');
  const [isDetectingForms, setIsDetectingForms] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPluginManagerDialog, setShowPluginManagerDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);
  const [showFeatureHighlights, setShowFeatureHighlights] = useState(() => shouldShowFeatureHighlights());
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showToolSearch, setShowToolSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const {
    document,
    fileName,
    // setDocument, setMetadata, setFileName - now handled via updateTab
    setFilePath,
    setIsLoading,
    setError,
    reset,
    // Tab management
    addTab,
    findTabByFilePath,
    canAddTab,
    setActiveTab,
    updateTab,
    getActiveTab,
  } = usePDFStore();

  const { hasUnsavedChanges, reset: resetEditingStore, setOriginalFile } = useEditingStore();
  const { setFields, fields, toggleEditMode, setDirty } = useFormsStore();
  const { theme } = useThemeStore();

  // Override window.print to prevent native Electron print dialog
  // This must be done early before any print action can be triggered
  useEffect(() => {
    const originalPrint = window.print;
    window.print = () => {
      console.log('[App] window.print blocked - use Print button or Ctrl+P handler');
      // Don't call original print - our custom handler opens PDF in system viewer
    };
    return () => {
      window.print = originalPrint;
    };
  }, []);

  // Pending action state for Quick Actions (e.g., clicking PDF to Word on home)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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

  // Handle pending actions after document is loaded
  useEffect(() => {
    if (document && pendingAction) {
      // Short timeout to ensure UI is ready
      const timer = setTimeout(() => {
        // Map pending actions to dialogs
        switch (pendingAction) {
          case 'pdf-to-word':
          case 'pdf-to-excel':
            setShowConvertDialog(true);
            break;
          case 'overlay':
            setShowOverlayDialog(true);
            break;
          case 'split':
            setShowSplitPDFDialog(true);
            break;
          case 'rotate':
            setShowRotatePagesDialog(true);
            break;
          case 'reorder':
            setShowReorderPagesDialog(true);
            break;
          case 'delete-pages':
            setShowDeletePagesDialog(true);
            break;
          case 'extract-pages':
            setShowExtractPagesDialog(true);
            break;
          case 'duplicate-page':
            setShowDuplicatePageDialog(true);
            break;
          case 'extract-images':
            setShowExtractImagesDialog(true);
            break;
          case 'encrypt':
            setShowEncryptPDFDialog(true);
            break;
          case 'unlock':
            setShowUnlockPDFDialog(true);
            break;
          case 'sign':
            setShowSignPDFDialog(true);
            break;
          case 'watermark':
            setShowWatermarkDialog(true);
            break;
          case 'compress':
            setShowCompressionDialog(true);
            break;
          case 'add-page-numbers':
            setShowAddPageNumbersDialog(true);
            break;
          case 'ocr':
            setShowOCRDialog(true);
            break;
          // Metadata tool removed as component doesn't exist yet
          // Standalone tools don't need pending action logic as they open directly
        }
        setPendingAction(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [document, pendingAction]);

  const handleToolAction = (action: ToolAction) => {
    // Some tools don't need a file open first
    switch (action) {
      case 'merge':
        setShowMergeDialog(true);
        break;
      case 'office-to-pdf':
        setShowConvertOfficeDialog(true);
        break;
      case 'images-to-pdf':
        setShowImportImagesDialog(true);
        break;
      case 'webpage-to-pdf':
        setShowWebpageToPDFDialog(true);
        break;
      case 'bulk-encrypt':
        setShowBulkEncryptDialog(true);
        break;
      default:
        // For other tools, require a file to be open
        setPendingAction(action);
        triggerFileInput();
        break;
    }
  };

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

  // Initialize AI service with stored API keys on app load
  useEffect(() => {
    initializeAIService();
  }, []);

  // Listen for PDF file opened from OS (file association)
  useEffect(() => {
    const unsubscribe = window.electronAPI.onOpenPdfFile?.(async (filePath: string) => {
      try {
        console.log('Opening PDF from file association:', filePath);
        const result = await window.electronAPI.readFileFromPath(filePath);
        if (result.success && result.data && result.name) {
          // Create a File object from the data
          const blob = new Blob([new Uint8Array(result.data)], { type: 'application/pdf' });
          const file = new File([blob], result.name, { type: 'application/pdf' });
          handleFileOpen(file);
          // filePath is now stored in tab via updateTab in handleFileOpen
          // Legacy setFilePath will also update active tab
          setFilePath(filePath);
        } else {
          console.error('Failed to read file:', result.error);
        }
      } catch (error) {
        console.error('Error opening file from association:', error);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Keyboard shortcuts listener (F1 or ? for help, Ctrl+O to open file)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+O to open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // Ctrl+K to open tool search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowToolSearch(true);
        return;
      }

      // F1 or ? (Shift+/) to open keyboard shortcuts help
      if (e.key === 'F1' || (e.key === '?' && e.shiftKey)) {
        e.preventDefault();
        setShowKeyboardShortcutsDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for new tab event from TabBar
  useEffect(() => {
    const handleNewTab = () => {
      fileInputRef.current?.click();
    };
    window.addEventListener('open-new-tab', handleNewTab);
    return () => window.removeEventListener('open-new-tab', handleNewTab);
  }, []);

  // Handle file open - now creates new tab
  const handleFileOpen = async (file: File, password?: string) => {
    try {
      // Check if file is already open in a tab
      const existingTab = findTabByFilePath(file.name);
      if (existingTab) {
        // Switch to existing tab
        setActiveTab(existingTab.id);
        useAnnotationStore.getState().setCurrentDocument(existingTab.id);
        return;
      }

      // Check if we can add more tabs
      if (!canAddTab()) {
        setError(t('tabs.tabLimitWarning'));
        return;
      }

      // Create new tab
      const tabId = addTab({ isLoading: true, fileName: file.name });
      if (!tabId) {
        setError('Failed to create tab');
        return;
      }


      setIsLoading(true);
      setError(null);

      // Load PDF with password if provided
      const pdfDocument = await pdfService.loadFromFile(file, password);
      
      // Update tab with document
      updateTab(tabId, {
        document: pdfDocument,
        fileName: file.name,
        filePath: file.name,
        totalPages: pdfDocument.numPages,
        currentPage: 1,
        isLoading: false,
      });

      // If we get here, PDF loaded successfully - close password dialog if open
      if (showPasswordDialog) {
        setShowPasswordDialog(false);
        setPasswordError(null);
        setPendingFile(null);
      }

      // Get metadata
      const metadata = await pdfService.getMetadata(pdfDocument);
      if (metadata) {
        updateTab(tabId, { metadata });
      }

      // Read file bytes for operations
      const arrayBuffer = await file.arrayBuffer();
      updateTab(tabId, { pdfBytes: new Uint8Array(arrayBuffer) });

      // Add to recent files
      recentFilesManager.addRecentFile({
        path: file.name,
        name: file.name,
        pageCount: pdfDocument.numPages,
      });

      // Store original file for signature viewer and other features
      setOriginalFile(file);

      // Load annotations for this tab
      useAnnotationStore.getState().setCurrentDocument(tabId);

      // Extract and merge annotations from PDF file
      try {
        const buffer = await file.arrayBuffer();
        const pdfBytesData = new Uint8Array(buffer);

        // Store PDF bytes for forms and other operations (now stored in tab)
        // pdfBytes are already stored in updateTab call in handleFileOpen

        // Skip annotation extraction for encrypted PDFs
        // pdf-lib doesn't support annotation extraction from encrypted PDFs without complex password handling
        if (!password) {
          const importedAnnotations = await extractAnnotationsFromPdf(pdfBytesData);

          if (importedAnnotations.length > 0) {
            useAnnotationStore.getState().mergeWithImportedAnnotations(importedAnnotations);
            console.log(`Imported ${importedAnnotations.length} annotations from PDF`);
          }
        } else {
          console.log('Skipping annotation extraction for encrypted PDF');
        }

        // Auto-detect form fields when PDF is loaded
        try {
          console.log('[App] Auto-detecting form fields...');
          const detectedFields = await pdfFormsService.detectFormFields(pdfDocument);

          if (detectedFields.length > 0) {
            setFields(detectedFields);
            console.log(`[App] Auto-detected ${detectedFields.length} form field(s)`);
          } else {
            console.log('[App] No form fields detected');
          }
        } catch (formErr) {
          console.error('[App] Failed to auto-detect form fields:', formErr);
          // Don't block PDF loading if form detection fails
        }
      } catch (err) {
        console.error('Failed to load annotations or forms:', err);
        // Don't block PDF loading if annotations fail to load
      }

      // Clear loading and close recent files panel after successful load
      setIsLoading(false);
      setShowRecentFiles(false);
      
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      
      // Check if error is due to password requirement
      // PDF.js throws PasswordException for encrypted PDFs
      const isPasswordError = 
        err.name === 'PasswordException' ||
        (err.message && (err.message.includes('password') || err.message.includes('encrypted')));
      
      if (isPasswordError) {
        // PDF is encrypted - show password dialog
        setPendingFile(file);
        
        // If password was provided but failed, show error
        if (password) {
          setPasswordError(t('pdfPassword.wrongPassword'));
        } else {
          setPasswordError(null);
        }
        
        setShowPasswordDialog(true);
        setIsLoading(false);
        return;
      }
      
      setError(err.message || 'Failed to load PDF');
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (pendingFile) {
      handleFileOpen(pendingFile, password);
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
    // Reset input value to allow opening the same file again
    e.target.value = '';
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
    const activeTab = getActiveTab();
    const tabPdfBytes = activeTab?.pdfBytes;
    if (!tabPdfBytes || fields.length === 0) {
      alert('No PDF or fields available');
      return;
    }

    try {
      setIsSavingTemplate(true);

      console.log('[App] Saving PDF template with fields...');

      // Get font settings
      const { formFieldFont, formFieldFontSize } = useSettingsStore.getState();
      const fontOption = FONT_OPTIONS.find((f) => f.id === formFieldFont);
      const pdfFontName = fontOption?.pdfStandardFont || 'Courier';

      console.log(`[App] Using font: ${pdfFontName}, size: ${formFieldFontSize}px`);

      // Generate PDF with fields structure
      const pdfWithFields = await pdfFormsService.saveFieldsStructureToPDF(
        tabPdfBytes,
        fields,
        pdfFontName,
        formFieldFontSize
      );

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
      {/* Auto-Update Notification Banner */}
      <UpdateNotification />

      {/* Header / Toolbar - Only show on landing page, hidden when document is open */}
      {!document && (
      <header className={`sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background transition-all duration-300 ${isHeaderMinimized ? 'h-8' : 'h-14'}`}>
        <div className={`flex items-center gap-4 ${isHeaderMinimized ? 'px-3' : 'px-6'}`}>
          {!isHeaderMinimized && (
            <>
              <div className="flex items-center justify-center p-1.5 rounded bg-primary">
                 <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                 </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground tracking-tight">PDF Kit</h1>
              </div>
            </>
          )}
          {isHeaderMinimized && (
            <h1 className="text-xs font-medium text-muted-foreground">PDF Kit</h1>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 px-6">
          {!isHeaderMinimized && (
            <>
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Settings Button */}
              <button
                onClick={() => setShowSettingsDialog(true)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title={t('footer.settings')}
              >
                {t('footer.settings')}
              </button>

              {/* About Button */}
              <button
                onClick={() => setShowAboutDialog(true)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title={t('footer.about')}
              >
                {t('footer.about')}
              </button>

              {/* Share Button */}
              <button
                onClick={() => setShowShareDialog(true)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all flex items-center gap-1.5"
                title={t('toolbar.share')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {t('toolbar.share')}
              </button>

              {/* Check for Updates Button */}
              <button
                onClick={async () => {
                  try {
                    console.log('[App] Check Updates button clicked');
                    const result = await window.electronAPI.simpleUpdateCheck();
                    console.log('[App] Update check result:', result);
                    
                    if (result.error) {
                      alert(`Failed to check for updates:\n${result.error}`);
                    } else if (result.hasUpdate) {
                      const message = `New version available!\n\nCurrent: ${result.currentVersion}\nLatest: ${result.latestVersion}\n\nClick OK to download the update.`;
                      if (confirm(message)) {
                        await window.electronAPI.openDownloadUrl(result.downloadUrl);
                      }
                    } else {
                      alert(`You're up to date!\n\nCurrent version: ${result.currentVersion}`);
                    }
                  } catch (error) {
                    console.error('[App] Failed to check for updates:', error);
                    alert(`Error checking for updates:\n${error}`);
                  }
                }}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all flex items-center gap-1.5"
                title="Check for Updates"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check Updates
              </button>

              {/* Connectivity Indicator */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50">
                 <ConnectivityIndicator isOnline={isOnline} />
              </div>

              <div className="w-px h-5 bg-border mx-2"></div>
            </>
          )}

          {/* Minimize/Maximize Button */}
          <button
            onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isHeaderMinimized ? 'Expand Header' : 'Minimize Header'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isHeaderMinimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              )}
            </svg>
          </button>
        </div>
      </header>
      )}

      {/* Floating Support Buttons - Simple */}
      <div className="fixed bottom-12 right-6 flex flex-col gap-3 z-40">
        <button
          onClick={() => window.electronAPI.openExternal('https://wa.me/6281155339393')}
          className="rounded-full p-3 text-white bg-[#25D366] hover:bg-[#128C7E] transition-all shadow-md hover:shadow-lg"
          title={t('footer.contactSupport')}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </button>

        <button
          onClick={() => window.electronAPI.openExternal('https://trakteer.id/limitless7/tip')}
          className="rounded-full p-3 text-white bg-pink-600 hover:bg-pink-700 transition-all shadow-md hover:shadow-lg"
          title={t('footer.supportUs')}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <button
          onClick={() => window.electronAPI.openExternal('https://github.com/antonprafanto/pdfkit/issues')}
          className="rounded-full p-3 text-foreground bg-secondary hover:bg-secondary/80 transition-all shadow-md hover:shadow-lg"
          title="Report Issue"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative bg-background">
        
        {/* Content Area - Full Width */}
        <div
          className="flex flex-1 flex-col z-10"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!document ? (
            <div className="h-full overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-8">
                <div className="max-w-5xl w-full">
                
                {/* Hero Section - Minimalist */}
                <div className="flex flex-col items-center justify-center text-center mb-16 animate-fade-in-up">
                  
                  {/* Smart Drop Zone - Clean */}
                  <div 
                    onClick={triggerFileInput}
                    className="group w-full max-w-2xl text-center cursor-pointer"
                  >
                    <div className="rounded-xl border border-dashed border-border bg-card hover:bg-secondary/50 p-12 transition-all duration-200 upload-area">
                      
                      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-secondary group-hover:bg-primary/5 transition-colors duration-200">
                         <svg className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                         </svg>
                      </div>

                      <h1 className="text-3xl font-semibold mb-3 tracking-tight text-foreground">
                        {t('landing.uploadTitle')}
                      </h1>
                      <p className="text-base text-muted-foreground mb-8 max-w-sm mx-auto">
                         {t('landing.uploadHint')}
                      </p>

                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                          className="px-6 rounded-md"
                        >
                          {t('landing.openFile')}
                        </Button>
                        <Button
                          variant="outline"
                          className="px-6 rounded-md"
                          onClick={(e) => { e.stopPropagation(); setShowRecentFiles(true); }}
                        >
                          {t('landing.recentFiles')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Tools Grid */}
                <div className="mb-12 animate-fade-in-up-delay-1">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 px-4">
                    {t('landing.allTools', 'All PDF Tools')}
                  </h2>
                  <ToolsGrid onAction={handleToolAction} />
                </div>
                
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Tab Bar for multiple documents */}
              <TabBar />
              
              {/* PDF Viewer */}
              <PDFViewer
              onOpenMerge={() => setShowMergeDialog(true)}
              onOpenSplit={() => setShowSplitPDFDialog(true)}
              onOpenDelete={() => setShowDeletePagesDialog(true)}
              onOpenRotate={() => setShowRotatePagesDialog(true)}
              onOpenReorder={() => setShowReorderPagesDialog(true)}
              onOpenExtract={() => setShowExtractPagesDialog(true)}
              onOpenExtractImages={() => setShowExtractImagesDialog(true)}
              onOpenDuplicate={() => setShowDuplicatePageDialog(true)}
              onOpenExportImages={() => setShowExportImagesDialog(true)}
              onOpenImportImages={() => setShowImportImagesDialog(true)}
              onOpenConvertOffice={() => setShowConvertOfficeDialog(true)}
              onOpenEncryptPDF={() => setShowEncryptPDFDialog(true)}
              onOpenBulkEncrypt={() => setShowBulkEncryptDialog(true)}
              onOpenWatermark={() => setShowWatermarkDialog(true)}
              onOpenAddPageNumbers={() => setShowAddPageNumbersDialog(true)}
              onOpenSignPDF={() => setShowSignPDFDialog(true)}
              onOpenSignatures={() => setShowSignatureViewerDialog(true)}
              onOpenUnlockPDF={() => setShowUnlockPDFDialog(true)}
              onOpenWebOptimize={() => setShowWebOptimizeDialog(true)}
              onOpenOverlay={() => setShowOverlayDialog(true)}
              onOpenWebpageToPDF={() => setShowWebpageToPDFDialog(true)}
              onConvert={() => setShowConvertDialog(true)}
              onOpenOCR={() => setShowOCRDialog(true)}
              onOpenCompress={() => setShowCompressionDialog(true)}
              onOpenBatch={() => setShowBatchDialog(true)}
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
              onSettings={() => setShowSettingsDialog(true)}
              onAbout={() => setShowAboutDialog(true)}
              onShare={() => setShowShareDialog(true)}
              onSearchTools={() => setShowToolSearch(true)}
              onCheckUpdates={async () => {
                try {
                  const result = await window.electronAPI.simpleUpdateCheck();
                  if (result.error) {
                    alert(t('updateCheck.failed', { error: result.error }));
                  } else if (result.hasUpdate) {
                    const message = t('updateCheck.available', { 
                      current: result.currentVersion, 
                      latest: result.latestVersion 
                    });
                    if (confirm(message)) {
                      await window.electronAPI.openDownloadUrl(result.downloadUrl);
                    }
                  } else {
                    alert(t('updateCheck.upToDate', { current: result.currentVersion }));
                  }
                } catch (error) {
                  alert(t('updateCheck.error', { error }));
                }
              }}
              themeToggle={<ThemeToggle />}
              isOnline={isOnline}
            />
            </div>
          )}
        </div>
      </main>

      {/* Status Bar - Minimalist */}
      <footer className="z-50 flex h-8 items-center justify-between border-t border-border bg-background px-4 text-xs text-muted-foreground">
        <div>
           {document
             ? `Page ${usePDFStore.getState().currentPage} of ${usePDFStore.getState().totalPages}`
             : 'Ready'}
        </div>
        <div>PDF Kit</div>
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

      {/* Extract Images Dialog */}
      <ExtractImagesDialog
        open={showExtractImagesDialog}
        onClose={() => setShowExtractImagesDialog(false)}
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
      <AddPageNumbersDialog
        open={showAddPageNumbersDialog}
        onClose={() => setShowAddPageNumbersDialog(false)}
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
      <UnlockPDFDialog
        open={showUnlockPDFDialog}
        onClose={() => setShowUnlockPDFDialog(false)}
      />

      {/* Web Optimize Dialog */}
      <WebOptimizePDFDialog
        open={showWebOptimizeDialog}
        onClose={() => setShowWebOptimizeDialog(false)}
      />

      {/* Overlay PDF Dialog */}
      <OverlayPDFDialog
        open={showOverlayDialog}
        onClose={() => setShowOverlayDialog(false)}
      />

      {/* Webpage to PDF Dialog */}
      <WebpageToPDFDialog
        open={showWebpageToPDFDialog}
        onClose={() => setShowWebpageToPDFDialog(false)}
      />

      {/* PDF Convert to Word/Excel Dialog */}
      <PDFConvertDialog
        isOpen={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        pdfBytes={showConvertDialog && document ? pdfService.getCurrentPdfBytes() : null}
        fileName={fileName || 'document.pdf'}
      />

      {/* OCR Dialog */}
      <OCRDialog
        open={showOCRDialog}
        onClose={() => setShowOCRDialog(false)}
      />

      {/* Compression Dialog */}
      <CompressionDialog
        open={showCompressionDialog}
        onClose={() => setShowCompressionDialog(false)}
      />

      {/* Batch Operations Dialog */}
      <BatchOperationsDialog
        open={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
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
        pdfTitle={fileName || undefined}
      />

      {/* Settings Dialog */}
      <SettingsDialog isOpen={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} />

      {/* About Dialog */}
      <AboutDialog isOpen={showAboutDialog} onClose={() => setShowAboutDialog(false)} />

      {/* Plugin Manager Dialog */}
      <PluginManagerDialog
        open={showPluginManagerDialog}
        onClose={() => setShowPluginManagerDialog(false)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardShortcutsDialog}
        onClose={() => setShowKeyboardShortcutsDialog(false)}
      />

      {/* Feature Highlights Dialog */}
      <FeatureHighlightsDialog
        open={showFeatureHighlights}
        onClose={() => {
          setShowFeatureHighlights(false);
          localStorage.setItem('hasSeenFeatureHighlights', 'true');
        }}
      />

      {/* PDF Password Dialog */}
      <PDFPasswordDialog
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPasswordError(null);
          setPendingFile(null);
        }}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />

      {/* Tool Search Dialog (Ctrl+K) */}
      <ToolSearchDialog
        isOpen={showToolSearch}
        onClose={() => setShowToolSearch(false)}
        onAction={handleToolAction}
        hasDocument={!!document}
      />
    </div>
  );
}

export default App;
