/**
 * Plugin System Type Definitions
 * Shared types between main and renderer processes
 */

/**
 * Plugin permission types
 */
export type PluginPermission = 
  | 'document:read'      // Read current PDF document
  | 'document:write'     // Modify/save PDF document
  | 'filesystem:read'    // Read files from disk
  | 'filesystem:write'   // Write files to disk
  | 'network'            // Make network requests
  | 'clipboard'          // Access clipboard
  | 'notifications'      // Show notifications
  | 'settings'           // Access app settings
  | 'menus'              // Add menu items
  | 'commands';          // Register commands

/**
 * Plugin manifest - defines plugin metadata and capabilities
 */
export interface PluginManifest {
  /** Unique plugin identifier (reverse domain notation recommended) */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Short description */
  description: string;
  
  /** Author name or organization */
  author: string;
  
  /** Author's website or plugin homepage */
  homepage?: string;
  
  /** Plugin license */
  license?: string;
  
  /** Minimum PDF Kit version required */
  minAppVersion?: string;
  
  /** Entry point file (relative to plugin folder) */
  main: string;
  
  /** Required permissions */
  permissions: PluginPermission[];
  
  /** Plugin icon (relative path) */
  icon?: string;
  
  /** Categories for marketplace */
  categories?: PluginCategory[];
  
  /** Contributions to the app */
  contributes?: PluginContributions;
}

/**
 * Plugin categories for marketplace organization
 */
export type PluginCategory = 
  | 'editing'
  | 'conversion'
  | 'security'
  | 'productivity'
  | 'accessibility'
  | 'other';

/**
 * Plugin contributions to the app
 */
export interface PluginContributions {
  /** Menu items to add */
  menus?: MenuContribution[];
  
  /** Commands to register */
  commands?: CommandContribution[];
  
  /** Settings the plugin adds */
  settings?: SettingContribution[];
}

/**
 * Menu contribution
 */
export interface MenuContribution {
  /** Unique command ID to execute */
  command: string;
  
  /** Display label */
  label: string;
  
  /** Menu location */
  location: 'tools' | 'file' | 'edit' | 'view' | 'help';
  
  /** Icon (optional) */
  icon?: string;
  
  /** Keyboard shortcut (optional) */
  shortcut?: string;
}

/**
 * Command contribution
 */
export interface CommandContribution {
  /** Unique command ID */
  id: string;
  
  /** Display title */
  title: string;
  
  /** Description for command palette */
  description?: string;
}

/**
 * Setting contribution
 */
export interface SettingContribution {
  /** Setting key */
  key: string;
  
  /** Display label */
  label: string;
  
  /** Setting type */
  type: 'string' | 'number' | 'boolean' | 'select';
  
  /** Default value */
  default: any;
  
  /** Options for select type */
  options?: { label: string; value: any }[];
  
  /** Description */
  description?: string;
}

/**
 * Plugin state
 */
export type PluginState = 'installed' | 'enabled' | 'disabled' | 'error';

/**
 * Loaded plugin instance
 */
export interface LoadedPlugin {
  /** Plugin manifest */
  manifest: PluginManifest;
  
  /** Current state */
  state: PluginState;
  
  /** Plugin folder path */
  path: string;
  
  /** Error message if state is 'error' */
  error?: string;
  
  /** Plugin instance (when enabled) */
  instance?: PluginInstance;
}

/**
 * Plugin instance interface - what plugins must export
 */
export interface PluginInstance {
  /** Called when plugin is activated */
  activate?: (api: PluginAPI) => void | Promise<void>;
  
  /** Called when plugin is deactivated */
  deactivate?: () => void | Promise<void>;
}

/**
 * API exposed to plugins
 */
export interface PluginAPI {
  /** Plugin version */
  version: string;
  
  /** Register a command handler */
  registerCommand: (commandId: string, handler: () => void | Promise<void>) => void;
  
  /** Add a menu item */
  registerMenuItem: (item: MenuContribution) => void;
  
  /** Show a notification */
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  
  /** Get current document info (if permission granted) */
  getCurrentDocument?: () => Promise<DocumentInfo | null>;
  
  /** Subscribe to document changes */
  onDocumentChange?: (handler: (doc: DocumentInfo | null) => void) => () => void;
  
  /** Get plugin setting */
  getSetting: (key: string) => any;
  
  /** Set plugin setting */
  setSetting: (key: string, value: any) => void;
  
  /** Log message (for debugging) */
  log: (message: string, level?: 'debug' | 'info' | 'warn' | 'error') => void;
}

/**
 * Document info exposed to plugins
 */
export interface DocumentInfo {
  /** File name */
  fileName: string;
  
  /** Number of pages */
  pageCount: number;
  
  /** Document metadata */
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Plugin registry entry (for marketplace)
 */
export interface PluginRegistryEntry {
  /** Plugin ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Version */
  version: string;
  
  /** Description */
  description: string;
  
  /** Author */
  author: string;
  
  /** Download URL */
  downloadUrl: string;
  
  /** Icon URL */
  iconUrl?: string;
  
  /** Categories */
  categories: PluginCategory[];
  
  /** Download count */
  downloads: number;
  
  /** Rating (1-5) */
  rating: number;
  
  /** Last updated date */
  updatedAt: string;
}

/**
 * IPC Events for plugin system
 */
export const PLUGIN_IPC_EVENTS = {
  // Main -> Renderer
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_ERROR: 'plugin:error',
  PLUGIN_STATE_CHANGED: 'plugin:state-changed',
  
  // Renderer -> Main
  GET_PLUGINS: 'plugin:get-all',
  ENABLE_PLUGIN: 'plugin:enable',
  DISABLE_PLUGIN: 'plugin:disable',
  INSTALL_PLUGIN: 'plugin:install',
  UNINSTALL_PLUGIN: 'plugin:uninstall',
  RELOAD_PLUGINS: 'plugin:reload',
} as const;
