/**
 * Settings Dialog Component
 * Allow users to configure app settings including language and accessibility
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { useSettingsStore, FONT_OPTIONS, FontFamily, Language } from '../store/settings-store';
import { AISettingsTab } from './ai/AISettingsTab';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'accessibility' | 'ai';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const {
    formFieldFont,
    formFieldFontSize,
    language,
    highContrast,
    reducedMotion,
    setFormFieldFont,
    setFormFieldFontSize,
    setLanguage,
    setHighContrast,
    setReducedMotion,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [selectedFont, setSelectedFont] = useState<FontFamily>(formFieldFont);
  const [selectedSize, setSelectedSize] = useState<number>(formFieldFontSize);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedHighContrast, setSelectedHighContrast] = useState(highContrast);
  const [selectedReducedMotion, setSelectedReducedMotion] = useState(reducedMotion);

  // Sync state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFont(formFieldFont);
      setSelectedSize(formFieldFontSize);
      setSelectedLanguage(language);
      setSelectedHighContrast(highContrast);
      setSelectedReducedMotion(reducedMotion);
    }
  }, [isOpen, formFieldFont, formFieldFontSize, language, highContrast, reducedMotion]);

  const handleSave = () => {
    setFormFieldFont(selectedFont);
    setFormFieldFontSize(selectedSize);
    setLanguage(selectedLanguage);
    setHighContrast(selectedHighContrast);
    setReducedMotion(selectedReducedMotion);
    
    // Update i18n language immediately
    i18n.changeLanguage(selectedLanguage);
    
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: t('settings.general') },
    { id: 'appearance', label: t('settings.appearance') },
    { id: 'accessibility', label: t('settings.accessibility') },
    { id: 'ai', label: t('settings.ai', 'AI') },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      title={t('settings.title')}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex gap-6 min-h-[400px]">
        {/* Sidebar tabs */}
        <div className="w-40 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t('settings.language')}
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedLanguage('en')}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      selectedLanguage === 'en'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">English</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">English (US)</div>
                    </div>
                    {selectedLanguage === 'en' && (
                      <svg className="h-5 w-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('id')}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      selectedLanguage === 'id'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">🇮🇩</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Bahasa Indonesia</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Indonesian</div>
                    </div>
                    {selectedLanguage === 'id' && (
                      <svg className="h-5 w-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">PDF Standard Fonts</p>
                    <p>All fonts are PDF Standard compliant and will be preserved when you save the document.</p>
                  </div>
                </div>
              </div>

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
                          <svg className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t('settings.fontSize')}: {selectedSize}px
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
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t('settings.highContrast')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Increase contrast for better visibility
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHighContrast(!selectedHighContrast)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedHighContrast ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={selectedHighContrast}
                  aria-label={t('settings.highContrast')}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedHighContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t('settings.reducedMotion')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Reduce animations and transitions
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReducedMotion(!selectedReducedMotion)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedReducedMotion ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={selectedReducedMotion}
                  aria-label={t('settings.reducedMotion')}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedReducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('settings.keyboardShortcuts')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">?</kbd> or{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">F1</kbd> to view all keyboard shortcuts.
                </div>
              </div>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <AISettingsTab />
          )}
        </div>
      </div>
    </Dialog>
  );
};
