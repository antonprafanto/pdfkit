/**
 * General Settings Tab - Enhanced
 * Includes: Language, PDF Defaults, Startup, Save Location, Performance, Privacy
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, Language, ViewMode } from '../../store/settings-store';
import { Button } from '../ui/Button';

interface GeneralSettingsTabProps {
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  selectedLanguage,
  setSelectedLanguage,
}) => {
  const { t } = useTranslation();
  const {
    defaultSaveLocation,
    defaultZoom,
    defaultViewMode,
    reopenLastFile,
    cacheSize,
    maxMemoryUsage,
    clearRecentOnExit,
    setDefaultSaveLocation,
    setDefaultZoom,
    setDefaultViewMode,
    setReopenLastFile,
    setCacheSize,
    setMaxMemoryUsage,
    setClearRecentOnExit,
  } = useSettingsStore();

  const handleSelectFolder = async () => {
    try {
      // Use the existing selectFolder IPC method if available, otherwise prompt user
      const result = await (window as any).electronAPI?.selectFolder?.();
      if (result) {
        setDefaultSaveLocation(result);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
      // Fallback: prompt user to enter path manually
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.language', 'Language')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
              selectedLanguage === 'en'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-xl">🇺🇸</span>
            <span className="font-medium text-foreground">English</span>
          </button>
          <button
            onClick={() => setSelectedLanguage('id')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
              selectedLanguage === 'id'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-xl">🇮🇩</span>
            <span className="font-medium text-foreground">Indonesia</span>
          </button>
        </div>
      </section>

      {/* PDF Defaults */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.pdfDefaults', 'PDF Defaults')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              {t('settings.defaultZoom', 'Default Zoom')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={defaultZoom}
                onChange={(e) => setDefaultZoom(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-16 text-sm text-foreground text-right">{defaultZoom}%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              {t('settings.defaultViewMode', 'Default View Mode')}
            </label>
            <select
              value={defaultViewMode}
              onChange={(e) => setDefaultViewMode(e.target.value as ViewMode)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              <option value="single">{t('settings.viewSingle', 'Single Page')}</option>
              <option value="continuous">{t('settings.viewContinuous', 'Continuous Scroll')}</option>
              <option value="facing">{t('settings.viewFacing', 'Facing Pages')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Default Save Location */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.saveLocation', 'Default Save Location')}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={defaultSaveLocation || t('settings.notSet', 'Not set (will ask each time)')}
            readOnly
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary text-muted-foreground text-sm"
          />
          <Button variant="outline" onClick={handleSelectFolder}>
            {t('settings.browse', 'Browse')}
          </Button>
          {defaultSaveLocation && (
            <Button variant="ghost" onClick={() => setDefaultSaveLocation('')}>
              ✕
            </Button>
          )}
        </div>
      </section>

      {/* Startup */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.startup', 'Startup')}
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reopenLastFile}
            onChange={(e) => setReopenLastFile(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">
            {t('settings.reopenLastFile', 'Reopen last file on startup')}
          </span>
        </label>
      </section>

      {/* Performance */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.performance', 'Performance')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              {t('settings.cacheSize', 'Cache Size')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={cacheSize}
                onChange={(e) => setCacheSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-20 text-sm text-foreground text-right">{cacheSize} MB</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              {t('settings.maxMemory', 'Max Memory Usage')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="256"
                max="2048"
                step="256"
                value={maxMemoryUsage}
                onChange={(e) => setMaxMemoryUsage(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-20 text-sm text-foreground text-right">{maxMemoryUsage} MB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.privacy', 'Privacy')}
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={clearRecentOnExit}
            onChange={(e) => setClearRecentOnExit(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">
            {t('settings.clearRecentOnExit', 'Clear recent files on exit')}
          </span>
        </label>
      </section>

      {/* Help & Onboarding */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('settings.helpOnboarding', 'Help & Onboarding')}
        </h3>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {t('settings.showWelcomeGuideDesc', 'View the welcome guide that shows PDF Kit features')}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              // Reset the localStorage flag to show the welcome dialog
              localStorage.removeItem('pdf_kit_feature_highlights_seen');
              // Reload the page to trigger the dialog
              window.location.reload();
            }}
            className="w-fit"
          >
            {t('settings.showWelcomeGuide', 'Show Welcome Guide')}
          </Button>
        </div>
      </section>
    </div>
  );
};
