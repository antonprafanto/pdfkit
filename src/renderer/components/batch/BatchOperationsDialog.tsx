/**
 * Batch Operations Dialog Component
 * Dialog for processing multiple PDF files with various operations
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner, useToast } from '../ui';
import { batchService, BatchFile, BatchProgress, BatchOperationType } from '../../lib/batch.service';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { watermarkService } from '../../lib/watermark.service';
import { securityService } from '../../lib/security.service';
import { compressionService } from '../../lib/compression.service';

interface BatchOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  defaultOperation?: BatchOperationType;
}

interface OperationConfig {
  id: BatchOperationType;
  name: string;
  icon: string;
  description: string;
}

const OPERATIONS: OperationConfig[] = [
  { id: 'merge', name: 'Merge All', icon: '🔗', description: 'Combine all PDFs into one' },
  { id: 'convert', name: 'Convert to Images', icon: '🖼️', description: 'Export pages as images' },
  { id: 'compress', name: 'Compress All', icon: '📦', description: 'Reduce file sizes' },
  { id: 'watermark', name: 'Add Watermark', icon: '💧', description: 'Add text to all pages' },
  { id: 'encrypt', name: 'Encrypt All', icon: '🔒', description: 'Password protect files' },
];

export function BatchOperationsDialog({ open, onClose, defaultOperation = 'merge' }: BatchOperationsDialogProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [operation, setOperation] = useState<BatchOperationType>(defaultOperation);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  
  // Operation-specific settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [password, setPassword] = useState('');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  
  const toast = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFiles([]);
      setOperation(defaultOperation);
      setIsProcessing(false);
      setProgress(null);
      setError(null);
      setCompleted(false);
      setWatermarkText('CONFIDENTIAL');
      setPassword('');
      setImageFormat('png');
    }
  }, [open, defaultOperation]);

  const handleSelectFiles = async () => {
    try {
      const selectedFiles = await window.electronAPI.openMultipleFilesDialog();
      
      if (!selectedFiles || selectedFiles.length === 0) return;

      const newFiles: BatchFile[] = selectedFiles.map(({ name, data }) => {
        const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
        const file = new File([arrayBuffer], name, { type: 'application/pdf' });
        return batchService.createBatchFile(file);
      });

      setFiles([...files, ...newFiles]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please add files first');
      return;
    }

    if (operation === 'encrypt' && !password) {
      setError('Please enter a password');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setCompleted(false);

      switch (operation) {
        case 'merge':
          await handleMerge();
          break;
        case 'convert':
          await handleBatchConvert();
          break;
        case 'compress':
          await handleBatchCompress();
          break;
        case 'watermark':
          await handleBatchWatermark();
          break;
        case 'encrypt':
          await handleBatchEncrypt();
          break;
      }

      setCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Batch operation failed');
      toast.error('Batch operation failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    setProgress({ currentFile: 1, totalFiles: files.length, currentFileName: 'Merging...', overallProgress: 0.5, fileProgress: 0.5 });
    
    const pdfFiles = files.map((f) => f.file);
    const ranges = files.map(() => 'all');
    
    const mergedBytes = await pdfManipulationService.mergePDFs(pdfFiles, ranges);
    
    // Save merged PDF
    const defaultName = 'merged_batch.pdf';
    const filePath = await window.electronAPI.saveFileDialog(defaultName);
    
    if (filePath) {
      const result = await window.electronAPI.savePdfFile(filePath, mergedBytes);
      if (result.success) {
        toast.success('PDFs merged!', `${files.length} files combined`);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    }
  };

  const handleBatchConvert = async () => {
    // Save each image file individually
    let totalImages = 0;
    
    for (let i = 0; i < files.length; i++) {
      const batchFile = files[i];
      setProgress({
        currentFile: i + 1,
        totalFiles: files.length,
        currentFileName: batchFile.name,
        overallProgress: i / files.length,
        fileProgress: 0,
      });

      try {
        // Load PDF with PDF.js
        const arrayBuffer = await batchFile.file.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);
        
        // We need to use pdfjs for rendering
        const pdfjsLib = await import('pdfjs-dist');
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const numPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const scale = 2;
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            
            // Convert to image data
            const mimeType = imageFormat === 'jpg' ? 'image/jpeg' : `image/${imageFormat}`;
            const quality = imageFormat === 'png' ? undefined : 0.9;
            const dataUrl = canvas.toDataURL(mimeType, quality);
            
            // Convert data URL to Uint8Array
            const base64 = dataUrl.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            
            const baseName = batchFile.name.replace('.pdf', '');
            const imageName = `${baseName}_page_${pageNum}.${imageFormat}`;
            const filePath = await window.electronAPI.saveFileDialog(imageName);
            
            if (filePath) {
              await window.electronAPI.savePdfFile(filePath, bytes);
              totalImages++;
            }
          }
          
          setProgress({
            currentFile: i + 1,
            totalFiles: files.length,
            currentFileName: `${batchFile.name} (page ${pageNum}/${numPages})`,
            overallProgress: (i + pageNum / numPages) / files.length,
            fileProgress: pageNum / numPages,
          });
        }
      } catch (err) {
        console.error(`Error converting ${batchFile.name}:`, err);
      }
    }
    
    toast.success('Batch conversion complete!', `${totalImages} images exported`);
  };

  const handleBatchCompress = async () => {
    const results = await batchService.processFiles(
      files,
      async (batchFile, onFileProgress) => {
        const arrayBuffer = await batchFile.file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        const compressed = await compressionService.compressPDF(
          pdfBytes,
          { quality: 'medium', removeMetadata: true, optimizeImages: true },
          onFileProgress
        );
        
        return compressed;
      },
      setProgress
    );

    // Save all compressed files
    let successCount = 0;
    for (const { file, result, error: err } of results) {
      if (result && !err) {
        const newName = file.name.replace('.pdf', '_compressed.pdf');
        const filePath = await window.electronAPI.saveFileDialog(newName);
        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, result);
          if (saveResult.success) successCount++;
        }
      }
    }

    toast.success('Batch compression complete!', `${successCount} of ${files.length} files processed`);
  };

  const handleBatchWatermark = async () => {
    const results = await batchService.processFiles(
      files,
      async (batchFile, onFileProgress) => {
        onFileProgress(0.3);
        
        const watermarked = await watermarkService.addTextWatermark(batchFile.file, {
          text: watermarkText,
          fontSize: 48,
          opacity: 0.3,
          rotation: 45,
          position: 'diagonal',
        });
        
        onFileProgress(1);
        return watermarked;
      },
      setProgress
    );

    // Save all watermarked files
    let successCount = 0;
    for (const { file, result, error: err } of results) {
      if (result && !err) {
        const newName = file.name.replace('.pdf', '_watermarked.pdf');
        const filePath = await window.electronAPI.saveFileDialog(newName);
        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, result);
          if (saveResult.success) successCount++;
        }
      }
    }

    toast.success('Batch watermarking complete!', `${successCount} of ${files.length} files processed`);
  };

  const handleBatchEncrypt = async () => {
    const results = await batchService.processFiles(
      files,
      async (batchFile, onFileProgress) => {
        onFileProgress(0.3);
        
        const encrypted = await securityService.encryptPDF(batchFile.file, {
          userPassword: password,
          permissions: { printing: true, modifying: false, copying: false, annotating: true },
        });
        
        onFileProgress(1);
        return encrypted;
      },
      setProgress
    );

    // Save all encrypted files
    let successCount = 0;
    for (const { file, result, error: err } of results) {
      if (result && !err) {
        const newName = file.name.replace('.pdf', '_encrypted.pdf');
        const filePath = await window.electronAPI.saveFileDialog(newName);
        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, result);
          if (saveResult.success) successCount++;
        }
      }
    }

    toast.success('Batch encryption complete!', `${successCount} of ${files.length} files processed`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="📂 Batch Operations"
      description="Process multiple PDF files at once"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {completed ? 'Done' : 'Cancel'}
          </Button>
          {!completed && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSelectFiles} disabled={isProcessing}>
                Add Files
              </Button>
              <Button onClick={handleProcess} disabled={files.length === 0 || isProcessing}>
                {isProcessing ? <Spinner size="sm" /> : `Process ${files.length} file(s)`}
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Progress */}
        {isProcessing && progress && (
          <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="mb-2 flex justify-between text-sm text-blue-700 dark:text-blue-300">
              <span>{progress.currentFileName}</span>
              <span>{progress.currentFile} / {progress.totalFiles}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                style={{ width: `${progress.overallProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed */}
        {completed && (
          <div className="rounded-md bg-green-50 p-4 text-center dark:bg-green-900/20">
            <p className="text-lg font-medium text-green-800 dark:text-green-200">✅ Batch operation complete!</p>
          </div>
        )}

        {/* Settings (only show before processing) */}
        {!isProcessing && !completed && (
          <>
            {/* Operation selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Operation</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {OPERATIONS.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setOperation(op.id)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      operation === op.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {op.icon} {op.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{op.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Operation-specific settings */}
            {operation === 'convert' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Format</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setImageFormat(fmt)}
                      className={`rounded-lg border-2 p-2 text-center text-sm transition-colors ${
                        imageFormat === fmt
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {operation === 'watermark' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="CONFIDENTIAL"
                />
              </div>
            )}

            {operation === 'encrypt' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter password"
                />
              </div>
            )}

            {/* File list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Files ({files.length})
                </label>
                <span className="text-xs text-gray-500">
                  Total: {batchService.formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
                </span>
              </div>

              {files.length === 0 ? (
                <button
                  onClick={handleSelectFiles}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to select PDF files
                  </p>
                </button>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2 dark:border-gray-700">
                  {files.map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-sm dark:bg-gray-800"
                    >
                      <span className="w-6 text-center text-xs text-gray-400">{index + 1}</span>
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">{batchService.formatBytes(file.size)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === files.length - 1}
                          className="p-1 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
