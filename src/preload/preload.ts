import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload Script - Secure bridge between main and renderer process
 * Uses contextBridge for secure communication with context isolation
 */

// Expose protected methods that allow the renderer to use ipcRenderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Connectivity
  getConnectivityStatus: () => ipcRenderer.invoke('get-connectivity-status'),
  checkConnectivity: () => ipcRenderer.invoke('check-connectivity'),
  onConnectivityStatusChanged: (callback: (isOnline: boolean) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, isOnline: boolean) =>
      callback(isOnline);
    ipcRenderer.on('connectivity-status', subscription);
    return () => ipcRenderer.removeListener('connectivity-status', subscription);
  },

  // App Info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Print
  printPDF: (options?: { pdfPath?: string; pdfBytes?: Uint8Array; fileName?: string }) => 
    ipcRenderer.invoke('print-pdf', options),

  // File Operations
  saveFileDialog: (defaultName: string) => ipcRenderer.invoke('save-file-dialog', defaultName),
  savePdfFile: (filePath: string, pdfBytes: Uint8Array) =>
    ipcRenderer.invoke('save-pdf-file', filePath, pdfBytes),
  openMultipleFilesDialog: () => ipcRenderer.invoke('open-multiple-files-dialog'),
  readFileFromPath: (filePath: string) => ipcRenderer.invoke('read-file-from-path', filePath),
  
  // Simple Update Check (GitHub API direct)
  simpleUpdateCheck: () => ipcRenderer.invoke('simple-update-check'),
  openDownloadUrl: (url: string) => ipcRenderer.invoke('open-download-url', url),
  
  // PDF Operations
  encryptPDF: (pdfBytes: Uint8Array, options: {
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: boolean;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
    };
  }) => ipcRenderer.invoke('encrypt-pdf', pdfBytes, options),

  // Office Conversion
  checkLibreOffice: () => ipcRenderer.invoke('check-libreoffice'),
  convertOfficeToPdf: (filePath: string) => ipcRenderer.invoke('convert-office-to-pdf', filePath),
  convertDocxMammoth: (filePath: string) => ipcRenderer.invoke('convert-docx-mammoth', filePath),
  convertCloudAPI: (filePath: string, apiKey: string) => ipcRenderer.invoke('convert-cloud-api', filePath, apiKey),
  copyFile: (source: string, dest: string) => ipcRenderer.invoke('copy-file', source, dest),
  openOfficeFileDialog: () => ipcRenderer.invoke('open-office-file-dialog'),

  // PDF to Word/Excel conversion (via LibreOffice)
  convertPdfWithLibreOffice: (pdfBytes: Uint8Array, format: 'docx' | 'xlsx') => 
    ipcRenderer.invoke('convert-pdf-with-libreoffice', pdfBytes, format),
  checkLibreOfficeForPdf: () => ipcRenderer.invoke('check-libreoffice-for-pdf'),
  getLibreOfficeDownloadUrl: () => ipcRenderer.invoke('get-libreoffice-download-url'),

  // PDF Signing
  signPdf: (pdfBytes: Uint8Array, p12Bytes: Uint8Array, password: string, reason?: string, location?: string) => 
    ipcRenderer.invoke('sign-pdf', pdfBytes, p12Bytes, password, reason, location),
  openP12FileDialog: () => ipcRenderer.invoke('open-p12-file-dialog'),

  // Add Page Numbers
  addPageNumbers: (pdfBytes: Uint8Array, options: {
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    format: 'numbers' | 'page-of-total' | 'roman' | 'letters';
    startNumber: number;
    fontSize: number;
    margin: number;
    pageRange: string;
  }) => ipcRenderer.invoke('add-page-numbers', pdfBytes, options),

  // Extract Images
  extractImages: (pdfBytes: Uint8Array, options: {
    format: 'png' | 'jpeg';
    quality: number;
    minWidth: number;
    minHeight: number;
    fileName: string;
  }) => ipcRenderer.invoke('extract-images', pdfBytes, options),

  // Unlock PDF
  unlockPDF: (pdfBytes: Uint8Array, password: string) => ipcRenderer.invoke('unlock-pdf', pdfBytes, password),

  // Web Optimize PDF
  webOptimizePDF: (pdfBytes: Uint8Array, options: { quality: string }) => ipcRenderer.invoke('web-optimize-pdf', pdfBytes, options),

  // Overlay PDF (supports images too)
  overlayPDF: (basePdfBytes: Uint8Array, overlayPdfBytes: Uint8Array, options: {
    position: 'foreground' | 'background';
    pageNumbers: number[];
    opacity: number;
    isImage?: boolean;
    imagePosition?: 'top' | 'bottom' | 'center' | 'full';
  }) => ipcRenderer.invoke('overlay-pdf', basePdfBytes, overlayPdfBytes, options),

  // Webpage to PDF
  webpageToPDF: (options: {
    url: string;
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
    landscape: boolean;
    margins: 'none' | 'minimal' | 'normal';
    printBackground: boolean;
    timeout: number;
  }) => ipcRenderer.invoke('webpage-to-pdf', options),

  // Menu Events
  onMenuOpenFile: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-open-file', subscription);
    return () => ipcRenderer.removeListener('menu-open-file', subscription);
  },
  onMenuSaveFile: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-save-file', subscription);
    return () => ipcRenderer.removeListener('menu-save-file', subscription);
  },
  onMenuSaveFileAs: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-save-file-as', subscription);
    return () => ipcRenderer.removeListener('menu-save-file-as', subscription);
  },
  onMenuZoomIn: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-zoom-in', subscription);
    return () => ipcRenderer.removeListener('menu-zoom-in', subscription);
  },
  onMenuZoomOut: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-zoom-out', subscription);
    return () => ipcRenderer.removeListener('menu-zoom-out', subscription);
  },
  onMenuZoomReset: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-zoom-reset', subscription);
    return () => ipcRenderer.removeListener('menu-zoom-reset', subscription);
  },
  onMenuCheckUpdates: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-check-updates', subscription);
    return () => ipcRenderer.removeListener('menu-check-updates', subscription);
  },
  onMenuAbout: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-about', subscription);
    return () => ipcRenderer.removeListener('menu-about', subscription);
  },

  // Plugin System
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
  enablePlugin: (pluginId: string) => ipcRenderer.invoke('enable-plugin', pluginId),
  disablePlugin: (pluginId: string) => ipcRenderer.invoke('disable-plugin', pluginId),
  installPlugin: (folderPath: string) => ipcRenderer.invoke('install-plugin', folderPath),
  uninstallPlugin: (pluginId: string) => ipcRenderer.invoke('uninstall-plugin', pluginId),
  reloadPlugins: () => ipcRenderer.invoke('reload-plugins'),
  openPluginsFolder: () => ipcRenderer.invoke('open-plugins-folder'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),

  // Plugin events
  onPluginNotification: (callback: (data: { pluginId: string; message: string; type: string }) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('plugin:notification', subscription);
    return () => ipcRenderer.removeListener('plugin:notification', subscription);
  },

  // Auto-Updater
  updaterCheck: () => ipcRenderer.invoke('updater:check'),
  updaterDownload: () => ipcRenderer.invoke('updater:download'),
  updaterInstall: () => ipcRenderer.invoke('updater:install'),
  updaterGetStatus: () => ipcRenderer.invoke('updater:status'),
  updaterGetVersion: () => ipcRenderer.invoke('updater:version'),
  onUpdaterStatusChanged: (callback: (status: any) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on('updater:status-changed', subscription);
    return () => ipcRenderer.removeListener('updater:status-changed', subscription);
  },

  // File Association - Open PDF from OS
  onOpenPdfFile: (callback: (filePath: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('open-pdf-file', subscription);
    return () => ipcRenderer.removeListener('open-pdf-file', subscription);
  },

  // Print trigger from main process (globalShortcut Ctrl+P)
  onTriggerPrint: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('trigger-print', subscription);
    return () => ipcRenderer.removeListener('trigger-print', subscription);
  },
});

