/**
 * Plugin Lifecycle Manager
 * Handles plugin activation, deactivation, and state management
 */

import { BrowserWindow } from 'electron';
import { pluginLoader } from './plugin-loader';
import { pluginSandbox } from './plugin-sandbox';
import { pluginAPIFactory } from './plugin-api';
import { LoadedPlugin, PluginState, PLUGIN_IPC_EVENTS } from '../../shared/plugin-types';

// Store for enabled plugins (persisted)
let enabledPlugins: Set<string> = new Set();

/**
 * Plugin Lifecycle Manager
 */
export class PluginLifecycle {
  private mainWindow: BrowserWindow | null = null;

  /**
   * Initialize lifecycle manager with main window
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  /**
   * Load enabled plugins from settings
   */
  loadEnabledPlugins(pluginIds: string[]): void {
    enabledPlugins = new Set(pluginIds);
  }

  /**
   * Get list of enabled plugin IDs
   */
  getEnabledPluginIds(): string[] {
    return Array.from(enabledPlugins);
  }

  /**
   * Initialize all plugins on startup
   */
  async initializePlugins(): Promise<void> {
    console.log('[PluginLifecycle] Initializing plugins...');
    
    // Discover all plugins
    const plugins = await pluginLoader.discoverPlugins();
    
    // Activate enabled plugins
    for (const plugin of plugins) {
      if (enabledPlugins.has(plugin.manifest.id)) {
        await this.activatePlugin(plugin.manifest.id);
      }
    }
    
    // Notify renderer of loaded plugins
    this.notifyPluginsLoaded();
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string): Promise<boolean> {
    const plugin = pluginLoader.getPlugin(pluginId);
    
    if (!plugin) {
      console.error(`[PluginLifecycle] Plugin not found: ${pluginId}`);
      return false;
    }
    
    if (plugin.state === 'enabled') {
      console.log(`[PluginLifecycle] Plugin already enabled: ${pluginId}`);
      return true;
    }
    
    if (plugin.state === 'error') {
      console.error(`[PluginLifecycle] Cannot activate plugin with errors: ${pluginId}`);
      return false;
    }
    
    try {
      console.log(`[PluginLifecycle] Activating plugin: ${plugin.manifest.name}`);
      
      // Create API for this plugin
      const api = pluginAPIFactory.createAPI(plugin, this.mainWindow);
      
      // Execute plugin in sandbox
      const instance = await pluginSandbox.executePlugin(plugin, api);
      
      if (instance) {
        // Call activate hook if provided
        if (instance.activate) {
          await instance.activate(api);
        }
        
        // Update state
        plugin.instance = instance;
        pluginLoader.setPluginState(pluginId, 'enabled');
        enabledPlugins.add(pluginId);
        
        // Notify state change
        this.notifyStateChange(pluginId, 'enabled');
        
        console.log(`[PluginLifecycle] Plugin activated: ${plugin.manifest.name}`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error(`[PluginLifecycle] Error activating plugin ${pluginId}:`, error);
      
      plugin.state = 'error';
      plugin.error = error.message;
      
      this.notifyError(pluginId, error.message);
      return false;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<boolean> {
    const plugin = pluginLoader.getPlugin(pluginId);
    
    if (!plugin) {
      console.error(`[PluginLifecycle] Plugin not found: ${pluginId}`);
      return false;
    }
    
    if (plugin.state !== 'enabled') {
      console.log(`[PluginLifecycle] Plugin not enabled: ${pluginId}`);
      return true;
    }
    
    try {
      console.log(`[PluginLifecycle] Deactivating plugin: ${plugin.manifest.name}`);
      
      // Stop plugin in sandbox
      await pluginSandbox.stopPlugin(pluginId);
      
      // Clear API registrations
      pluginAPIFactory.clearPluginAPI(pluginId);
      
      // Update state
      plugin.instance = undefined;
      pluginLoader.setPluginState(pluginId, 'disabled');
      enabledPlugins.delete(pluginId);
      
      // Notify state change
      this.notifyStateChange(pluginId, 'disabled');
      
      console.log(`[PluginLifecycle] Plugin deactivated: ${plugin.manifest.name}`);
      return true;
    } catch (error: any) {
      console.error(`[PluginLifecycle] Error deactivating plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Install a new plugin
   */
  async installPlugin(sourcePath: string): Promise<LoadedPlugin | null> {
    const plugin = await pluginLoader.installPlugin(sourcePath);
    
    if (plugin) {
      // Notify renderer
      this.notifyPluginsLoaded();
    }
    
    return plugin;
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    // Deactivate first if enabled
    await this.deactivatePlugin(pluginId);
    
    // Uninstall
    const success = await pluginLoader.uninstallPlugin(pluginId);
    
    if (success) {
      this.notifyPluginsLoaded();
    }
    
    return success;
  }

  /**
   * Reload all plugins
   */
  async reloadPlugins(): Promise<void> {
    console.log('[PluginLifecycle] Reloading all plugins...');
    
    // Stop all running plugins
    await pluginSandbox.stopAllPlugins();
    
    // Re-discover and re-activate enabled plugins
    await this.initializePlugins();
  }

  /**
   * Shutdown - deactivate all plugins
   */
  async shutdown(): Promise<void> {
    console.log('[PluginLifecycle] Shutting down plugins...');
    await pluginSandbox.stopAllPlugins();
  }

  /**
   * Notify renderer that plugins were loaded/changed
   */
  private notifyPluginsLoaded(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const plugins = pluginLoader.getLoadedPlugins().map(p => ({
        id: p.manifest.id,
        name: p.manifest.name,
        version: p.manifest.version,
        description: p.manifest.description,
        author: p.manifest.author,
        state: p.state,
        error: p.error,
        icon: p.manifest.icon,
      }));
      
      this.mainWindow.webContents.send(PLUGIN_IPC_EVENTS.PLUGIN_LOADED, plugins);
    }
  }

  /**
   * Notify renderer of state change
   */
  private notifyStateChange(pluginId: string, state: PluginState): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(PLUGIN_IPC_EVENTS.PLUGIN_STATE_CHANGED, {
        pluginId,
        state,
      });
    }
  }

  /**
   * Notify renderer of error
   */
  private notifyError(pluginId: string, error: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(PLUGIN_IPC_EVENTS.PLUGIN_ERROR, {
        pluginId,
        error,
      });
    }
  }
}

// Export singleton instance
export const pluginLifecycle = new PluginLifecycle();
