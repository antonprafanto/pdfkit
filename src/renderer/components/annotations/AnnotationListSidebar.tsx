/**
 * Annotation List Sidebar
 * Shows all annotations with navigation and management
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnotationStore, Annotation } from '../../store/annotation-store';
import { useEditingStore } from '../../store/editing-store';
import { embedAnnotationsToPdf } from '../../lib/pdf-annotation-embed.service';

interface AnnotationListSidebarProps {
  onNavigateToPage?: (pageNumber: number) => void;
}

const TYPE_ICONS: Record<string, string> = {
  highlight: '🖍️',
  'sticky-note': '💬',
  drawing: '✏️',
  stamp: '🔖',
  text: '📝',
};

const TYPE_LABELS: Record<string, string> = {
  highlight: 'Highlight',
  'sticky-note': 'Note',
  drawing: 'Drawing',
  stamp: 'Stamp',
  text: 'Text',
};

export function AnnotationListSidebar({ onNavigateToPage }: AnnotationListSidebarProps) {
  const { modifiedPdfBytes, originalFile } = useEditingStore();
  const {
    annotations,
    selectedAnnotationId,
    selectAnnotation,
    deleteAnnotation,
  } = useAnnotationStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const { t } = useTranslation();

  // Group annotations by page
  const annotationsByPage = annotations.reduce((acc, ann) => {
    if (!acc[ann.pageNumber]) {
      acc[ann.pageNumber] = [];
    }
    acc[ann.pageNumber].push(ann);
    return acc;
  }, {} as Record<number, Annotation[]>);

  const sortedPages = Object.keys(annotationsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  const getAnnotationPreview = (ann: Annotation): string => {
    switch (ann.type) {
      case 'highlight':
        return ann.selectedText?.slice(0, 30) || 'Highlighted text';
      case 'sticky-note':
        return ann.content?.slice(0, 30) || 'Empty note';
      case 'stamp':
        return ann.stampType.toUpperCase();
      case 'drawing':
        return ann.tool.charAt(0).toUpperCase() + ann.tool.slice(1);
      default:
        return 'Annotation';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleSaveWithAnnotations = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Get PDF bytes
      let pdfBytes: Uint8Array | null = modifiedPdfBytes;
      if (!pdfBytes && originalFile) {
        const buffer = await originalFile.arrayBuffer();
        pdfBytes = new Uint8Array(buffer);
      }
      
      if (!pdfBytes) {
        setSaveStatus('❌ No PDF loaded');
        setIsSaving(false);
        return;
      }
      
      // Embed annotations
      const annotatedPdf = await embedAnnotationsToPdf(pdfBytes, annotations);
      
      // Get save path using Electron dialog
      const filePath = await window.electronAPI.saveFileDialog('annotated.pdf');
      
      if (!filePath) {
        setSaveStatus('❌ Save cancelled');
        setIsSaving(false);
        return;
      }
      
      // Save the file
      await window.electronAPI.savePdfFile(filePath, annotatedPdf);
      setSaveStatus(`✅ Saved to ${filePath.split(/[/\\]/).pop()}`);
      
    } catch (err: any) {
      console.error('Failed to save PDF with annotations:', err);
      setSaveStatus(`❌ Error: ${err.message || 'Unknown error'}`);
    }
    
    setIsSaving(false);
    
    // Clear status after 3 seconds
    setTimeout(() => setSaveStatus(null), 3000);
  };

  if (annotations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <p className="text-sm font-medium">{t('annotations.noAnnotations')}</p>
        <p className="text-xs text-center mt-1">
          {t('annotations.noAnnotationsHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          📋 {t('annotations.title')}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {annotations.length} {t('common.pages')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedPages.map((pageNum) => (
          <div key={pageNum} className="border-b border-gray-100 dark:border-gray-800">
            {/* Page Header */}
            <button
              onClick={() => onNavigateToPage?.(pageNum)}
              className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('common.page')} {pageNum}
              </span>
              <span className="text-xs text-gray-400">
                {annotationsByPage[pageNum].length}
              </span>
            </button>

            {/* Annotations List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {annotationsByPage[pageNum].map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    selectAnnotation(ann.id);
                    onNavigateToPage?.(ann.pageNumber);
                  }}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    selectedAnnotationId === ann.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: ann.color }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* Type and preview */}
                      <div className="flex items-center gap-1">
                        <span>{TYPE_ICONS[ann.type]}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {TYPE_LABELS[ann.type]}
                        </span>
                      </div>
                      
                      {/* Preview text */}
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {getAnnotationPreview(ann)}
                      </p>
                      
                      {/* Date */}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(ann.createdAt)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(ann.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      title="Delete annotation"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export/Save Actions */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {/* Save PDF with Annotations - Primary Action */}
        <button
          onClick={handleSaveWithAnnotations}
          disabled={isSaving}
          className="w-full px-3 py-2.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>💾 Save PDF with Annotations</>
          )}
        </button>
        
        {/* Status message */}
        {saveStatus && (
          <p className={`text-xs text-center ${saveStatus.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
            {saveStatus}
          </p>
        )}
        
        {/* Info */}
        <p className="text-xs text-gray-400 text-center">
          Saves annotations into PDF file (viewable in any PDF reader)
        </p>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <button
            onClick={() => {
              const data = JSON.stringify(annotations, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'annotations.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            📥 Export as JSON
          </button>
        </div>
      </div>
    </div>
  );
}
