/**
 * Recent Files Manager
 * Manages list of recently opened PDF files
 */

const RECENT_FILES_KEY = 'pdf-kit-recent-files';
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
  pageCount?: number;
}

export class RecentFilesManager {
  /**
   * Get recent files from localStorage
   */
  getRecentFiles(): RecentFile[] {
    try {
      const stored = localStorage.getItem(RECENT_FILES_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading recent files:', error);
      return [];
    }
  }

  /**
   * Add file to recent files list
   */
  addRecentFile(file: Omit<RecentFile, 'lastOpened'>): void {
    try {
      const recentFiles = this.getRecentFiles();

      // Remove if already exists
      const filtered = recentFiles.filter((f) => f.path !== file.path);

      // Add to beginning with current timestamp
      const newFile: RecentFile = {
        ...file,
        lastOpened: Date.now(),
      };

      filtered.unshift(newFile);

      // Keep only MAX_RECENT_FILES
      const trimmed = filtered.slice(0, MAX_RECENT_FILES);

      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving recent file:', error);
    }
  }

  /**
   * Remove file from recent files
   */
  removeRecentFile(path: string): void {
    try {
      const recentFiles = this.getRecentFiles();
      const filtered = recentFiles.filter((f) => f.path !== path);
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing recent file:', error);
    }
  }

  /**
   * Clear all recent files
   */
  clearRecentFiles(): void {
    try {
      localStorage.removeItem(RECENT_FILES_KEY);
    } catch (error) {
      console.error('Error clearing recent files:', error);
    }
  }

  /**
   * Format last opened time
   */
  formatLastOpened(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return new Date(timestamp).toLocaleDateString();
  }
}

// Export singleton instance
export const recentFilesManager = new RecentFilesManager();
