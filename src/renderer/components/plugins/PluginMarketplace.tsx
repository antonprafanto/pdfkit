/**
 * Plugin Marketplace
 * Browse and install plugins from registry
 */

import { useState, useEffect } from 'react';
import { Button, Spinner } from '../ui';

interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  downloadUrl: string;
  iconUrl?: string;
  categories: string[];
  downloads: number;
  rating: number;
  updatedAt: string;
}

interface PluginMarketplaceProps {
  onInstall?: (pluginId: string) => void;
  installedPluginIds?: string[];
}

// Sample marketplace data (would come from server in production)
const SAMPLE_MARKETPLACE_PLUGINS: MarketplacePlugin[] = [
  {
    id: 'com.example.word-count',
    name: 'Word Count',
    version: '1.0.0',
    description: 'Count words, characters, and pages in your PDF documents',
    author: 'PDF Kit Community',
    downloadUrl: '',
    categories: ['productivity'],
    downloads: 1234,
    rating: 4.5,
    updatedAt: '2024-12-20',
  },
  {
    id: 'com.example.dark-reader',
    name: 'Dark Reader Mode',
    version: '1.2.0',
    description: 'Apply dark mode filter to PDF pages for comfortable reading',
    author: 'PDF Kit Community',
    downloadUrl: '',
    categories: ['accessibility'],
    downloads: 856,
    rating: 4.2,
    updatedAt: '2024-12-15',
  },
  {
    id: 'com.example.bookmark-manager',
    name: 'Bookmark Manager',
    version: '2.0.0',
    description: 'Advanced bookmark management and navigation for large PDFs',
    author: 'PDF Kit Community',
    downloadUrl: '',
    categories: ['productivity'],
    downloads: 2341,
    rating: 4.8,
    updatedAt: '2024-12-18',
  },
];

export function PluginMarketplace({ onInstall, installedPluginIds = [] }: PluginMarketplaceProps) {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from a server
      // For now, use sample data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setPlugins(SAMPLE_MARKETPLACE_PLUGINS);
    } catch (error) {
      console.error('Error loading marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (plugin: MarketplacePlugin) => {
    setInstalling(plugin.id);
    try {
      // In production, this would download and install the plugin
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate installation
      onInstall?.(plugin.id);
      alert(`Plugin "${plugin.name}" installed successfully! (Demo only)`);
    } catch (error) {
      console.error('Error installing plugin:', error);
    } finally {
      setInstalling(null);
    }
  };

  const categories = ['all', 'productivity', 'accessibility', 'security', 'conversion'];
  
  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = searchQuery === '' || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' ||
      plugin.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === 'all' ? null : cat)}
            className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
              (selectedCategory === cat || (cat === 'all' && !selectedCategory))
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plugin List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No plugins found matching your search</p>
          </div>
        ) : (
          filteredPlugins.map(plugin => {
            const isInstalled = installedPluginIds.includes(plugin.id);
            
            return (
              <div
                key={plugin.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{plugin.name}</h3>
                      <span className="text-xs text-gray-500">v{plugin.version}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{plugin.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>by {plugin.author}</span>
                      <span>{plugin.downloads.toLocaleString()} downloads</span>
                      <div className="flex items-center gap-1">
                        {renderStars(plugin.rating)}
                        <span>({plugin.rating})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {isInstalled ? (
                      <span className="text-green-400 text-sm">Installed</span>
                    ) : installing === plugin.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleInstall(plugin)}
                      >
                        Install
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
