/**
 * Bulk Encrypt PDF Dialog
 * Dialog for encrypting multiple PDF files with same password
 */

import { useState, useCallback } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { securityService } from '../../lib/security.service';

interface BulkEncryptDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FileItem {
  file: File;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export function BulkEncryptDialog({ open, onClose }: BulkEncryptDialogProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState({
    printing: true,
    modifying: false,
    copying: false,
    annotating: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleSelectFiles = useCallback(async () => {
    const result = await window.electronAPI.openMultipleFilesDialog();
    if (result && result.length > 0) {
      const newFiles: FileItem[] = result.map(f => ({
        file: new File([new Uint8Array(f.data).buffer], f.name, { type: 'application/pdf' }),
        name: f.name,
        status: 'pending' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };

  // Handle bulk encryption
  const handleBulkEncrypt = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    if (!userPassword) {
      setError('User password is required');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: files.length });

    const updatedFiles = [...files];

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
      setFiles([...updatedFiles]);

      try {
        // Encrypt the file
        const encryptedBytes = await securityService.encryptPDF(files[i].file, {
          userPassword,
          ownerPassword: ownerPassword || undefined,
          permissions,
        });

        // Save encrypted file
        const defaultName = files[i].name.replace('.pdf', '_encrypted.pdf');
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          await window.electronAPI.savePdfFile(filePath, encryptedBytes);
          updatedFiles[i] = { ...updatedFiles[i], status: 'done' };
        } else {
          updatedFiles[i] = { ...updatedFiles[i], status: 'pending' };
        }
      } catch (err: any) {
        updatedFiles[i] = { 
          ...updatedFiles[i], 
          status: 'error', 
          error: err.message 
        };
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);

    // Check if all successful
    const allDone = updatedFiles.every(f => f.status === 'done');
    if (allDone) {
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setUserPassword('');
    setOwnerPassword('');
    setProgress({ current: 0, total: 0 });
    setError(null);
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="🔒 Bulk Encrypt PDFs"
      description="Encrypt multiple PDF files with the same password"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleBulkEncrypt} disabled={isProcessing || files.length === 0}>
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">
                  Encrypting {progress.current}/{progress.total}...
                </span>
              </>
            ) : (
              `Encrypt ${files.length} File${files.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* File selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              PDF Files ({files.length} selected)
            </label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectFiles}>
                + Add Files
              </Button>
              {files.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFiles}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* File list */}
          {files.length > 0 ? (
            <div className="max-h-32 overflow-y-auto rounded-md border border-gray-200 p-2 dark:border-gray-700">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {file.status === 'pending' && <span>📄</span>}
                    {file.status === 'processing' && <Spinner size="sm" />}
                    {file.status === 'done' && <span>✅</span>}
                    {file.status === 'error' && <span>❌</span>}
                    <span className={file.status === 'error' ? 'text-red-500' : ''}>
                      {file.name}
                    </span>
                  </div>
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
              <p className="text-sm text-gray-500">
                Click "Add Files" to select PDFs to encrypt
              </p>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            User Password (required)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Enter password for all files"
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {userPassword && <PasswordStrengthMeter password={userPassword} />}
        </div>

        {/* Owner Password (optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Owner Password <span className="text-xs text-gray-500">(optional)</span>
          </label>
          <input
            type="password"
            value={ownerPassword}
            onChange={(e) => setOwnerPassword(e.target.value)}
            placeholder="Enter owner password"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* Permissions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Permissions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'printing' as const, label: '🖨️ Print' },
              { key: 'copying' as const, label: '📋 Copy' },
              { key: 'modifying' as const, label: '✏️ Edit' },
              { key: 'annotating' as const, label: '💬 Annotate' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={() => togglePermission(key)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">
              Processing file {progress.current} of {progress.total}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
