/**
 * About Dialog Component
 * Displays app information, version, credits, and license
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './ui/Dialog';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState<string>('...');
  
  useEffect(() => {
    // Get version from Electron API
    window.electronAPI.getAppVersion().then((version) => {
      setAppVersion(version);
    }).catch(() => {
      setAppVersion('1.0.0');
    });
  }, []);
  
  const handleOpenLink = (url: string) => {
    window.electronAPI.openExternal(url);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title={t('about.title')}>
      <div className="space-y-6">
        {/* App Icon & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PDF Kit</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Modern PDF Management Desktop Application
          </p>
        </div>

        {/* Version Info */}
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Version</p>
              <p className="text-gray-600 dark:text-gray-400">{appVersion}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Platform</p>
              <p className="text-gray-600 dark:text-gray-400">Electron 28+</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">License</p>
              <p className="text-gray-600 dark:text-gray-400">MIT License</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Build Date</p>
              <p className="text-gray-600 dark:text-gray-400">Dec 31, 2025</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Features
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>PDF Viewer</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>PDF Editing</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Conversions</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Security</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Annotations</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Forms & Templates</span>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Built With
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Electron', 'React 18', 'TypeScript 5', 'Vite', 'TailwindCSS', 'PDF.js', 'pdf-lib'].map(
              (tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>

        {/* Credits */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Credits</h3>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p>
              <strong>Created by:</strong> Anton Prafanto
            </p>
            <p>
              <strong>Powered by:</strong> Claude Code (Anthropic)
            </p>
            <p>
              <strong>Inspired by:</strong> Stirling PDF, PDF24
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Primary Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenLink('https://github.com/antonprafanto/pdfkit')}
              className="flex-1 rounded-lg bg-gray-800 dark:bg-gray-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              GitHub Repository
            </button>
            <button
              onClick={() => handleOpenLink('https://github.com/antonprafanto/pdfkit/issues')}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Report Issue
            </button>
          </div>

          {/* Support Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenLink('https://wa.me/6281155339393')}
              className="flex-1 rounded-lg bg-green-600 dark:bg-green-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
              title="Contact via WhatsApp: 0811-5533-9393"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Contact Support
            </button>
            <button
              onClick={() => handleOpenLink('https://trakteer.id/limitless7/tip')}
              className="flex-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 px-4 py-2 text-center text-sm font-medium text-white hover:from-pink-600 hover:to-purple-700 dark:hover:from-pink-700 dark:hover:to-purple-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
              title="Support via Trakteer or WhatsApp: 0811-5533-9393"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Support Us
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            For support, feedback, or suggestions, contact us via WhatsApp
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Made with ❤️ by Anton Prafanto
          <br />
          Open Source • MIT License • 2025
        </div>
      </div>
    </Dialog>
  );
};
