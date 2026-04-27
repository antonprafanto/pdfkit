/**
 * Plugin Settings Storage
 * Handles persistence of plugin settings
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const SETTINGS_FILE = 'plugin-settings.json';

interface PluginSettingsData {
  enabledPlugins: string[];
  pluginSettings: Record<string, Record<string, any>>;
}

/**
 * Plugin Settings Manager
 */
export class PluginSettings {
  private _settingsPath: string | null = null;
  private data: PluginSettingsData | null = null;

  private get settingsPath(): string {
    if (!this._settingsPath) {
      this._settingsPath = path.join(app.getPath('userData'), SETTINGS_FILE);
    }
    return this._settingsPath;
  }

  private ensureLoaded(): void {
    if (!this.data) {
      this.data = this.loadSettings();
    }
  }

  constructor() {
    // Lazy initialization - settingsPath and data are resolved on first access
  }

  /**
   * Load settings from disk
   */
  private loadSettings(): PluginSettingsData {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const content = fs.readFileSync(this.settingsPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[PluginSettings] Error loading settings:', error);
    }
    
    return {
      enabledPlugins: [],
      pluginSettings: {},
    };
  }

  /**
   * Save settings to disk
   */
  private saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('[PluginSettings] Error saving settings:', error);
    }
  }

  /**
   * Get list of enabled plugin IDs
   */
  getEnabledPlugins(): string[] {
    this.ensureLoaded();
    return this.data!.enabledPlugins;
  }

  /**
   * Set list of enabled plugin IDs
   */
  setEnabledPlugins(pluginIds: string[]): void {
    this.ensureLoaded();
    this.data!.enabledPlugins = pluginIds;
    this.saveSettings();
  }

  /**
   * Add plugin to enabled list
   */
  enablePlugin(pluginId: string): void {
    this.ensureLoaded();
    if (!this.data!.enabledPlugins.includes(pluginId)) {
      this.data!.enabledPlugins.push(pluginId);
      this.saveSettings();
    }
  }

  /**
   * Remove plugin from enabled list
   */
  disablePlugin(pluginId: string): void {
    this.ensureLoaded();
    const index = this.data!.enabledPlugins.indexOf(pluginId);
    if (index > -1) {
      this.data!.enabledPlugins.splice(index, 1);
      this.saveSettings();
    }
  }

  /**
   * Get settings for a specific plugin
   */
  getPluginSettings(pluginId: string): Record<string, any> {
    this.ensureLoaded();
    return this.data!.pluginSettings[pluginId] || {};
  }

  /**
   * Set settings for a specific plugin
   */
  setPluginSettings(pluginId: string, settings: Record<string, any>): void {
    this.ensureLoaded();
    this.data!.pluginSettings[pluginId] = settings;
    this.saveSettings();
  }

  /**
   * Set a single setting for a plugin
   */
  setPluginSetting(pluginId: string, key: string, value: any): void {
    this.ensureLoaded();
    if (!this.data!.pluginSettings[pluginId]) {
      this.data!.pluginSettings[pluginId] = {};
    }
    this.data!.pluginSettings[pluginId][key] = value;
    this.saveSettings();
  }

  /**
   * Get a single setting for a plugin
   */
  getPluginSetting(pluginId: string, key: string): any {
    this.ensureLoaded();
    return this.data!.pluginSettings[pluginId]?.[key];
  }

  /**
   * Remove all settings for a plugin
   */
  removePluginSettings(pluginId: string): void {
    this.ensureLoaded();
    delete this.data!.pluginSettings[pluginId];
    this.disablePlugin(pluginId);
    this.saveSettings();
  }
}

// Export singleton instance
export const pluginSettings = new PluginSettings();