// Type definitions for TypeScript
export interface ElectronAPI {
  getConnectivityStatus: () => Promise<boolean>;
  checkConnectivity: () => Promise<boolean>;
  onConnectivityStatusChanged: (callback: (isOnline: boolean) => void) => () => void;
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  printPDF: (options?: { pdfPath?: string; pdfBytes?: Uint8Array; fileName?: string }) => Promise<{ success: boolean; error?: string }>;
  saveFileDialog: (defaultName: string) => Promise<string | null>;
  savePdfFile: (filePath: string, pdfBytes: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  openMultipleFilesDialog: () => Promise<Array<{ name: string; data: Uint8Array }> | null>;
  readFileFromPath: (filePath: string) => Promise<{ success: boolean; name?: string; data?: Uint8Array; error?: string }>;
  simpleUpdateCheck: () => Promise<{ hasUpdate: boolean; latestVersion: string; currentVersion: string; downloadUrl: string; releaseNotes: string; error?: string }>;
  openDownloadUrl: (url: string) => Promise<void>;
  encryptPDF: (pdfBytes: Uint8Array, options: {
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: boolean;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
    };
  }) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  onMenuOpenFile: (callback: () => void) => () => void;
  onMenuSaveFile: (callback: () => void) => () => void;
  onMenuSaveFileAs: (callback: () => void) => () => void;
  onMenuZoomIn: (callback: () => void) => () => void;
  onMenuZoomOut: (callback: () => void) => () => void;
  onMenuZoomReset: (callback: () => void) => () => void;
  onMenuCheckUpdates: (callback: () => void) => () => void;
  onMenuAbout: (callback: () => void) => () => void;
  // Office Conversion
  checkLibreOffice: () => Promise<{ installed: boolean; path?: string; version?: string; downloadUrl: string }>;
  convertOfficeToPdf: (filePath: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  convertDocxMammoth: (filePath: string) => Promise<{ success: boolean; outputPath?: string; warnings?: string[]; error?: string }>;
  convertCloudAPI: (filePath: string, apiKey: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  copyFile: (source: string, dest: string) => Promise<{ success: boolean; error?: string }>;
  openOfficeFileDialog: () => Promise<string | null>;
  // PDF to Word/Excel conversion (via LibreOffice)
  convertPdfWithLibreOffice: (pdfBytes: Uint8Array, format: 'docx' | 'xlsx') => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  checkLibreOfficeForPdf: () => Promise<{ installed: boolean; path: string | null }>;
  getLibreOfficeDownloadUrl: () => Promise<string>;
  // PDF Signing
  signPdf: (pdfBytes: Uint8Array, p12Bytes: Uint8Array, password: string, reason?: string, location?: string) => 
    Promise<{ success: boolean; outputPath?: string; signedPdfBytes?: Uint8Array; error?: string }>;
  openP12FileDialog: () => Promise<{ path: string; name: string; data: Uint8Array } | null>;
  // Add Page Numbers
  addPageNumbers: (pdfBytes: Uint8Array, options: {
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    format: 'numbers' | 'page-of-total' | 'roman' | 'letters';
    startNumber: number;
    fontSize: number;
    margin: number;
    pageRange: string;
  }) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  extractImages: (pdfBytes: Uint8Array, options: {
    format: 'png' | 'jpeg';
    quality: number;
    minWidth: number;
    minHeight: number;
    fileName: string;
  }) => Promise<{ success: boolean; count?: number; outputDir?: string; error?: string }>;
  unlockPDF: (pdfBytes: Uint8Array, password: string) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  webOptimizePDF: (pdfBytes: Uint8Array, options: { quality: string }) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  overlayPDF: (basePdfBytes: Uint8Array, overlayPdfBytes: Uint8Array, options: {
    position: 'foreground' | 'background';
    pageNumbers: number[];
    opacity: number;
    isImage?: boolean;
    imagePosition?: 'top' | 'bottom' | 'center' | 'full';
  }) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  webpageToPDF: (options: {
    url: string;
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
    landscape: boolean;
    margins: 'none' | 'minimal' | 'normal';
    printBackground: boolean;
    timeout: number;
  }) => Promise<{ success: boolean; filePath?: string; pageTitle?: string; error?: string }>;
  // Plugin System
  getPlugins: () => Promise<Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    state: string;
    error?: string;
    icon?: string;
  }>>;
  enablePlugin: (pluginId: string) => Promise<boolean>;
  disablePlugin: (pluginId: string) => Promise<boolean>;
  installPlugin: (folderPath: string) => Promise<boolean>;
  uninstallPlugin: (pluginId: string) => Promise<boolean>;
  reloadPlugins: () => Promise<boolean>;
  openPluginsFolder: () => Promise<void>;
  openFolderDialog: () => Promise<string[] | null>;
  onPluginNotification: (callback: (data: { pluginId: string; message: string; type: string }) => void) => () => void;
  // Auto-Updater
  updaterCheck: () => Promise<any>;
  updaterDownload: () => Promise<boolean>;
  updaterInstall: () => Promise<void>;
  updaterGetStatus: () => Promise<any>;
  updaterGetVersion: () => Promise<string>;
  onUpdaterStatusChanged: (callback: (status: any) => void) => () => void;
  // File Association
  onOpenPdfFile: (callback: (filePath: string) => void) => () => void;
  // Print trigger from main process
  onTriggerPrint: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
