/**
 * Auto-Update Service
 * Handles checking for updates, downloading, and installing
 * Uses electron-updater with GitHub Releases
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain, app } from 'electron';
import * as log from 'electron-log';

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  error: string | null;
  updateInfo: UpdateInfo | null;
}

class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private status: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    progress: 0,
    error: null,
    updateInfo: null,
  };

  constructor() {
    // Don't setup anything in constructor - wait for initialize()
  }

  initialize(window: BrowserWindow) {
    this.mainWindow = window;

    // Configure auto-updater only after app is ready
    try {
      autoUpdater.logger = log;
      (autoUpdater.logger as any).transports.file.level = 'info';
      autoUpdater.autoDownload = false; // Don't auto-download, let user decide
      autoUpdater.autoInstallOnAppQuit = true;

      this.setupEventListeners();
      this.setupIPCHandlers();
      console.log('[AutoUpdater] Initialized successfully');
    } catch (error) {
      console.error('[AutoUpdater] Failed to initialize:', error);
    }

    // Check for updates on startup (after a short delay)
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000); // 5 second delay to let app fully load
    
    // Setup periodic update check (every 4 hours)
    this.startPeriodicCheck();
  }

  private startPeriodicCheck() {
    // Clear existing interval if any
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Check every 4 hours (4 * 60 * 60 * 1000 = 14400000 ms)
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, FOUR_HOURS);
  }

  private setupEventListeners() {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.status.checking = true;
      this.status.error = null;
      this.sendStatusToRenderer();
    });

    // Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info('Update available:', info.version);
      this.status.checking = false;
      this.status.available = true;
      this.status.updateInfo = info;
      this.sendStatusToRenderer();
    });

    // No update available
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      log.info('Update not available, current version is latest');
      this.status.checking = false;
      this.status.available = false;
      this.status.updateInfo = info;
      this.sendStatusToRenderer();
    });

    // Download progress
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      log.info(`Download progress: ${progress.percent.toFixed(2)}%`);
      this.status.downloading = true;
      this.status.progress = progress.percent;
      this.sendStatusToRenderer();
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log.info('Update downloaded:', info.version);
      this.status.downloading = false;
      this.status.downloaded = true;
      this.status.progress = 100;
      this.status.updateInfo = info;
      this.sendStatusToRenderer();
    });

    // Error
    autoUpdater.on('error', (error: Error) => {
      log.error('Update error:', error.message);
      this.status.checking = false;
      this.status.downloading = false;
      this.status.error = error.message;
      this.sendStatusToRenderer();
    });
  }

  private setupIPCHandlers() {
    // Check for updates (manual)
    ipcMain.handle('updater:check', async () => {
      return this.checkForUpdates();
    });

    // Download update
    ipcMain.handle('updater:download', async () => {
      return this.downloadUpdate();
    });

    // Install update (quit and install)
    ipcMain.handle('updater:install', async () => {
      return this.installUpdate();
    });

    // Get current status
    ipcMain.handle('updater:status', async () => {
      return this.status;
    });

    // Get current version
    ipcMain.handle('updater:version', async () => {
      return app.getVersion();
    });
  }

  async checkForUpdates(): Promise<UpdateStatus> {
    try {
      console.log('[Auto-Updater] Starting update check...');
      log.info('[Auto-Updater] Starting update check...');
      
      // Check internet connectivity first
      const isOnline = await this.checkConnectivity();
      console.log('[Auto-Updater] Connectivity check:', isOnline);
      
      if (!isOnline) {
        const msg = 'No internet connection';
        console.warn('[Auto-Updater]', msg);
        log.info('Skipping update check - no internet connection');
        this.status.error = msg;
        this.sendStatusToRenderer();
        return this.status;
      }

      console.log('[Auto-Updater] Calling autoUpdater.checkForUpdates()...');
      const result = await autoUpdater.checkForUpdates();
      console.log('[Auto-Updater] Check result:', result);
      
      return this.status;
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      console.error('[Auto-Updater] Failed to check for updates:', errorMsg, error);
      log.error('Failed to check for updates:', errorMsg);
      
      this.status.error = errorMsg;
      this.status.checking = false;
      this.sendStatusToRenderer();
      
      return this.status;
    }
  }

  async downloadUpdate(): Promise<boolean> {
    try {
      if (!this.status.available) {
        log.warn('No update available to download');
        return false;
      }
      
      this.status.downloading = true;
      this.status.progress = 0;
      this.sendStatusToRenderer();
      
      await autoUpdater.downloadUpdate();
      return true;
    } catch (error: any) {
      log.error('Failed to download update:', error.message);
      this.status.error = error.message;
      this.status.downloading = false;
      this.sendStatusToRenderer();
      return false;
    }
  }

  installUpdate(): void {
    if (this.status.downloaded) {
      log.info('Installing update and restarting...');
      autoUpdater.quitAndInstall(false, true);
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const https = await import('https');
      return new Promise((resolve) => {
        const req = https.get('https://api.github.com', { timeout: 5000 }, (res) => {
          resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  private sendStatusToRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:status-changed', this.status);
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const autoUpdaterService = new AutoUpdaterService();
