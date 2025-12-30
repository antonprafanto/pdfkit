/**
 * Form Toolbar Component
 * Provides controls for form filling and management
 * Now with Field List Panel for easy field navigation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormsStore } from '../../store/forms-store';

interface FormToolbarProps {
  onDetectForms: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onSaveFilled: () => void;
  onSaveTemplate: () => void;
  onToggleEditMode: () => void;
  isDetecting?: boolean;
  isSavingTemplate?: boolean;
}

// Field type icons
const fieldTypeIcons: Record<string, string> = {
  text: '📝',
  checkbox: '☑️',
  radio: '🔘',
  dropdown: '📋',
  button: '🔲',
};

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
  const { isFormDetected, editMode, isDirty, fields, selectedField, selectField, removeField } = useFormsStore();
  const { t } = useTranslation();

  // Group fields by page
  const fieldsByPage = fields.reduce((acc, field) => {
    const page = field.page;
    if (!acc[page]) acc[page] = [];
    acc[page].push(field);
    return acc;
  }, {} as Record<number, typeof fields>);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Toolbar Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {/* Detection Section */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t('forms.formDetection')}
          </h3>
          <button
            onClick={onDetectForms}
            disabled={isDetecting}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {isDetecting ? t('common.loading') : t('forms.detectFormFields')}
          </button>
        </div>

        {/* Edit Mode */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t('forms.editMode')}
          </h3>
          <button
            onClick={onToggleEditMode}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              editMode
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {editMode ? t('common.close') : t('forms.createNewFields')}
          </button>
          {editMode && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {t('forms.clickToAdd')}
            </p>
          )}
        </div>

        {/* Save Template */}
        {fields.length > 0 && (
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <button
              onClick={onSaveTemplate}
              disabled={isSavingTemplate}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {isSavingTemplate ? 'Saving...' : 'Save PDF with Fields'}
            </button>
          </div>
        )}
      </div>

      {/* Field List Panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <span>{t('forms.fields')} ({fields.length})</span>
            {editMode && fields.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">{t('common.selectAll')}</span>
            )}
          </h3>

          {fields.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-900 rounded">
              <p className="font-semibold mb-1">💡 {t('forms.noFieldsYet')}</p>
              <p>{t('forms.noFieldsHint')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(fieldsByPage).map(([page, pageFields]) => (
                <div key={page}>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('common.page')} {page}
                  </div>
                  <div className="space-y-1">
                    {pageFields.map((field) => (
                      <div
                        key={field.id}
                        onClick={() => editMode && selectField(field.id)}
                        className={`
                          flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors
                          ${selectedField === field.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500'
                            : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        <span className="text-base">{fieldTypeIcons[field.type] || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-xs">{field.name}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                            {field.type}
                            {field.required && <span className="ml-1 text-yellow-600">*</span>}
                          </div>
                        </div>
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete field"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        {editMode && fields.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
              <div className="font-semibold mb-1">⌨️ Shortcuts</div>
              <div><kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">Del</kbd> Delete field</div>
              <div><kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">↑↓←→</kbd> Nudge position</div>
              <div><kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">Ctrl+D</kbd> Duplicate</div>
              <div><kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">Ctrl+C/V</kbd> Copy/Paste</div>
              <div><kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">Esc</kbd> Deselect</div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions at bottom */}
      {isFormDetected && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onImportData}
              className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-xs transition-colors"
            >
              Import
            </button>
            <button
              onClick={onExportData}
              className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-xs transition-colors"
            >
              Export
            </button>
          </div>
          <button
            onClick={onSaveFilled}
            disabled={!isDirty}
            className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Save Filled PDF{isDirty && ' ⚠️'}
          </button>
        </div>
      )}
    </div>
  );
};
