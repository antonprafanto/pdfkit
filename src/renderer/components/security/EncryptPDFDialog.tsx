/**
 * Encrypt PDF Dialog
 * Dialog for encrypting PDFs with passwords and permissions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Spinner, useToast } from '../ui';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { securityService } from '../../lib/security.service';
import { usePDFStore } from '../../store/pdf-store';

interface EncryptPDFDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EncryptPDFDialog({ open, onClose }: EncryptPDFDialogProps) {
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [permissions, setPermissions] = useState({
    printing: true,
    modifying: false,
    copying: false,
    annotating: true,
  });
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { document, fileName } = usePDFStore();
  const toast = useToast();
  const { t } = useTranslation();

  const handleEncrypt = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    if (!userPassword && !ownerPassword) {
      setError('Please provide at least one password');
      return;
    }

    try {
      setIsEncrypting(true);
      setError(null);

      // Get PDF data
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName, { type: 'application/pdf' });

      // Encrypt PDF
      const encryptedBytes = await securityService.encryptPDF(file, {
        userPassword: userPassword.trim(),
        ownerPassword: ownerPassword.trim() || undefined,
        permissions,
      });

      // Save encrypted PDF
      const defaultName = fileName.replace('.pdf', '_encrypted.pdf');
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, encryptedBytes);

        if (result.success) {
          toast.success('PDF encrypted successfully!', `Saved to ${filePath.split(/[\\/]/).pop()}`);
          onClose();
          // Reset form
          setUserPassword('');
          setOwnerPassword('');
          setPermissions({
            printing: true,
            modifying: false,
            copying: false,
            annotating: true,
          });
        } else {
          toast.error('Failed to save encrypted PDF', result.error);
          setError(result.error || 'Failed to save encrypted PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt PDF');
    } finally {
      setIsEncrypting(false);
    }
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`\ud83d\udd12 ${t('encrypt.title')}`}
      description={t('encrypt.description')}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isEncrypting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleEncrypt} disabled={isEncrypting}>
            {isEncrypting ? <Spinner size="sm" /> : t('encrypt.encryptButton')}
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

        {/* User Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            User Password (required to open PDF)
          </label>
          <div className="relative">
            <input
              type={showUserPassword ? 'text' : 'password'}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowUserPassword(!showUserPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showUserPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {userPassword && <PasswordStrengthMeter password={userPassword} />}
        </div>

        {/* Owner Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Owner Password (required to edit PDF) 
            <span className="ml-1 text-xs text-gray-500">Optional</span>
          </label>
          <div className="relative">
            <input
              type={showOwnerPassword ? 'text' : 'password'}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Enter owner password"
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowOwnerPassword(!showOwnerPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showOwnerPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Document Permissions
          </label>
          <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
            {[
              { key: 'printing' as const, label: 'Allow Printing', icon: '🖨️' },
              { key: 'copying' as const, label: 'Allow Copying Text', icon: '📋' },
              { key: 'modifying' as const, label: 'Allow Editing', icon: '✏️' },
              { key: 'annotating' as const, label: 'Allow Annotations', icon: '💬' },
            ].map(({ key, label, icon }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={() => togglePermission(key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {icon} {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> User password is required to open the PDF. Owner password allows 
            bypassing permissions. If only owner password is set, the PDF can be opened without password 
            but permissions are enforced.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
