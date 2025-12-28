/**
 * Unsaved Changes Dialog
 * Warning dialog when closing document with unsaved changes
 */

import { Dialog, Button } from '../ui';

interface UnsavedChangesDialogProps {
  open: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  open,
  onClose,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Unsaved Changes"
      description="You have unsaved changes that will be lost"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDiscard}>
            Discard Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>
                  You have made changes to this PDF that have not been saved. If you close this
                  document now, all changes will be lost.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium">What would you like to do?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Click "Cancel" to go back and save your changes</li>
            <li>Click "Discard Changes" to close without saving</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}
