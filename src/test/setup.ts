/**
 * Test Setup File
 * Configure jsdom environment and global test utilities
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    getConnectivityStatus: vi.fn().mockResolvedValue(true),
    checkConnectivity: vi.fn().mockResolvedValue(true),
    onConnectivityStatusChanged: vi.fn().mockReturnValue(() => {}),
    getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
    getPlatform: vi.fn().mockResolvedValue('win32'),
    openExternal: vi.fn().mockResolvedValue(undefined),
    saveFileDialog: vi.fn().mockResolvedValue(null),
    savePdfFile: vi.fn().mockResolvedValue({ success: true }),
    openMultipleFilesDialog: vi.fn().mockResolvedValue(null),
    encryptPDF: vi.fn().mockResolvedValue({ success: true }),
    onMenuOpenFile: vi.fn().mockReturnValue(() => {}),
    onMenuSaveFile: vi.fn().mockReturnValue(() => {}),
    onMenuSaveFileAs: vi.fn().mockReturnValue(() => {}),
    onMenuZoomIn: vi.fn().mockReturnValue(() => {}),
    onMenuZoomOut: vi.fn().mockReturnValue(() => {}),
    onMenuZoomReset: vi.fn().mockReturnValue(() => {}),
    onMenuCheckUpdates: vi.fn().mockReturnValue(() => {}),
    onMenuAbout: vi.fn().mockReturnValue(() => {}),
    updaterCheck: vi.fn().mockResolvedValue({}),
    updaterDownload: vi.fn().mockResolvedValue(true),
    updaterInstall: vi.fn().mockResolvedValue(undefined),
    updaterGetStatus: vi.fn().mockResolvedValue({}),
    updaterGetVersion: vi.fn().mockResolvedValue('1.0.0'),
    onUpdaterStatusChanged: vi.fn().mockReturnValue(() => {}),
    getPlugins: vi.fn().mockResolvedValue([]),
    enablePlugin: vi.fn().mockResolvedValue(true),
    disablePlugin: vi.fn().mockResolvedValue(true),
    installPlugin: vi.fn().mockResolvedValue(true),
    uninstallPlugin: vi.fn().mockResolvedValue(true),
    reloadPlugins: vi.fn().mockResolvedValue(true),
    openPluginsFolder: vi.fn().mockResolvedValue(undefined),
    openFolderDialog: vi.fn().mockResolvedValue(null),
    onPluginNotification: vi.fn().mockReturnValue(() => {}),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock zustand persist to avoid localStorage issues in tests
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return {
    ...actual,
    persist: (fn: any) => fn,
  };
});

// Suppress console errors during tests
vi.spyOn(console, 'error').mockImplementation(() => {});
