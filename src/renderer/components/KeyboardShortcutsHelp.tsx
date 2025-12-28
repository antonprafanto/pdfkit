/**
 * Keyboard Shortcuts Help Dialog
 * Shows all available keyboard shortcuts for the PDF viewer
 */

import { Dialog, Button } from './ui';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string;
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutSections: ShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: '→ / PageDown / Space', description: 'Next page' },
      { keys: '← / PageUp', description: 'Previous page' },
      { keys: 'Home', description: 'First page' },
      { keys: 'End', description: 'Last page' },
    ],
  },
  {
    title: 'Zoom',
    shortcuts: [
      { keys: 'Ctrl + +', description: 'Zoom in' },
      { keys: 'Ctrl + -', description: 'Zoom out' },
      { keys: 'Ctrl + 0', description: 'Reset zoom to 100%' },
      { keys: 'Ctrl + 1', description: 'Fit to width' },
      { keys: 'Ctrl + 2', description: 'Fit to page' },
    ],
  },
  {
    title: 'Rotation',
    shortcuts: [
      { keys: 'Ctrl + R', description: 'Rotate counter-clockwise' },
      { keys: 'Ctrl + Shift + R', description: 'Rotate clockwise' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: 'Ctrl + F', description: 'Open/close search' },
    ],
  },
];

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Quick reference for all available keyboard shortcuts"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-6">
        {shortcutSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 rounded-md bg-gray-50 p-2 dark:bg-gray-800"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description}
                  </span>
                  <kbd className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-mono text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="mt-6 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              On macOS, use <kbd className="rounded bg-blue-100 px-1 font-mono text-xs dark:bg-blue-800">Cmd</kbd> instead of{' '}
              <kbd className="rounded bg-blue-100 px-1 font-mono text-xs dark:bg-blue-800">Ctrl</kbd>
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
