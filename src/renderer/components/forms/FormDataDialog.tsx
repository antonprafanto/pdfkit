/**
 * Form Data Dialog Component
 * Handles import/export of form data
 */

import React, { useState } from 'react';
import { useFormsStore } from '../../store/forms-store';
import { pdfFormsService, FormDataJSON } from '../../lib/pdf-forms.service';

interface FormDataDialogProps {
  isOpen: boolean;
  mode: 'import' | 'export';
  onClose: () => void;
  pdfTitle?: string;
}

export const FormDataDialog: React.FC<FormDataDialogProps> = ({
  isOpen,
  mode,
  onClose,
  pdfTitle,
}) => {
  const { fields, setFields } = useFormsStore();
  const [jsonData, setJsonData] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const formData = pdfFormsService.exportFormData(fields, {
        title: pdfTitle,
        author: 'PDF Kit',
      });

      const jsonString = JSON.stringify(formData, null, 2);
      setJsonData(jsonString);
      setError('');

      // Automatically download the JSON file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfTitle || 'form-data'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export form data');
      console.error(err);
    }
  };

  const handleImport = () => {
    try {
      setError('');

      if (!jsonData.trim()) {
        setError('Please paste JSON data');
        return;
      }

      const parsedData: FormDataJSON = JSON.parse(jsonData);

      // Validate JSON structure
      if (!parsedData.version || !parsedData.fields) {
        setError('Invalid form data format');
        return;
      }

      // Import data
      const updatedFields = pdfFormsService.importFormData(parsedData, fields);
      setFields(updatedFields);

      alert('Form data imported successfully!');
      onClose();
    } catch (err) {
      setError('Invalid JSON format');
      console.error(err);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonData(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'export' ? 'Export Form Data' : 'Import Form Data'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export form data to JSON format. You can save this file and import it later.
              </p>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Generate & Download JSON
              </button>

              {jsonData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated JSON:
                  </label>
                  <textarea
                    value={jsonData}
                    readOnly
                    className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded font-mono text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    File downloaded automatically. You can also copy the JSON above.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import form data from a previously saved JSON file.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select JSON file:
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or paste JSON data:
                </label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder='{"version": "1.0", "fields": {...}}'
                  className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded font-mono text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleImport}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Import Data
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
