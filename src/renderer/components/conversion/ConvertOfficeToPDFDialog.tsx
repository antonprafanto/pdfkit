/**
 * Convert Office to PDF Dialog
 * Three methods: Built-in (mammoth.js) | LibreOffice | Cloud API
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';

interface ConvertOfficeToPDFDialogProps {
  open: boolean;
  onClose: () => void;
  onPdfCreated?: (pdfPath: string) => void;
}

interface LibreOfficeStatus {
  installed: boolean;
  path?: string;
  version?: string;
  downloadUrl: string;
}

type ConversionMethod = 'builtin' | 'libreoffice' | 'cloudapi';

export function ConvertOfficeToPDFDialog({ open, onClose, onPdfCreated }: ConvertOfficeToPDFDialogProps) {
  const [libreOfficeStatus, setLibreOfficeStatus] = useState<LibreOfficeStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [conversionMethod, setConversionMethod] = useState<ConversionMethod>('builtin');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Load saved API key
  useEffect(() => {
    const savedKey = localStorage.getItem('convertapi_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Check LibreOffice installation on open
  useEffect(() => {
    if (open) {
      checkLibreOffice();
      setSelectedFile(null);
      setError(null);
      setSuccess(null);
      setWarnings([]);
    }
  }, [open]);

  const checkLibreOffice = async () => {
    setIsChecking(true);
    try {
      const status = await window.electronAPI.checkLibreOffice();
      setLibreOfficeStatus(status);
    } catch (err) {
      console.error('Error checking LibreOffice:', err);
    }
    setIsChecking(false);
  };

  const handleSelectFile = async () => {
    const filePath = await window.electronAPI.openOfficeFileDialog();
    if (filePath) {
      setSelectedFile(filePath);
      setError(null);
      setSuccess(null);
      setWarnings([]);
    }
  };

  const isDocxFile = (path: string) => {
    return path.toLowerCase().endsWith('.docx') || path.toLowerCase().endsWith('.doc');
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('convertapi_key', key);
  };

  // Helper to prompt user to choose save location
  const promptSaveAs = async (tempPath: string, originalFileName: string): Promise<string | null> => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    const savePath = await window.electronAPI.saveFileDialog(`${baseName}.pdf`);
    
    if (savePath) {
      // Copy file using main process (fetch not allowed for local files)
      const result = await window.electronAPI.copyFile(tempPath, savePath);
      if (result.success) {
        return savePath;
      }
    }
    return null;
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);

    try {
      if (conversionMethod === 'builtin') {
        // Use mammoth.js (Word only)
        if (!isDocxFile(selectedFile)) {
          setError('Built-in converter only supports Word documents (.docx, .doc).\nFor Excel/PowerPoint, please use LibreOffice or Cloud API.');
          setIsConverting(false);
          return;
        }

        const result = await window.electronAPI.convertDocxMammoth(selectedFile);
        
        if (result.success && result.outputPath) {
          if (result.warnings && result.warnings.length > 0) {
            setWarnings(result.warnings);
          }
          // Prompt user to save
          const savedPath = await promptSaveAs(result.outputPath, getFileName(selectedFile));
          if (savedPath) {
            setSuccess(`✅ Conversion successful!\n\nPDF saved to:\n${savedPath}`);
            onPdfCreated?.(savedPath);
          } else {
            setSuccess(`✅ Conversion done (not saved)\n\nTemp file at:\n${result.outputPath}`);
          }
        } else {
          setError(result.error || 'Conversion failed');
        }
      } else if (conversionMethod === 'libreoffice') {
        // Use LibreOffice
        const result = await window.electronAPI.convertOfficeToPdf(selectedFile);
        
        if (result.success && result.outputPath) {
          // Prompt user to save
          const savedPath = await promptSaveAs(result.outputPath, getFileName(selectedFile));
          if (savedPath) {
            setSuccess(`✅ Conversion successful!\n\nPDF saved to:\n${savedPath}`);
            onPdfCreated?.(savedPath);
          } else {
            setSuccess(`✅ Conversion done (not saved)\n\nTemp file at:\n${result.outputPath}`);
          }
        } else {
          setError(result.error || 'Conversion failed');
        }
      } else if (conversionMethod === 'cloudapi') {
        // Cloud API (ConvertAPI)
        if (!apiKey.trim()) {
          setError('Please enter your ConvertAPI key first.\nClick "How to get API key?" for instructions.');
          setIsConverting(false);
          return;
        }

        const result = await window.electronAPI.convertCloudAPI(selectedFile, apiKey.trim());
        
        if (result.success && result.outputPath) {
          // Prompt user to save
          const savedPath = await promptSaveAs(result.outputPath, getFileName(selectedFile));
          if (savedPath) {
            setSuccess(`✅ Cloud conversion successful!\n\nPDF saved to:\n${savedPath}`);
            onPdfCreated?.(savedPath);
          } else {
            setSuccess(`✅ Conversion done (not saved)\n\nTemp file at:\n${result.outputPath}`);
          }
        } else {
          setError(result.error || 'Cloud conversion failed. Check your API key and internet connection.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
    }

    setIsConverting(false);
  };

  const getFileName = (path: string) => path.split(/[/\\]/).pop() || path;
  const getFileExtension = (path: string) => path.split('.').pop()?.toLowerCase() || '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="📄 Convert Office to PDF"
      description="Convert Word, Excel, or PowerPoint files to PDF"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleConvert} disabled={!selectedFile || isConverting}>
            {isConverting ? (
              <><Spinner size="sm" /><span className="ml-2">Converting...</span></>
            ) : 'Convert to PDF'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Conversion Method Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Conversion Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Built-in */}
            <button
              onClick={() => setConversionMethod('builtin')}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                conversionMethod === 'builtin'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">⚡ Built-in</div>
              <div className="text-xs text-gray-500 mt-1">
                No install<br/>Word only
              </div>
              <div className="text-xs text-amber-600 mt-1">⚠️ Basic quality</div>
            </button>
            
            {/* LibreOffice */}
            <button
              onClick={() => setConversionMethod('libreoffice')}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                conversionMethod === 'libreoffice'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">🏢 LibreOffice</div>
              <div className="text-xs text-gray-500 mt-1">
                High quality<br/>All formats
              </div>
              {!isChecking && !libreOfficeStatus?.installed && (
                <div className="text-xs text-amber-600 mt-1">⚠️ Not installed</div>
              )}
              {!isChecking && libreOfficeStatus?.installed && (
                <div className="text-xs text-green-600 mt-1">✅ Ready</div>
              )}
            </button>
            
            {/* Cloud API */}
            <button
              onClick={() => setConversionMethod('cloudapi')}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                conversionMethod === 'cloudapi'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">☁️ Cloud API</div>
              <div className="text-xs text-gray-500 mt-1">
                Best quality<br/>Needs internet
              </div>
              {apiKey ? (
                <div className="text-xs text-green-600 mt-1">✅ Key saved</div>
              ) : (
                <div className="text-xs text-amber-600 mt-1">⚠️ Need API key</div>
              )}
            </button>
          </div>
        </div>

        {/* Built-in Warning */}
        {conversionMethod === 'builtin' && (
          <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-900/20 border border-amber-200">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">⚠️ Quality Notice</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Built-in converter provides <strong>basic formatting</strong>. Complex layouts, images, and tables may not appear exactly as the original.
              For professional documents, use <strong>LibreOffice</strong> or <strong>Cloud API</strong>.
            </p>
          </div>
        )}

        {/* LibreOffice Status */}
        {conversionMethod === 'libreoffice' && (
          <>
            {isChecking ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Spinner size="sm" />Checking LibreOffice...
              </div>
            ) : libreOfficeStatus?.installed ? (
              <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ LibreOffice {libreOfficeStatus.version} ready - Best offline quality!
                </p>
              </div>
            ) : (
              <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">⚠️ LibreOffice not installed</p>
                <p className="text-xs text-amber-600 mb-2">Download LibreOffice (free) for high-quality offline conversion.</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.electronAPI.openExternal(libreOfficeStatus?.downloadUrl || 'https://www.libreoffice.org/download/')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700">
                    Download LibreOffice
                  </button>
                  <button onClick={checkLibreOffice}
                    className="px-3 py-1.5 border border-amber-600 text-amber-600 rounded text-xs font-medium hover:bg-amber-50">
                    Re-check
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Cloud API Settings */}
        {conversionMethod === 'cloudapi' && (
          <div className="space-y-3">
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">☁️ Cloud API (ConvertAPI)</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Uses ConvertAPI.com for high-quality conversion. Requires internet.
                <br/>Free tier: 250 conversions/month.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="Enter your ConvertAPI key"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
              <button
                onClick={() => setShowApiHelp(!showApiHelp)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showApiHelp ? '▼ Hide instructions' : '▶ How to get API key?'}
              </button>
            </div>

            {showApiHelp && (
              <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800 text-xs space-y-2">
                <p className="font-medium">📋 Steps to get free API key:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Go to <button onClick={() => window.electronAPI.openExternal('https://www.convertapi.com')} className="text-blue-600 hover:underline">convertapi.com</button></li>
                  <li>Click "Sign Up" (free account)</li>
                  <li>Verify your email</li>
                  <li>Go to Dashboard → API Keys</li>
                  <li>Copy your "Secret" key</li>
                  <li>Paste it above</li>
                </ol>
                <p className="text-gray-500 mt-2">Free tier includes 250 conversions/month!</p>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-line">{success}</p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">⚠️ Warnings:</p>
            <ul className="text-xs text-yellow-600 dark:text-yellow-400 list-disc pl-4">
              {warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
              {warnings.length > 3 && <li>...and {warnings.length - 3} more</li>}
            </ul>
          </div>
        )}

        {/* File Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Document</label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getFileExtension(selectedFile).includes('doc') ? '📝' :
                     getFileExtension(selectedFile).includes('xls') ? '📊' :
                     getFileExtension(selectedFile).includes('ppt') ? '📽️' : '📄'}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 truncate">{getFileName(selectedFile)}</span>
                </div>
              ) : (
                <span className="text-gray-400">No file selected</span>
              )}
            </div>
            <Button variant="outline" onClick={handleSelectFile}>Browse...</Button>
          </div>
          <p className="text-xs text-gray-500">
            {conversionMethod === 'builtin' 
              ? 'Supports: .docx, .doc (Word only)'
              : 'Supports: .docx, .doc, .xls, .xlsx, .ppt, .pptx, .odt, .ods, .odp'}
          </p>
        </div>
      </div>
    </Dialog>
  );
}
