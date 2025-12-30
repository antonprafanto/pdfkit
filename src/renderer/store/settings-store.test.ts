/**
 * Settings Store Tests
 * Test settings persistence and operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../store/settings-store';

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSettingsStore.setState({
      formFieldFont: 'Inter',
      formFieldFontSize: 14,
      language: 'en',
      highContrast: false,
      reducedMotion: false,
      defaultSaveLocation: '',
      defaultZoom: 100,
      defaultViewMode: 'single',
      reopenLastFile: false,
      lastOpenedFile: null,
      cacheSize: 100,
      maxMemoryUsage: 512,
      clearRecentOnExit: false,
    });
  });

  describe('Language Settings', () => {
    it('should have default language as English', () => {
      const { language } = useSettingsStore.getState();
      expect(language).toBe('en');
    });

    it('should update language to Indonesian', () => {
      const { setLanguage } = useSettingsStore.getState();
      setLanguage('id');
      expect(useSettingsStore.getState().language).toBe('id');
    });
  });

  describe('Font Settings', () => {
    it('should have default font as Inter', () => {
      const { formFieldFont } = useSettingsStore.getState();
      expect(formFieldFont).toBe('Inter');
    });

    it('should update font family', () => {
      const { setFormFieldFont } = useSettingsStore.getState();
      setFormFieldFont('Arial');
      expect(useSettingsStore.getState().formFieldFont).toBe('Arial');
    });

    it('should update font size', () => {
      const { setFormFieldFontSize } = useSettingsStore.getState();
      setFormFieldFontSize(16);
      expect(useSettingsStore.getState().formFieldFontSize).toBe(16);
    });
  });

  describe('Accessibility Settings', () => {
    it('should toggle high contrast mode', () => {
      const { setHighContrast } = useSettingsStore.getState();
      expect(useSettingsStore.getState().highContrast).toBe(false);
      
      setHighContrast(true);
      expect(useSettingsStore.getState().highContrast).toBe(true);
    });

    it('should toggle reduced motion', () => {
      const { setReducedMotion } = useSettingsStore.getState();
      expect(useSettingsStore.getState().reducedMotion).toBe(false);
      
      setReducedMotion(true);
      expect(useSettingsStore.getState().reducedMotion).toBe(true);
    });
  });

  describe('PDF Defaults', () => {
    it('should set default zoom level', () => {
      const { setDefaultZoom } = useSettingsStore.getState();
      setDefaultZoom(150);
      expect(useSettingsStore.getState().defaultZoom).toBe(150);
    });

    it('should set default view mode', () => {
      const { setDefaultViewMode } = useSettingsStore.getState();
      setDefaultViewMode('continuous');
      expect(useSettingsStore.getState().defaultViewMode).toBe('continuous');
    });
  });

  describe('Performance Settings', () => {
    it('should set cache size', () => {
      const { setCacheSize } = useSettingsStore.getState();
      setCacheSize(200);
      expect(useSettingsStore.getState().cacheSize).toBe(200);
    });

    it('should set max memory usage', () => {
      const { setMaxMemoryUsage } = useSettingsStore.getState();
      setMaxMemoryUsage(1024);
      expect(useSettingsStore.getState().maxMemoryUsage).toBe(1024);
    });
  });

  describe('Privacy Settings', () => {
    it('should toggle clear recent on exit', () => {
      const { setClearRecentOnExit } = useSettingsStore.getState();
      setClearRecentOnExit(true);
      expect(useSettingsStore.getState().clearRecentOnExit).toBe(true);
    });
  });

  describe('Startup Settings', () => {
    it('should set reopen last file option', () => {
      const { setReopenLastFile } = useSettingsStore.getState();
      setReopenLastFile(true);
      expect(useSettingsStore.getState().reopenLastFile).toBe(true);
    });

    it('should set last opened file path', () => {
      const { setLastOpenedFile } = useSettingsStore.getState();
      setLastOpenedFile('/path/to/file.pdf');
      expect(useSettingsStore.getState().lastOpenedFile).toBe('/path/to/file.pdf');
    });

    it('should set default save location', () => {
      const { setDefaultSaveLocation } = useSettingsStore.getState();
      setDefaultSaveLocation('/users/documents');
      expect(useSettingsStore.getState().defaultSaveLocation).toBe('/users/documents');
    });
  });
});
