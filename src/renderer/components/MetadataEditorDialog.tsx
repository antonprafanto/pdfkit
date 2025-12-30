/**
 * Metadata Editor Dialog
 * Allows users to view and edit PDF metadata (title, author, subject, keywords)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDocument } from 'pdf-lib';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: Date;
  modificationDate?: Date;
}

interface MetadataEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  pdfBytes: ArrayBuffer | null;
  onSave?: (updatedBytes: Uint8Array) => void;
}

export const MetadataEditorDialog: React.FC<MetadataEditorDialogProps> = ({
  isOpen,
  onClose,
  filePath,
  pdfBytes,
  onSave,
}) => {
  const { t } = useTranslation();
  const [metadata, setMetadata] = useState<PDFMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
  });
  const [originalMetadata, setOriginalMetadata] = useState<PDFMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load metadata when dialog opens
  useEffect(() => {
    if (isOpen && pdfBytes) {
      loadMetadata();
    }
  }, [isOpen, pdfBytes]);

  const loadMetadata = async () => {
    if (!pdfBytes) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      const loadedMetadata: PDFMetadata = {
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: (pdfDoc.getKeywords() || '').toString(),
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || '',
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
      };
      
      setMetadata(loadedMetadata);
      setOriginalMetadata(loadedMetadata);
    } catch (err: any) {
      setError(err.message || 'Failed to load metadata');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pdfBytes || !onSave) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      // Update metadata
      pdfDoc.setTitle(metadata.title);
      pdfDoc.setAuthor(metadata.author);
      pdfDoc.setSubject(metadata.subject);
      pdfDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean));
      pdfDoc.setCreator(metadata.creator || 'PDF Kit');
      pdfDoc.setModificationDate(new Date());
      
      const updatedBytes = await pdfDoc.save();
      onSave(updatedBytes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save metadata');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = originalMetadata && (
    metadata.title !== originalMetadata.title ||
    metadata.author !== originalMetadata.author ||
    metadata.subject !== originalMetadata.subject ||
    metadata.keywords !== originalMetadata.keywords
  );

  const formatDate = (date?: Date) => {
    if (!date) return t('metadata.unknown', 'Unknown');
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t('metadata.title', 'Edit PDF Metadata')}
      size="lg"
    >
      <div className="space-y-4">
        {/* File Info */}
        <div className="text-sm text-muted-foreground truncate">
          📄 {filePath.split(/[/\\]/).pop()}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : (
          <>
            {/* Editable Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('metadata.docTitle', 'Title')}
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary"
                  placeholder={t('metadata.titlePlaceholder', 'Document title')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('metadata.author', 'Author')}
                </label>
                <input
                  type="text"
                  value={metadata.author}
                  onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary"
                  placeholder={t('metadata.authorPlaceholder', 'Author name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('metadata.subject', 'Subject')}
                </label>
                <input
                  type="text"
                  value={metadata.subject}
                  onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary"
                  placeholder={t('metadata.subjectPlaceholder', 'Document subject or description')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('metadata.keywords', 'Keywords')}
                </label>
                <input
                  type="text"
                  value={metadata.keywords}
                  onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary"
                  placeholder={t('metadata.keywordsPlaceholder', 'keyword1, keyword2, keyword3')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('metadata.keywordsHint', 'Separate keywords with commas')}
                </p>
              </div>
            </div>

            {/* Read-only Info */}
            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('metadata.info', 'Document Information')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('metadata.creator', 'Creator')}:</span>
                  <span className="ml-2 text-foreground">{metadata.creator || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('metadata.producer', 'Producer')}:</span>
                  <span className="ml-2 text-foreground">{metadata.producer || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('metadata.created', 'Created')}:</span>
                  <span className="ml-2 text-foreground">{formatDate(metadata.creationDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('metadata.modified', 'Modified')}:</span>
                  <span className="ml-2 text-foreground">{formatDate(metadata.modificationDate)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isLoading}
          >
            {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
