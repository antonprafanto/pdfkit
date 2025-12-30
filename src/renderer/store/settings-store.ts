/**
 * Settings Store
 * Manages application settings including font preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontFamily = 'courier' | 'arial' | 'times';

export interface FontOption {
  id: FontFamily;
  name: string;
  cssFamily: string;
  description: string;
  pdfStandardFont: string; // PDF standard font name for embedding
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'courier',
    name: 'Courier',
    cssFamily: "'Courier New', Courier, monospace",
    description: 'Monospace - Professional & Structured',
    pdfStandardFont: 'Courier',
  },
  {
    id: 'arial',
    name: 'Helvetica',
    cssFamily: 'Arial, Helvetica, sans-serif',
    description: 'Sans-serif - Modern & Clean',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'times',
    name: 'Times Roman',
    cssFamily: "'Times New Roman', Times, serif",
    description: 'Serif - Formal & Traditional',
    pdfStandardFont: 'Times-Roman',
  },
];

export type Language = 'en' | 'id';

interface SettingsState {
  // Form field settings
  formFieldFont: FontFamily;
  formFieldFontSize: number;
  setFormFieldFont: (font: FontFamily) => void;
  setFormFieldFontSize: (size: number) => void;
  getFontCSSFamily: () => string;
  
  // Language settings
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Accessibility settings
  highContrast: boolean;
  reducedMotion: boolean;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      formFieldFont: 'courier',
      formFieldFontSize: 14,
      language: 'en',
      highContrast: false,
      reducedMotion: false,

      setFormFieldFont: (font) => {
        set({ formFieldFont: font });
        // Apply to document
        applyFontToDocument(font, get().formFieldFontSize);
      },

      setFormFieldFontSize: (size) => {
        set({ formFieldFontSize: size });
        // Apply to document
        applyFontToDocument(get().formFieldFont, size);
      },

      getFontCSSFamily: () => {
        const font = FONT_OPTIONS.find((f) => f.id === get().formFieldFont);
        return font?.cssFamily || FONT_OPTIONS[0].cssFamily;
      },

      setLanguage: (lang) => {
        set({ language: lang });
        // Update i18n
        import('../i18n').then((i18n) => {
          i18n.default.changeLanguage(lang);
        });
        localStorage.setItem('language', lang);
      },

      setHighContrast: (enabled) => {
        set({ highContrast: enabled });
        applyAccessibilitySettings(enabled, get().reducedMotion);
      },

      setReducedMotion: (enabled) => {
        set({ reducedMotion: enabled });
        applyAccessibilitySettings(get().highContrast, enabled);
      },
    }),
    {
      name: 'settings-storage',
      onRehydrateStorage: () => (state) => {
        // Apply saved settings on app load
        if (state) {
          applyFontToDocument(state.formFieldFont, state.formFieldFontSize);
          applyAccessibilitySettings(state.highContrast, state.reducedMotion);
          
          // Sync language with i18n
          if (state.language) {
            import('../i18n').then((i18n) => {
              i18n.default.changeLanguage(state.language);
            });
          }
        }
      },
    }
  )
);

// Helper function to apply font to document
function applyFontToDocument(font: FontFamily, size: number) {
  const fontOption = FONT_OPTIONS.find((f) => f.id === font);
  if (!fontOption) return;

  // Remove old style if exists
  const oldStyle = document.getElementById('pdf-form-font-style');
  if (oldStyle) {
    oldStyle.remove();
  }

  // Create and inject new style
  const style = document.createElement('style');
  style.id = 'pdf-form-font-style';
  style.textContent = `
    .annotationLayer input,
    .annotationLayer textarea,
    .annotationLayer select {
      font-family: ${fontOption.cssFamily} !important;
      font-size: ${size}px !important;
      line-height: 1.4 !important;
    }

    .dark .annotationLayer input,
    .dark .annotationLayer textarea,
    .dark .annotationLayer select,
    html.dark input:not([type="file"]):not([type="button"]):not([type="submit"]),
    html.dark textarea,
    html.dark select {
      font-family: ${fontOption.cssFamily} !important;
    }
  `;
  document.head.appendChild(style);
}

// Helper function to apply accessibility settings
function applyAccessibilitySettings(highContrast: boolean, reducedMotion: boolean) {
  const html = document.documentElement;
  
  // High contrast mode
  if (highContrast) {
    html.classList.add('high-contrast');
  } else {
    html.classList.remove('high-contrast');
  }
  
  // Reduced motion mode
  if (reducedMotion) {
    html.classList.add('reduced-motion');
  } else {
    html.classList.remove('reduced-motion');
  }
}
