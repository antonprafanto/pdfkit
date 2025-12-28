/**
 * Form Toolbar Component
 * Provides controls for form filling and management
 */

import React from 'react';
import { useFormsStore } from '../../store/forms-store';

interface FormToolbarProps {
  onDetectForms: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onSaveFilled: () => void;
  onSaveTemplate: () => void; // NEW: Save PDF with fields structure
  onToggleEditMode: () => void;
  isDetecting?: boolean;
  isSavingTemplate?: boolean; // NEW: Loading state
}

export const FormToolbar: React.FC<FormToolbarProps> = ({
  onDetectForms,
  onExportData,
  onImportData,
  onSaveFilled,
  onSaveTemplate,
  onToggleEditMode,
  isDetecting = false,
  isSavingTemplate = false,
}) => {
  const { isFormDetected, editMode, isDirty, fields } = useFormsStore();

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="space-y-3">
        {/* Detection Section */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Form Detection
          </h3>
          <button
            onClick={onDetectForms}
            disabled={isDetecting}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {isDetecting ? 'Detecting...' : 'Detect Form Fields'}
          </button>

          {isFormDetected && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✓ Found {fields.length} field{fields.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Edit Mode - Always available for static forms */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Edit Mode
          </h3>
          <button
            onClick={onToggleEditMode}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              editMode
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {editMode ? 'Exit Edit Mode' : 'Create New Fields'}
          </button>
          {editMode && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Click on PDF to add fields
            </p>
          )}
        </div>

        {/* Save Template - Show when fields exist */}
        {fields.length > 0 && (
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Save Template
            </h3>
            <button
              onClick={onSaveTemplate}
              disabled={isSavingTemplate}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {isSavingTemplate ? 'Saving...' : 'Save PDF with Fields'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Create interactive PDF template that works in Adobe Reader, Chrome, and other PDF software
            </p>
          </div>
        )}

        {/* Form Actions - Only show if form detected */}
        {isFormDetected && (
          <>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Form Data
              </h3>
              <div className="space-y-2">
                <button
                  onClick={onImportData}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
                >
                  Import Data
                </button>
                <button
                  onClick={onExportData}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Save Form
              </h3>
              <button
                onClick={onSaveFilled}
                disabled={!isDirty}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                Save Filled PDF
              </button>
              {isDirty && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ⚠ Unsaved changes
                </p>
              )}
            </div>
          </>
        )}

        {/* No form message */}
        {!isFormDetected && !isDetecting && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded">
            <p className="font-semibold mb-1">💡 No interactive fields detected</p>
            <p className="mb-2">This PDF may be a static form.</p>
            <p className="text-xs">
              <strong>To add fields manually:</strong>
              <br />
              Use the "Create New Fields" button above to add interactive form fields to this PDF.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
