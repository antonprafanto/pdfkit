/**
 * Update Notification Component
 * Shows update availability, download progress, and install prompts
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  error: string | null;
  updateInfo: {
    version: string;
    releaseNotes?: string;
    releaseDate?: string;
  } | null;
}

interface UpdateNotificationProps {
  onDismiss?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');

  useEffect(() => {
    // Get current version
    window.electronAPI?.updaterGetVersion?.().then(setCurrentVersion);

    // Listen for status changes
    const unsubscribe = window.electronAPI?.onUpdaterStatusChanged?.((newStatus) => {
      setStatus(newStatus);
      // Show notification when update is available
      if (newStatus.available && !newStatus.downloading && !newStatus.downloaded) {
        setDismissed(false);
      }
    });

    // Get initial status
    window.electronAPI?.updaterGetStatus?.().then(setStatus);

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleCheck = async () => {
    await window.electronAPI?.updaterCheck?.();
  };

  const handleDownload = async () => {
    await window.electronAPI?.updaterDownload?.();
  };

  const handleInstall = async () => {
    window.electronAPI?.updaterInstall?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if dismissed or no update
  if (!status || dismissed || (!status.available && !status.downloading && !status.downloaded && !status.checking && !status.error)) {
    return null;
  }

  return (
    <>
      {/* Update Banner */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${
        status.error 
          ? 'bg-red-500' 
          : status.downloaded 
            ? 'bg-green-500' 
            : 'bg-primary'
      } text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <span className="text-xl">
              {status.checking ? '🔄' : status.error ? '❌' : status.downloaded ? '✅' : status.downloading ? '⬇️' : '🆕'}
            </span>
            
            {/* Message */}
            <div>
              {status.checking && (
                <span>{t('updates.checking', 'Checking for updates...')}</span>
              )}
              {status.error && (
                <span>{t('updates.error', 'Update error')}: {status.error}</span>
              )}
              {status.available && !status.downloading && !status.downloaded && (
                <span>
                  {t('updates.available', 'Update available')}: v{status.updateInfo?.version}
                </span>
              )}
              {status.downloading && (
                <span>
                  {t('updates.downloading', 'Downloading update')}: {status.progress.toFixed(0)}%
                </span>
              )}
              {status.downloaded && (
                <span>
                  {t('updates.ready', 'Update ready to install')} (v{status.updateInfo?.version})
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Download Progress */}
            {status.downloading && (
              <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            )}

            {/* View Changelog */}
            {status.updateInfo?.releaseNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangelog(true)}
                className="text-white hover:bg-white/20"
              >
                {t('updates.changelog', 'Changelog')}
              </Button>
            )}

            {/* Download Button */}
            {status.available && !status.downloading && !status.downloaded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                {t('updates.download', 'Download')}
              </Button>
            )}

            {/* Install Button */}
            {status.downloaded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstall}
                className="text-white hover:bg-white/20 font-semibold"
              >
                {t('updates.installRestart', 'Install & Restart')}
              </Button>
            )}

            {/* Dismiss */}
            {!status.downloading && (
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Changelog Dialog */}
      <Dialog
        open={showChangelog}
        onClose={() => setShowChangelog(false)}
        title={t('updates.changelogTitle', 'What\'s New in v{{version}}', { version: status.updateInfo?.version })}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('updates.currentVersion', 'Current version')}: v{currentVersion}
          </div>
          
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-secondary/50 p-4 rounded-lg overflow-auto max-h-64">
              {status.updateInfo?.releaseNotes || t('updates.noNotes', 'No release notes available.')}
            </pre>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowChangelog(false)}>
              {t('common.close', 'Close')}
            </Button>
            {status.available && !status.downloaded && (
              <Button onClick={() => { handleDownload(); setShowChangelog(false); }}>
                {t('updates.download', 'Download')}
              </Button>
            )}
            {status.downloaded && (
              <Button onClick={handleInstall}>
                {t('updates.installRestart', 'Install & Restart')}
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

// Manual Check for Updates button/link
export const CheckForUpdatesButton: React.FC = () => {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await window.electronAPI?.updaterCheck?.();
    setTimeout(() => setChecking(false), 2000);
  };

  return (
    <Button
      variant="outline"
      onClick={handleCheck}
      disabled={checking}
    >
      {checking ? t('updates.checking', 'Checking...') : t('updates.checkNow', 'Check for Updates')}
    </Button>
  );
};
