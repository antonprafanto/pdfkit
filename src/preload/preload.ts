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

  // File Operations
  saveFileDialog: (defaultName: string) => ipcRenderer.invoke('save-file-dialog', defaultName),
  savePdfFile: (filePath: string, pdfBytes: Uint8Array) =>
    ipcRenderer.invoke('save-pdf-file', filePath, pdfBytes),
  openMultipleFilesDialog: () => ipcRenderer.invoke('open-multiple-files-dialog'),
  
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

  // PDF Signing
  signPdf: (pdfBytes: Uint8Array, p12Bytes: Uint8Array, password: string, reason?: string, location?: string) => 
    ipcRenderer.invoke('sign-pdf', pdfBytes, p12Bytes, password, reason, location),
  openP12FileDialog: () => ipcRenderer.invoke('open-p12-file-dialog'),

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
});

// Type definitions for TypeScript
export interface ElectronAPI {
  getConnectivityStatus: () => Promise<boolean>;
  checkConnectivity: () => Promise<boolean>;
  onConnectivityStatusChanged: (callback: (isOnline: boolean) => void) => () => void;
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  saveFileDialog: (defaultName: string) => Promise<string | null>;
  savePdfFile: (filePath: string, pdfBytes: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  openMultipleFilesDialog: () => Promise<Array<{ name: string; data: Uint8Array }> | null>;
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
  // PDF Signing
  signPdf: (pdfBytes: Uint8Array, p12Bytes: Uint8Array, password: string, reason?: string, location?: string) => 
    Promise<{ success: boolean; outputPath?: string; signedPdfBytes?: Uint8Array; error?: string }>;
  openP12FileDialog: () => Promise<{ path: string; name: string; data: Uint8Array } | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
