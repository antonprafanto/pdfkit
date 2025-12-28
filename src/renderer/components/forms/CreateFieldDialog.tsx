/**
 * Create Field Dialog Component
 * Dialog for configuring new form field properties
 */

import React, { useState } from 'react';
import { FormField, FormFieldType } from '../../lib/pdf-forms.service';

interface CreateFieldDialogProps {
  isOpen: boolean;
  position: { x: number; y: number };
  pageNumber: number;
  onConfirm: (field: Partial<FormField>) => void;
  onCancel: () => void;
}

export const CreateFieldDialog: React.FC<CreateFieldDialogProps> = ({
  isOpen,
  position,
  pageNumber,
  onConfirm,
  onCancel,
}) => {
  const [fieldType, setFieldType] = useState<FormFieldType>('text');
  const [fieldName, setFieldName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [required, setRequired] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [options, setOptions] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fieldName.trim()) {
      alert('Please enter a field name');
      return;
    }

    const field: Partial<FormField> = {
      id: `field_${Date.now()}`,
      name: fieldName,
      type: fieldType,
      page: pageNumber,
      rect: [position.x, position.y, 200, fieldType === 'text' && multiline ? 80 : 30],
      value: defaultValue,
      defaultValue: defaultValue,
      required,
      readOnly: false,
      multiline: fieldType === 'text' ? multiline : undefined,
      options: fieldType === 'dropdown' ? options.split('\n').filter((o) => o.trim()) : undefined,
    };

    onConfirm(field);
    resetForm();
  };

  const resetForm = () => {
    setFieldType('text');
    setFieldName('');
    setDefaultValue('');
    setRequired(false);
    setMultiline(false);
    setOptions('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create Form Field
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Type *
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as FormFieldType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="text">Text Input</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio Button</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>

          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Name *
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., firstName"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Default Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Value
            </label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Optional default value"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Dropdown Options */}
          {fieldType === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options (one per line)
              </label>
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
              />
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="required" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Required field
            </label>
          </div>

          {/* Multiline for text fields */}
          {fieldType === 'text' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="multiline"
                checked={multiline}
                onChange={(e) => setMultiline(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="multiline" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Multiline (textarea)
              </label>
            </div>
          )}

          {/* Position info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Position: Page {pageNumber}, X: {Math.round(position.x)}, Y: {Math.round(position.y)}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onCancel();
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
