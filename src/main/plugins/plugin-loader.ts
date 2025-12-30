/**
 * Plugin Loader
 * Scans plugins directory and loads valid plugins
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { PluginManifest, LoadedPlugin, PluginState } from '../../shared/plugin-types';

/**
 * Plugin Loader class
 */
export class PluginLoader {
  private pluginsDir: string;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();

  constructor() {
    // Plugins directory is in app's userData folder
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    this.ensurePluginsDir();
  }

  /**
   * Ensure plugins directory exists
   */
  private ensurePluginsDir(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
      console.log('[PluginLoader] Created plugins directory:', this.pluginsDir);
    }
  }

  /**
   * Get plugins directory path
   */
  getPluginsDir(): string {
    return this.pluginsDir;
  }

  /**
   * Scan plugins directory and discover all plugins
   */
  async discoverPlugins(): Promise<LoadedPlugin[]> {
    console.log('[PluginLoader] Scanning plugins directory:', this.pluginsDir);
    
    const plugins: LoadedPlugin[] = [];
    
    try {
      const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginsDir, entry.name);
          const plugin = await this.loadPluginFromPath(pluginPath);
          
          if (plugin) {
            plugins.push(plugin);
            this.loadedPlugins.set(plugin.manifest.id, plugin);
          }
        }
      }
      
      console.log(`[PluginLoader] Discovered ${plugins.length} plugins`);
    } catch (error) {
      console.error('[PluginLoader] Error scanning plugins:', error);
    }
    
    return plugins;
  }

  /**
   * Load a plugin from a directory path
   */
  async loadPluginFromPath(pluginPath: string): Promise<LoadedPlugin | null> {
    const manifestPath = path.join(pluginPath, 'manifest.json');
    
    // Check if manifest exists
    if (!fs.existsSync(manifestPath)) {
      console.warn(`[PluginLoader] No manifest.json found in ${pluginPath}`);
      return null;
    }
    
    try {
      // Read and parse manifest
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);
      
      // Validate manifest
      const validationError = this.validateManifest(manifest);
      if (validationError) {
        console.error(`[PluginLoader] Invalid manifest in ${pluginPath}:`, validationError);
        return {
          manifest: manifest,
          state: 'error',
          path: pluginPath,
          error: validationError,
        };
      }
      
      // Check if main entry point exists
      const mainPath = path.join(pluginPath, manifest.main);
      if (!fs.existsSync(mainPath)) {
        return {
          manifest,
          state: 'error',
          path: pluginPath,
          error: `Entry point not found: ${manifest.main}`,
        };
      }
      
      console.log(`[PluginLoader] Loaded plugin: ${manifest.name} v${manifest.version}`);
      
      return {
        manifest,
        state: 'installed',
        path: pluginPath,
      };
    } catch (error: any) {
      console.error(`[PluginLoader] Error loading plugin from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: any): string | null {
    if (!manifest.id || typeof manifest.id !== 'string') {
      return 'Missing or invalid "id" field';
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      return 'Missing or invalid "name" field';
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      return 'Missing or invalid "version" field';
    }
    if (!manifest.main || typeof manifest.main !== 'string') {
      return 'Missing or invalid "main" field';
    }
    if (!manifest.author || typeof manifest.author !== 'string') {
      return 'Missing or invalid "author" field';
    }
    if (!manifest.description || typeof manifest.description !== 'string') {
      return 'Missing or invalid "description" field';
    }
    if (!Array.isArray(manifest.permissions)) {
      return 'Missing or invalid "permissions" field (must be array)';
    }
    
    return null;
  }

  /**
   * Install a plugin from a zip file or folder
   */
  async installPlugin(sourcePath: string): Promise<LoadedPlugin | null> {
    try {
      const stats = fs.statSync(sourcePath);
      
      if (stats.isDirectory()) {
        // Copy folder to plugins directory
        const manifest = await this.loadManifestFromPath(sourcePath);
        if (!manifest) {
          throw new Error('Invalid plugin: no manifest.json found');
        }
        
        const destPath = path.join(this.pluginsDir, manifest.id);
        
        // Remove existing if any
        if (fs.existsSync(destPath)) {
          fs.rmSync(destPath, { recursive: true });
        }
        
        // Copy plugin folder
        this.copyFolderSync(sourcePath, destPath);
        
        // Load the installed plugin
        const plugin = await this.loadPluginFromPath(destPath);
        if (plugin) {
          this.loadedPlugins.set(plugin.manifest.id, plugin);
        }
        
        return plugin;
      } else {
        // TODO: Handle zip file installation
        throw new Error('ZIP file installation not yet supported');
      }
    } catch (error: any) {
      console.error('[PluginLoader] Error installing plugin:', error);
      return null;
    }
  }

  /**
   * Load manifest from path without full validation
   */
  private async loadManifestFromPath(pluginPath: string): Promise<PluginManifest | null> {
    const manifestPath = path.join(pluginPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Copy folder recursively
   */
  private copyFolderSync(source: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyFolderSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.loadedPlugins.get(pluginId);
    
    if (!plugin) {
      console.warn(`[PluginLoader] Plugin not found: ${pluginId}`);
      return false;
    }
    
    try {
      // Remove plugin folder
      if (fs.existsSync(plugin.path)) {
        fs.rmSync(plugin.path, { recursive: true });
      }
      
      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);
      
      console.log(`[PluginLoader] Uninstalled plugin: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`[PluginLoader] Error uninstalling plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get a specific plugin by ID
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Update plugin state
   */
  setPluginState(pluginId: string, state: PluginState): void {
    const plugin = this.loadedPlugins.get(pluginId);
    if (plugin) {
      plugin.state = state;
    }
  }
}

// Export singleton instance
export const pluginLoader = new PluginLoader();
