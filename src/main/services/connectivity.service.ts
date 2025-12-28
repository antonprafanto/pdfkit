import { EventEmitter } from 'events';
import axios from 'axios';

/**
 * Connectivity Service - Monitor internet connection status
 * Checks connectivity on startup and periodically (every 30 seconds)
 */
export class ConnectivityService extends EventEmitter {
  private isOnlineStatus: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds
  private readonly CHECK_TIMEOUT_MS = 5000; // 5 seconds timeout
  private readonly CHECK_URLS = [
    'https://www.google.com',
    'https://www.cloudflare.com',
    'https://1.1.1.1',
  ];

  constructor() {
    super();
  }

  /**
   * Start monitoring connectivity
   */
  public startMonitoring(): void {
    // Initial check
    this.checkConnectivity();

    // Periodic check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, this.CHECK_INTERVAL_MS);

    console.log('[Connectivity] Monitoring started');
  }

  /**
   * Stop monitoring connectivity
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('[Connectivity] Monitoring stopped');
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  /**
   * Perform connectivity check
   * Tries multiple endpoints for reliability
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      // Try the first URL
      const response = await axios.get(this.CHECK_URLS[0], {
        timeout: this.CHECK_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const isOnline = response.status >= 200 && response.status < 400;
      this.updateStatus(isOnline);
      return isOnline;
    } catch (error) {
      // If first URL fails, try fallback URLs
      for (let i = 1; i < this.CHECK_URLS.length; i++) {
        try {
          const response = await axios.get(this.CHECK_URLS[i], {
            timeout: this.CHECK_TIMEOUT_MS,
            validateStatus: (status) => status >= 200 && status < 500,
          });

          if (response.status >= 200 && response.status < 400) {
            this.updateStatus(true);
            return true;
          }
        } catch {
          // Continue to next URL
        }
      }

      // All URLs failed - we're offline
      this.updateStatus(false);
      return false;
    }
  }

  /**
   * Update online status and emit event if changed
   */
  private updateStatus(isOnline: boolean): void {
    const previousStatus = this.isOnlineStatus;
    this.isOnlineStatus = isOnline;

    if (previousStatus !== isOnline) {
      console.log(`[Connectivity] Status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      this.emit('status-changed', isOnline);
    }
  }
}
