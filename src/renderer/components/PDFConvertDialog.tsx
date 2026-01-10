/**
 * PDF Convert Dialog Component
 * Dialog for converting PDF to Word/Excel with dual method selection
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Sheet, Download, X, CheckCircle, AlertCircle, Loader2, Zap, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { convertPdfToWord, downloadBlob, type ConversionProgress } from '../lib/pdf-to-word.service';
import { convertPdfToExcel } from '../lib/pdf-to-excel.service';

interface PDFConvertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  fileName: string;
}

type ConvertFormat = 'word' | 'excel';
type ConvertMethod = 'quick' | 'libreoffice';
type ConvertState = 'idle' | 'converting' | 'success' | 'error';

interface LibreOfficeStatus {
  installed: boolean;
  path: string | null;
}

export function PDFConvertDialog({ isOpen, onClose, pdfBytes, fileName }: PDFConvertDialogProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ConvertFormat>('word');
  const [method, setMethod] = useState<ConvertMethod>('quick');
  const [state, setState] = useState<ConvertState>('idle');
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultPath, setResultPath] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [loStatus, setLoStatus] = useState<LibreOfficeStatus>({ installed: false, path: null });
  const [loDownloadUrl, setLoDownloadUrl] = useState<string>('');
  const [checkingLo, setCheckingLo] = useState(true);

  // Check LibreOffice installation on mount
  useEffect(() => {
    if (isOpen) {
      checkLibreOffice();
    }
  }, [isOpen]);

  const checkLibreOffice = async () => {
    setCheckingLo(true);
    try {
      const status = await window.electronAPI.checkLibreOfficeForPdf();
      setLoStatus(status);
      const url = await window.electronAPI.getLibreOfficeDownloadUrl();
      setLoDownloadUrl(url);
    } catch (err) {
      console.error('[PDFConvert] Failed to check LibreOffice:', err);
      setLoStatus({ installed: false, path: null });
    }
    setCheckingLo(false);
  };

  const handleConvert = useCallback(async () => {
    if (!pdfBytes) {
      setError(t('convertDialog.noFile', 'No PDF selected'));
      setState('error');
      return;
    }

    setState('converting');
    setError(null);
    setProgress(null);
    setResultBlob(null);
    setResultPath(null);

    try {
      if (method === 'quick') {
        // Use built-in conversion
        const result = format === 'word'
          ? await convertPdfToWord(pdfBytes, setProgress)
          : await convertPdfToExcel(pdfBytes, setProgress);

        if (result.success && result.blob) {
          setResultBlob(result.blob);
          setPageCount(result.pageCount || 0);
          setState('success');
        } else {
          setError(result.error || t('convertDialog.failed', 'Conversion Failed'));
          setState('error');
        }
      } else {
        // Use LibreOffice conversion
        setProgress({ percent: 20, status: t('convertDialog.sendingToLo', 'Sending to LibreOffice...'), currentPage: 0, totalPages: 0 });
        
        const outputFormat = format === 'word' ? 'docx' : 'xlsx';
        const result = await window.electronAPI.convertPdfWithLibreOffice(pdfBytes, outputFormat);

        if (result.success && result.outputPath) {
          setResultPath(result.outputPath);
          setProgress({ percent: 100, status: t('convertDialog.finished', 'Finished!'), currentPage: 0, totalPages: 0 });
          setState('success');
        } else {
          setError(result.error || t('convertDialog.failed', 'Conversion Failed'));
          setState('error');
        }
      }
    } catch (err: any) {
      setError(err.message || t('errors.unknownError', 'An unknown error occurred'));
      setState('error');
    }
  }, [pdfBytes, format, method]);

  const handleDownload = useCallback(async () => {
    if (method === 'quick' && resultBlob) {
      const baseName = fileName.replace(/\.pdf$/i, '');
      const extension = format === 'word' ? '.docx' : '.xlsx';
      downloadBlob(resultBlob, baseName + extension);
    } else if (method === 'libreoffice' && resultPath) {
      // Open file location
      await window.electronAPI.openExternal(`file://${resultPath}`);
    }
  }, [resultBlob, resultPath, fileName, format, method]);

  const handleReset = useCallback(() => {
    setState('idle');
    setProgress(null);
    setError(null);
    setResultBlob(null);
    setResultPath(null);
    setPageCount(0);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const openDownloadUrl = async () => {
    if (loDownloadUrl) {
      await window.electronAPI.openExternal(loDownloadUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('convertDialog.title', 'Convert PDF')}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Idle State - Selection */}
        {state === 'idle' && (
          <>
            {/* Format Selection */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('convertDialog.selectFormat', 'Select output format:')}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setFormat('word')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  format === 'word'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-6 h-6 ${format === 'word' ? 'text-blue-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <span className={`font-medium block ${format === 'word' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Word
                  </span>
                  <span className="text-xs text-gray-500">.docx</span>
                </div>
              </button>

              <button
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  format === 'excel'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Sheet className={`w-6 h-6 ${format === 'excel' ? 'text-green-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <span className={`font-medium block ${format === 'excel' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Excel
                  </span>
                  <span className="text-xs text-gray-500">.xlsx</span>
                </div>
              </button>
            </div>

            {/* Method Selection */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('convertDialog.selectMethod', 'Select conversion method:')}
            </p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => setMethod('quick')}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  method === 'quick'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Zap className={`w-5 h-5 mt-0.5 ${method === 'quick' ? 'text-purple-500' : 'text-gray-400'}`} />
                <div>
                  <span className={`font-medium block ${method === 'quick' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('convertDialog.quickMethod', 'Quick Method (Built-in)')}
                  </span>
                  <span className="text-xs text-gray-500">{t('convertDialog.quickMethodDesc', 'Basic result, no installation needed')}</span>
                </div>
              </button>

              <button
                onClick={() => loStatus.installed && setMethod('libreoffice')}
                disabled={!loStatus.installed}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  method === 'libreoffice'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : loStatus.installed
                      ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                }`}
              >
                <Sparkles className={`w-5 h-5 mt-0.5 ${method === 'libreoffice' ? 'text-orange-500' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${method === 'libreoffice' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {t('convertDialog.qualityMethod', 'High Quality (LibreOffice)')}
                    </span>
                    {checkingLo ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : loStatus.installed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 block">
                    {loStatus.installed 
                      ? t('convertDialog.qualityMethodDesc', 'Professional results with preserved layout')
                      : t('convertDialog.libreOfficeNotInstalled', 'LibreOffice not installed')}
                  </span>
                  {!loStatus.installed && !checkingLo && (
                    <span
                      onClick={(e) => { e.stopPropagation(); openDownloadUrl(); }}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t('convertDialog.installLibreOffice', 'Install LibreOffice')}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>{t('convertDialog.note', 'Note:')}</strong> {method === 'quick' 
                  ? t('convertDialog.noteQuick', 'Quick method is suitable for simple text PDFs. Complex formatting may be lost.')
                  : t('convertDialog.noteQuality', 'LibreOffice provides best results for documents with complex layouts.')}
              </p>
            </div>

            {/* Convert Button */}
            <Button
              onClick={handleConvert}
              className="w-full"
            >
              {format === 'word' ? (
                <FileText className="w-4 h-4 mr-2" />
              ) : (
                <Sheet className="w-4 h-4 mr-2" />
              )}
              {t('convertDialog.convertTo', 'Convert to {{format}}', { format: format === 'word' ? 'Word' : 'Excel' })}
            </Button>
          </>
        )}

        {/* Converting State */}
        {state === 'converting' && (
          <div className="py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {progress?.status || t('convertDialog.processing', 'Processing...')}
              </p>
              {progress && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {progress.percent}%
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="py-8">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('convertDialog.success', 'Conversion Successful!')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {method === 'quick' 
                  ? t('convertDialog.successDescQuick', '{{count}} pages converted to {{format}}', { count: pageCount, format: format === 'word' ? 'Word' : 'Excel' })
                  : t('convertDialog.successDescQuality', 'File successfully converted to {{format}}', { format: format === 'word' ? 'Word' : 'Excel' })}
              </p>

              <div className="flex gap-3">
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  {method === 'quick' ? t('convertDialog.download', 'Download') : t('convertDialog.openFolder', 'Open Folder')}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  {t('convertDialog.convertAgain', 'Convert Again')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="py-8">
            <div className="flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('convertDialog.failed', 'Conversion Failed')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-6 text-center">
                {error}
              </p>

              <Button variant="outline" onClick={handleReset}>
                {t('convertDialog.tryAgain', 'Try Again')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
