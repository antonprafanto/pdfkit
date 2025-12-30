/**
 * Plugin API Factory
 * Creates sandboxed API instances for plugins
 */

import { BrowserWindow } from 'electron';
import { 
  LoadedPlugin, 
  PluginAPI, 
  MenuContribution, 
  DocumentInfo 
} from '../../shared/plugin-types';

// Registry of plugin commands
const commandRegistry: Map<string, Map<string, () => void | Promise<void>>> = new Map();

// Registry of plugin menu items
const menuRegistry: Map<string, MenuContribution[]> = new Map();

// Registry of plugin settings
const settingsRegistry: Map<string, Map<string, any>> = new Map();

// Document change listeners
const documentListeners: Map<string, ((doc: DocumentInfo | null) => void)[]> = new Map();

/**
 * Plugin API Factory
 */
export class PluginAPIFactory {
  private currentDocument: DocumentInfo | null = null;

  /**
   * Create API instance for a plugin
   */
  createAPI(plugin: LoadedPlugin, mainWindow: BrowserWindow | null): PluginAPI {
    const pluginId = plugin.manifest.id;
    const permissions = new Set(plugin.manifest.permissions);

    // Initialize registries for this plugin
    if (!commandRegistry.has(pluginId)) {
      commandRegistry.set(pluginId, new Map());
    }
    if (!menuRegistry.has(pluginId)) {
      menuRegistry.set(pluginId, []);
    }
    if (!settingsRegistry.has(pluginId)) {
      settingsRegistry.set(pluginId, new Map());
    }
    if (!documentListeners.has(pluginId)) {
      documentListeners.set(pluginId, []);
    }

    const api: PluginAPI = {
      version: '1.0.0',

      /**
       * Register a command handler
       */
      registerCommand: (commandId: string, handler: () => void | Promise<void>) => {
        if (!permissions.has('commands')) {
          console.warn(`[PluginAPI] Plugin ${pluginId} lacks 'commands' permission`);
          return;
        }
        
        const fullId = `${pluginId}.${commandId}`;
        commandRegistry.get(pluginId)!.set(fullId, handler);
        console.log(`[PluginAPI] Registered command: ${fullId}`);
      },

      /**
       * Register a menu item
       */
      registerMenuItem: (item: MenuContribution) => {
        if (!permissions.has('menus')) {
          console.warn(`[PluginAPI] Plugin ${pluginId} lacks 'menus' permission`);
          return;
        }

        const menuItem = {
          ...item,
          command: `${pluginId}.${item.command}`,
        };
        
        menuRegistry.get(pluginId)!.push(menuItem);
        
        // Notify renderer to add menu item
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('plugin:menu-item-added', {
            pluginId,
            menuItem,
          });
        }
        
        console.log(`[PluginAPI] Registered menu item: ${menuItem.label}`);
      },

      /**
       * Show notification
       */
      showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        if (!permissions.has('notifications')) {
          console.warn(`[PluginAPI] Plugin ${pluginId} lacks 'notifications' permission`);
          return;
        }
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('plugin:notification', {
            pluginId,
            message,
            type,
          });
        }
      },

      /**
       * Get current document info
       */
      getCurrentDocument: permissions.has('document:read') 
        ? async () => this.currentDocument 
        : undefined,

      /**
       * Subscribe to document changes
       */
      onDocumentChange: permissions.has('document:read')
        ? (handler: (doc: DocumentInfo | null) => void) => {
            documentListeners.get(pluginId)!.push(handler);
            
            // Return unsubscribe function
            return () => {
              const listeners = documentListeners.get(pluginId);
              if (listeners) {
                const index = listeners.indexOf(handler);
                if (index > -1) {
                  listeners.splice(index, 1);
                }
              }
            };
          }
        : undefined,

      /**
       * Get plugin setting
       */
      getSetting: (key: string): any => {
        return settingsRegistry.get(pluginId)?.get(key);
      },

      /**
       * Set plugin setting
       */
      setSetting: (key: string, value: any): void => {
        if (!permissions.has('settings')) {
          console.warn(`[PluginAPI] Plugin ${pluginId} lacks 'settings' permission`);
          return;
        }
        
        settingsRegistry.get(pluginId)?.set(key, value);
        
        // Persist settings (could emit to main process)
        console.log(`[PluginAPI] Plugin ${pluginId} set setting: ${key}`);
      },

      /**
       * Log message
       */
      log: (message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') => {
        const prefix = `[Plugin:${pluginId}]`;
        switch (level) {
          case 'debug':
            console.debug(prefix, message);
            break;
          case 'warn':
            console.warn(prefix, message);
            break;
          case 'error':
            console.error(prefix, message);
            break;
          default:
            console.log(prefix, message);
        }
      },
    };

    return api;
  }

  /**
   * Clear all registrations for a plugin
   */
  clearPluginAPI(pluginId: string): void {
    commandRegistry.delete(pluginId);
    menuRegistry.delete(pluginId);
    documentListeners.delete(pluginId);
    // Keep settings for persistence
    console.log(`[PluginAPI] Cleared registrations for plugin: ${pluginId}`);
  }

  /**
   * Execute a registered command
   */
  async executeCommand(commandId: string): Promise<boolean> {
    for (const [_pluginId, commands] of commandRegistry) {
      if (commands.has(commandId)) {
        try {
          await commands.get(commandId)!();
          return true;
        } catch (error) {
          console.error(`[PluginAPI] Error executing command ${commandId}:`, error);
          return false;
        }
      }
    }
    
    console.warn(`[PluginAPI] Command not found: ${commandId}`);
    return false;
  }

  /**
   * Get all registered menu items
   */
  getAllMenuItems(): { pluginId: string; items: MenuContribution[] }[] {
    const result: { pluginId: string; items: MenuContribution[] }[] = [];
    
    for (const [pluginId, items] of menuRegistry) {
      if (items.length > 0) {
        result.push({ pluginId, items });
      }
    }
    
    return result;
  }

  /**
   * Update current document info
   */
  setCurrentDocument(doc: DocumentInfo | null): void {
    this.currentDocument = doc;
    
    // Notify all listeners
    for (const [_, listeners] of documentListeners) {
      for (const listener of listeners) {
        try {
          listener(doc);
        } catch (error) {
          console.error('[PluginAPI] Error in document listener:', error);
        }
      }
    }
  }

  /**
   * Get plugin settings
   */
  getPluginSettings(pluginId: string): Record<string, any> {
    const settings = settingsRegistry.get(pluginId);
    if (!settings) return {};
    
    const result: Record<string, any> = {};
    for (const [key, value] of settings) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Load plugin settings
   */
  loadPluginSettings(pluginId: string, settings: Record<string, any>): void {
    if (!settingsRegistry.has(pluginId)) {
      settingsRegistry.set(pluginId, new Map());
    }
    
    const map = settingsRegistry.get(pluginId)!;
    for (const [key, value] of Object.entries(settings)) {
      map.set(key, value);
    }
  }
}

// Export singleton instance
export const pluginAPIFactory = new PluginAPIFactory();
