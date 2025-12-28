/**
 * Shared TypeScript types and interfaces
 */

// Connectivity
export interface ConnectivityStatus {
  isOnline: boolean;
  lastChecked: Date;
}

// App Info
export interface AppInfo {
  version: string;
  platform: NodeJS.Platform;
}

// Theme
export type Theme = 'light' | 'dark' | 'system';

// Settings
export interface AppSettings {
  theme: Theme;
  language: string;
  autoUpdate: boolean;
  checkUpdateInterval: number; // in hours
}
