/**
 * About Dialog Component
 * Displays app information, version, credits, and license
 */

import React from 'react';
import { Dialog } from './ui/Dialog';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="About PDF Kit">
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
              <p className="text-gray-600 dark:text-gray-400">0.1.0 (Development)</p>
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
              <p className="text-gray-600 dark:text-gray-400">Dec 28, 2025</p>
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
              <strong>Inspired by:</strong> Stirling PDF
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <a
            href="https://github.com/antonprafanto/pdfkit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-gray-800 dark:bg-gray-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            GitHub Repository
          </a>
          <a
            href="https://github.com/antonprafanto/pdfkit/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Report Issue
          </a>
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
