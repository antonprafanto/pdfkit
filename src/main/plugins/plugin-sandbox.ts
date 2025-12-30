/**
 * Plugin Sandbox
 * Provides isolated execution environment for plugins
 */

import * as vm from 'vm';
import * as path from 'path';
import * as fs from 'fs';
import { LoadedPlugin, PluginInstance, PluginAPI } from '../../shared/plugin-types';

/**
 * Plugin Sandbox class
 * Executes plugins in a restricted VM context
 */
export class PluginSandbox {
  private runningPlugins: Map<string, PluginInstance> = new Map();

  /**
   * Execute a plugin in sandboxed environment
   */
  async executePlugin(plugin: LoadedPlugin, api: PluginAPI): Promise<PluginInstance | null> {
    try {
      const mainPath = path.join(plugin.path, plugin.manifest.main);
      
      if (!fs.existsSync(mainPath)) {
        throw new Error(`Plugin entry point not found: ${mainPath}`);
      }

      const code = fs.readFileSync(mainPath, 'utf-8');
      
      // Create sandboxed context with limited globals
      const sandbox = this.createSandbox(plugin, api);
      
      // Create VM context
      const context = vm.createContext(sandbox);
      
      // Wrap code in module pattern
      const wrappedCode = `
        (function(exports, require, module, __filename, __dirname, pdfKit) {
          ${code}
        })(exports, require, module, __filename, __dirname, pdfKit);
        module.exports;
      `;

      // Execute in sandbox
      const script = new vm.Script(wrappedCode, {
        filename: mainPath,
      });

      const moduleExports = script.runInContext(context, { timeout: 5000 }); // 5 second timeout
      
      // Validate plugin instance
      const instance: PluginInstance = moduleExports || {};
      
      // Store running plugin
      this.runningPlugins.set(plugin.manifest.id, instance);
      
      console.log(`[PluginSandbox] Plugin ${plugin.manifest.name} loaded successfully`);
      
      return instance;
    } catch (error: any) {
      console.error(`[PluginSandbox] Error executing plugin ${plugin.manifest.id}:`, error);
      throw error;
    }
  }

  /**
   * Create sandboxed environment for plugin
   */
  private createSandbox(plugin: LoadedPlugin, api: PluginAPI): any {
    const pluginDir = plugin.path;
    
    // Limited require function
    const sandboxedRequire = (moduleName: string) => {
      // Allow only specific safe modules
      const allowedModules = ['path', 'url'];
      
      if (allowedModules.includes(moduleName)) {
        return require(moduleName);
      }
      
      // Allow requiring files within plugin directory
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        const fullPath = path.resolve(pluginDir, moduleName);
        
        // Security check: ensure path is within plugin directory
        if (!fullPath.startsWith(pluginDir)) {
          throw new Error(`Cannot require files outside plugin directory: ${moduleName}`);
        }
        
        // Add .js extension if needed
        let resolvedPath = fullPath;
        if (!fs.existsSync(resolvedPath) && fs.existsSync(resolvedPath + '.js')) {
          resolvedPath += '.js';
        }
        
        if (fs.existsSync(resolvedPath)) {
          const code = fs.readFileSync(resolvedPath, 'utf-8');
          const moduleExports = {};
          const moduleObj = { exports: moduleExports };
          
          const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', code);
          fn(moduleExports, sandboxedRequire, moduleObj, resolvedPath, path.dirname(resolvedPath));
          
          return moduleObj.exports;
        }
      }
      
      throw new Error(`Module not allowed in plugin sandbox: ${moduleName}`);
    };

    return {
      // Module system
      exports: {},
      require: sandboxedRequire,
      module: { exports: {} },
      __filename: path.join(pluginDir, plugin.manifest.main),
      __dirname: pluginDir,
      
      // Plugin API
      pdfKit: api,
      
      // Safe globals
      console: {
        log: (...args: any[]) => api.log(args.join(' '), 'info'),
        info: (...args: any[]) => api.log(args.join(' '), 'info'),
        warn: (...args: any[]) => api.log(args.join(' '), 'warn'),
        error: (...args: any[]) => api.log(args.join(' '), 'error'),
        debug: (...args: any[]) => api.log(args.join(' '), 'debug'),
      },
      
      // Timers (with limits)
      setTimeout: (fn: () => void, ms: number) => {
        const maxTimeout = 60000; // 1 minute max
        return setTimeout(fn, Math.min(ms, maxTimeout));
      },
      clearTimeout: clearTimeout,
      setInterval: (fn: () => void, ms: number) => {
        const minInterval = 1000; // 1 second minimum
        return setInterval(fn, Math.max(ms, minInterval));
      },
      clearInterval: clearInterval,
      
      // Safe built-ins
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,
      Promise: Promise,
      Map: Map,
      Set: Set,
      
      // URL handling
      URL: URL,
      URLSearchParams: URLSearchParams,
      
      // Text encoding
      TextEncoder: TextEncoder,
      TextDecoder: TextDecoder,
    };
  }

  /**
   * Stop a running plugin
   */
  async stopPlugin(pluginId: string): Promise<void> {
    const instance = this.runningPlugins.get(pluginId);
    
    if (instance) {
      try {
        if (instance.deactivate) {
          await Promise.race([
            instance.deactivate(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Deactivate timeout')), 5000)
            ),
          ]);
        }
      } catch (error) {
        console.error(`[PluginSandbox] Error deactivating plugin ${pluginId}:`, error);
      }
      
      this.runningPlugins.delete(pluginId);
      console.log(`[PluginSandbox] Plugin ${pluginId} stopped`);
    }
  }

  /**
   * Get running plugin instance
   */
  getRunningPlugin(pluginId: string): PluginInstance | undefined {
    return this.runningPlugins.get(pluginId);
  }

  /**
   * Check if plugin is running
   */
  isPluginRunning(pluginId: string): boolean {
    return this.runningPlugins.has(pluginId);
  }

  /**
   * Stop all running plugins
   */
  async stopAllPlugins(): Promise<void> {
    const pluginIds = Array.from(this.runningPlugins.keys());
    
    for (const pluginId of pluginIds) {
      await this.stopPlugin(pluginId);
    }
  }
}

// Export singleton instance
export const pluginSandbox = new PluginSandbox();
