/**
 * Recent Files List Component
 * Shows list of recently opened PDF files
 */

import { useState, useEffect } from 'react';
import { recentFilesManager, RecentFile } from '../lib/recent-files';
import { Button } from './ui';

interface RecentFilesListProps {
  onFileSelect: (file: RecentFile) => void;
}

export function RecentFilesList({ onFileSelect }: RecentFilesListProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = () => {
    const files = recentFilesManager.getRecentFiles();
    setRecentFiles(files);
  };

  const handleRemove = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    recentFilesManager.removeRecentFile(path);
    loadRecentFiles();
  };

  const handleClearAll = () => {
    if (confirm('Clear all recent files?')) {
      recentFilesManager.clearRecentFiles();
      loadRecentFiles();
    }
  };

  if (recentFiles.length === 0) {
    return (
      <div className="p-4 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No recent files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Files</h3>
        <Button size="sm" variant="ghost" onClick={handleClearAll}>
          Clear All
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recentFiles.map((file) => (
          <button
            key={file.path}
            onClick={() => onFileSelect(file)}
            className="group flex w-full items-start gap-3 border-b border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            {/* PDF icon */}
            <svg className="h-8 w-8 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{recentFilesManager.formatLastOpened(file.lastOpened)}</span>
                {file.pageCount && (
                  <>
                    <span>•</span>
                    <span>{file.pageCount} pages</span>
                  </>
                )}
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => handleRemove(file.path, e)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              title="Remove from recent"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
