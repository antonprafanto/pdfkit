/**
 * Plugin Manager Dialog
 * UI for managing installed plugins
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { PluginMarketplace } from './PluginMarketplace';

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  state: 'installed' | 'enabled' | 'disabled' | 'error';
  error?: string;
  icon?: string;
}

interface PluginManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PluginManagerDialog({ open, onClose }: PluginManagerDialogProps) {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');

  // Load plugins on mount
  useEffect(() => {
    if (open) {
      loadPlugins();
    }
  }, [open]);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getPlugins();
      // Cast state to PluginInfo state type
      setPlugins((result || []).map(p => ({
        ...p,
        state: p.state as PluginInfo['state'],
      })));
    } catch (error) {
      console.error('Error loading plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePlugin = async (pluginId: string) => {
    setProcessing(pluginId);
    try {
      await window.electronAPI.enablePlugin(pluginId);
      await loadPlugins();
    } catch (error) {
      console.error('Error enabling plugin:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDisablePlugin = async (pluginId: string) => {
    setProcessing(pluginId);
    try {
      await window.electronAPI.disablePlugin(pluginId);
      await loadPlugins();
    } catch (error) {
      console.error('Error disabling plugin:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) {
      return;
    }
    
    setProcessing(pluginId);
    try {
      await window.electronAPI.uninstallPlugin(pluginId);
      await loadPlugins();
    } catch (error) {
      console.error('Error uninstalling plugin:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleInstallFromFile = async () => {
    try {
      const result = await window.electronAPI.openFolderDialog();
      
      if (result && result.length > 0) {
        setLoading(true);
        await window.electronAPI.installPlugin(result[0]);
        await loadPlugins();
      }
    } catch (error) {
      console.error('Error installing plugin:', error);
    }
  };

  const handleOpenPluginsFolder = async () => {
    try {
      await window.electronAPI.openPluginsFolder();
    } catch (error) {
      console.error('Error opening plugins folder:', error);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'enabled': return 'text-green-400';
      case 'disabled': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'enabled': return 'Enabled';
      case 'disabled': return 'Disabled';
      case 'installed': return 'Installed';
      case 'error': return 'Error';
      default: return state;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Plugin Manager"
      description="Manage your installed plugins"
      size="lg"
    >
      <div className="w-full max-h-[500px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'installed'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('installed')}
          >
            Installed ({plugins.length})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'marketplace'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('marketplace')}
          >
            Marketplace
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : activeTab === 'installed' ? (
            <>
              {plugins.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-lg mb-2">No plugins installed</p>
                  <p className="text-sm">Install plugins to extend PDF Kit functionality</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plugins.map((plugin) => (
                    <div
                      key={plugin.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{plugin.name}</h3>
                            <span className="text-xs text-gray-500">v{plugin.version}</span>
                            <span className={`text-xs ${getStateColor(plugin.state)}`}>
                              • {getStateLabel(plugin.state)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{plugin.description}</p>
                          <p className="text-xs text-gray-500 mt-1">by {plugin.author}</p>
                          {plugin.error && (
                            <p className="text-xs text-red-400 mt-1">Error: {plugin.error}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {processing === plugin.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              {plugin.state === 'enabled' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDisablePlugin(plugin.id)}
                                >
                                  Disable
                                </Button>
                              ) : plugin.state !== 'error' ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleEnablePlugin(plugin.id)}
                                >
                                  Enable
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleUninstallPlugin(plugin.id)}
                              >
                                Uninstall
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <PluginMarketplace 
              installedPluginIds={plugins.map(p => p.id)}
              onInstall={() => loadPlugins()}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleInstallFromFile}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Install from Folder
            </Button>
            <Button variant="ghost" size="sm" onClick={handleOpenPluginsFolder}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Open Folder
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
