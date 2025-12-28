/**
 * Settings Dialog Component
 * Allow users to configure app settings including font preferences
 */

import React, { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { useSettingsStore, FONT_OPTIONS, FontFamily } from '../store/settings-store';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { formFieldFont, formFieldFontSize, setFormFieldFont, setFormFieldFontSize } =
    useSettingsStore();

  const [selectedFont, setSelectedFont] = useState<FontFamily>(formFieldFont);
  const [selectedSize, setSelectedSize] = useState<number>(formFieldFontSize);

  const handleSave = () => {
    setFormFieldFont(selectedFont);
    setFormFieldFontSize(selectedSize);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFont(formFieldFont);
    setSelectedSize(formFieldFontSize);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      title="Settings"
      description="Configure PDF form field appearance"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Font Family Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Form Field Font
          </label>
          <div className="space-y-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id}
                onClick={() => setSelectedFont(font.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedFont === font.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{font.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {font.description}
                    </div>
                  </div>
                  {selectedFont === font.id && (
                    <svg
                      className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {/* Font Preview */}
                <div
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300 px-3 py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                  style={{ fontFamily: font.cssFamily }}
                >
                  Anton Prafanto - 0123456789
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Font Size: {selectedSize}px
          </label>
          <input
            type="range"
            min="10"
            max="20"
            step="1"
            value={selectedSize}
            onChange={(e) => setSelectedSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>10px</span>
            <span>15px</span>
            <span>20px</span>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Preview
          </label>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value="Anton Prafanto"
              readOnly
              style={{
                fontFamily:
                  FONT_OPTIONS.find((f) => f.id === selectedFont)?.cssFamily ||
                  FONT_OPTIONS[0].cssFamily,
                fontSize: `${selectedSize}px`,
              }}
              className="w-full px-3 py-2 border-2 border-orange-500 rounded bg-white text-black"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
};
