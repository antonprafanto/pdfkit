/**
 * Tool Search Dialog
 * Command palette style dialog for searching and activating tools when document is open
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Sheet, Image, Globe, Lock, Unlock, FileSignature, 
  Files, Split, RotateCw, Trash2, ArrowUpDown, Copy, 
  Stamp, Minimize2, Type, Search, X
} from 'lucide-react';
import { Dialog } from './ui';
import { ToolAction } from './home/ToolsGrid';

interface ToolSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: ToolAction) => void;
  hasDocument: boolean;
}

interface Tool {
  id: ToolAction;
  icon: React.ReactNode;
  title: string;
  desc: string;
  requiresDocument: boolean;
}

export function ToolSearchDialog({ isOpen, onClose, onAction, hasDocument }: ToolSearchDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery('');
    }
  }, [isOpen]);

  const allTools: Tool[] = [
    // Convert
    { id: 'office-to-pdf', icon: <FileText className="w-5 h-5" />, title: t('landing.officeToPdf', 'Office to PDF'), desc: t('landing.officeToPdfDesc', 'Convert Word, Excel to PDF'), requiresDocument: false },
    { id: 'images-to-pdf', icon: <Image className="w-5 h-5" />, title: t('landing.imagesToPdf', 'Images to PDF'), desc: t('landing.imagesToPdfDesc', 'Convert images to PDF'), requiresDocument: false },
    { id: 'webpage-to-pdf', icon: <Globe className="w-5 h-5" />, title: t('landing.webpageToPdf', 'Webpage to PDF'), desc: t('landing.webpageToPdfDesc', 'Convert website to PDF'), requiresDocument: false },
    { id: 'pdf-to-word', icon: <FileText className="w-5 h-5" />, title: t('landing.pdfToWord', 'PDF to Word'), desc: t('landing.pdfToWordDesc', 'Convert PDF to .docx'), requiresDocument: true },
    { id: 'pdf-to-excel', icon: <Sheet className="w-5 h-5" />, title: t('landing.pdfToExcel', 'PDF to Excel'), desc: t('landing.pdfToExcelDesc', 'Convert PDF to .xlsx'), requiresDocument: true },
    { id: 'extract-images', icon: <Image className="w-5 h-5" />, title: t('landing.extractImages', 'Extract Images'), desc: t('landing.extractImagesDesc', 'Get all images'), requiresDocument: true },
    // Organize
    { id: 'merge', icon: <Files className="w-5 h-5" />, title: t('landing.mergePdfs', 'Merge PDF'), desc: t('landing.mergePdfsDesc', 'Combine PDFs'), requiresDocument: false },
    { id: 'split', icon: <Split className="w-5 h-5" />, title: t('landing.splitPdf', 'Split PDF'), desc: t('landing.splitPdfDesc', 'Split into parts'), requiresDocument: true },
    { id: 'rotate', icon: <RotateCw className="w-5 h-5" />, title: t('landing.rotate', 'Rotate Pages'), desc: t('landing.rotateDesc', 'Rotate pages'), requiresDocument: true },
    { id: 'reorder', icon: <ArrowUpDown className="w-5 h-5" />, title: t('landing.reorder', 'Reorder Pages'), desc: t('landing.reorderDesc', 'Change order'), requiresDocument: true },
    { id: 'delete-pages', icon: <Trash2 className="w-5 h-5" />, title: t('landing.deletePages', 'Delete Pages'), desc: t('landing.deletePagesDesc', 'Remove pages'), requiresDocument: true },
    { id: 'extract-pages', icon: <Copy className="w-5 h-5" />, title: t('landing.extractPages', 'Extract Pages'), desc: t('landing.extractPagesDesc', 'Extract pages'), requiresDocument: true },
    { id: 'duplicate-page', icon: <Copy className="w-5 h-5" />, title: t('landing.duplicatePage', 'Duplicate Page'), desc: t('landing.duplicatePageDesc', 'Copy page'), requiresDocument: true },
    // Edit
    { id: 'compress', icon: <Minimize2 className="w-5 h-5" />, title: t('landing.compress', 'Compress PDF'), desc: t('landing.compressDesc', 'Reduce size'), requiresDocument: true },
    { id: 'overlay', icon: <Stamp className="w-5 h-5" />, title: t('landing.overlay', 'Overlay PDF'), desc: t('landing.overlayDesc', 'Add overlay'), requiresDocument: true },
    { id: 'add-page-numbers', icon: <Type className="w-5 h-5" />, title: t('landing.addPageNumbers', 'Page Numbers'), desc: t('landing.addPageNumbersDesc', 'Add numbering'), requiresDocument: true },
    { id: 'ocr', icon: <Search className="w-5 h-5" />, title: t('landing.ocr', 'OCR PDF'), desc: t('landing.ocrDesc', 'Make searchable'), requiresDocument: true },
    // Security
    { id: 'encrypt', icon: <Lock className="w-5 h-5" />, title: t('landing.encrypt', 'Protect PDF'), desc: t('landing.encryptDesc', 'Add password'), requiresDocument: true },
    { id: 'unlock', icon: <Unlock className="w-5 h-5" />, title: t('landing.unlock', 'Unlock PDF'), desc: t('landing.unlockDesc', 'Remove password'), requiresDocument: true },
    { id: 'sign', icon: <FileSignature className="w-5 h-5" />, title: t('landing.sign', 'Sign PDF'), desc: t('landing.signDesc', 'Add signature'), requiresDocument: true },
    { id: 'watermark', icon: <Stamp className="w-5 h-5" />, title: t('landing.watermark', 'Watermark'), desc: t('landing.watermarkDesc', 'Add watermark'), requiresDocument: true },
    { id: 'bulk-encrypt', icon: <Lock className="w-5 h-5" />, title: t('landing.bulkEncrypt', 'Bulk Encrypt'), desc: t('landing.bulkEncryptDesc', 'Encrypt multiple'), requiresDocument: false },
  ];

  // Filter tools
  const filteredTools = allTools.filter(tool => {
    const matchesQuery = searchQuery.trim() === '' ||
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery;
  });

  const handleSelect = (tool: Tool) => {
    if (tool.requiresDocument && !hasDocument) {
      return; // Can't use this tool without document
    }
    onAction(tool.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title=""
      description=""
      size="md"
    >
      <div className="w-full pt-2">
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('tools.searchPlaceholder', 'Search tools...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tools List */}
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>{t('tools.noResults', 'No tools found')}</p>
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isDisabled = tool.requiresDocument && !hasDocument;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelect(tool)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-muted/30'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="text-primary">{tool.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{tool.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{tool.desc}</div>
                  </div>
                  {isDisabled && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {t('tools.requiresDocument', 'Open PDF first')}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Hint */}
        <div className="mt-4 pt-3 border-t border-border text-center text-xs text-muted-foreground">
          {t('tools.searchHint', 'Press Ctrl+K to open this search anytime')}
        </div>
      </div>
    </Dialog>
  );
}
