/**
 * Settings Store
 * Manages application settings including font preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontFamily = 'courier' | 'arial' | 'times' | 'consolas' | 'roboto';

export interface FontOption {
  id: FontFamily;
  name: string;
  cssFamily: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'courier',
    name: 'Courier New',
    cssFamily: "'Courier New', Courier, monospace",
    description: 'Monospace - Professional & Structured',
  },
  {
    id: 'arial',
    name: 'Arial',
    cssFamily: 'Arial, Helvetica, sans-serif',
    description: 'Sans-serif - Modern & Clean',
  },
  {
    id: 'times',
    name: 'Times New Roman',
    cssFamily: "'Times New Roman', Times, serif",
    description: 'Serif - Formal & Traditional',
  },
  {
    id: 'consolas',
    name: 'Consolas',
    cssFamily: "Consolas, 'Courier New', monospace",
    description: 'Monospace - Developer Style',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    cssFamily: "'Roboto', Arial, sans-serif",
    description: 'Sans-serif - Modern Google Font',
  },
];

interface SettingsState {
  formFieldFont: FontFamily;
  formFieldFontSize: number;
  setFormFieldFont: (font: FontFamily) => void;
  setFormFieldFontSize: (size: number) => void;
  getFontCSSFamily: () => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      formFieldFont: 'courier',
      formFieldFontSize: 14,

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
    }),
    {
      name: 'settings-storage',
      onRehydrateStorage: () => (state) => {
        // Apply saved font settings on app load
        if (state) {
          applyFontToDocument(state.formFieldFont, state.formFieldFontSize);
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
