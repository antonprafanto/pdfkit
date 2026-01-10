import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from '../ui';
import { usePDFStore } from '../../store/pdf-store';

interface UnlockPDFDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UnlockPDFDialog({ open, onClose }: UnlockPDFDialogProps) {
  const { t } = useTranslation();
  const { document, fileName } = usePDFStore();
  
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    if (!password.trim()) {
      setError(t('unlockPDF.passwordRequired'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await document.getData();
      
      const result = await window.electronAPI.unlockPDF(pdfBytes, password);

      if (result.success && result.data) {
        const defaultName = fileName.replace('.pdf', '_unlocked.pdf');
        const filePath = await window.electronAPI.saveFileDialog(defaultName);

        if (filePath) {
          const saveResult = await window.electronAPI.savePdfFile(filePath, result.data);
          if (saveResult.success) {
            setPassword('');
            onClose();
          } else {
            setError(saveResult.error || 'Failed to save PDF');
          }
        }
      } else {
        setError(result.error || t('unlockPDF.wrongPassword'));
      }
    } catch (error: any) {
      console.error('Failed to unlock PDF:', error);
      setError(error.message || 'Failed to unlock PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t('unlockPDF.title')}
      description={t('unlockPDF.description')}
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('unlockPDF.password')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder={t('unlockPDF.enterPassword')}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ℹ️ {t('unlockPDF.info')}
          </p>
        </div>

        {/* Warning Box */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            ⚠️ {t('unlockPDF.warning')}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isProcessing}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleUnlock}
          disabled={isProcessing || !password.trim() || !document}
        >
          {isProcessing ? t('unlockPDF.unlocking') : t('unlockPDF.unlock')}
        </Button>
      </div>
    </Dialog>
  );
}
