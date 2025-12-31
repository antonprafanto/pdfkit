/**
 * Simple Update Checker
 * Checks GitHub releases directly without electron-updater complexity
 */

import { shell } from 'electron';
import * as https from 'https';

export interface SimpleUpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl: string;
  releaseNotes: string;
}

export class SimpleUpdateChecker {
  private readonly GITHUB_API = 'https://api.github.com/repos/antonprafanto/pdfkit/releases/latest';
  private readonly currentVersion: string;

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
  }

  async checkForUpdates(): Promise<SimpleUpdateInfo> {
    return new Promise((resolve, reject) => {
      console.log('[SimpleUpdateChecker] Checking for updates...');
      console.log('[SimpleUpdateChecker] Current version:', this.currentVersion);

      https.get(this.GITHUB_API, {
        headers: {
          'User-Agent': 'PDF-Kit-App'
        }
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const latestVersion = release.tag_name.replace('v', '');
            const hasUpdate = this.compareVersions(latestVersion, this.currentVersion) > 0;

            // Find Windows installer
            const windowsAsset = release.assets.find((asset: any) => 
              asset.name.includes('Setup') && asset.name.endsWith('.exe')
            );

            const result: SimpleUpdateInfo = {
              hasUpdate,
              latestVersion,
              currentVersion: this.currentVersion,
              downloadUrl: windowsAsset?.browser_download_url || release.html_url,
              releaseNotes: release.body || 'No release notes available'
            };

            console.log('[SimpleUpdateChecker] Check result:', result);
            resolve(result);
          } catch (error) {
            console.error('[SimpleUpdateChecker] Parse error:', error);
            reject(error);
          }
        });
      }).on('error', (error) => {
        console.error('[SimpleUpdateChecker] Request error:', error);
        reject(error);
      });
    });
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  openDownloadPage(url: string) {
    console.log('[SimpleUpdateChecker] Opening download:', url);
    shell.openExternal(url);
  }
}
