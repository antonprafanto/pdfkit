/**
 * Advanced Search Dialog
 * Search across recent files, favorites, collections with filters
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { useSearchStore } from '../store/search-store';
import { useFavoritesStore } from '../store/favorites-store';
import { useCollectionsStore } from '../store/collections-store';
import { useTagsStore } from '../store/tags-store';

interface SearchResult {
  type: 'favorite' | 'collection' | 'recent';
  path: string;
  name: string;
  matchReason: string;
}

interface AdvancedSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recentFiles?: { path: string; name: string }[];
  onFileOpen?: (path: string) => void;
}

export const AdvancedSearchDialog: React.FC<AdvancedSearchDialogProps> = ({
  isOpen,
  onClose,
  recentFiles = [],
  onFileOpen,
}) => {
  const { t } = useTranslation();
  const { searchHistory, addToHistory, removeFromHistory, clearHistory } = useSearchStore();
  const { favorites } = useFavoritesStore();
  const { collections, collectionFiles } = useCollectionsStore();
  const { tags, fileTags, getTagsForFile } = useTagsStore();

  const [query, setQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | ''>('');
  const [selectedTag, setSelectedTag] = useState<string | ''>('');

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim() && !filterFavorites && !selectedCollection && !selectedTag) {
      return [];
    }

    const allFiles: SearchResult[] = [];
    const seen = new Set<string>();

    // Add favorites
    for (const fav of favorites) {
      if (!seen.has(fav.path)) {
        seen.add(fav.path);
        allFiles.push({
          type: 'favorite',
          path: fav.path,
          name: fav.name,
          matchReason: '⭐ Favorite',
        });
      }
    }

    // Add collection files
    for (const cf of collectionFiles) {
      if (!seen.has(cf.filePath)) {
        seen.add(cf.filePath);
        const col = collections.find((c) => c.id === cf.collectionId);
        allFiles.push({
          type: 'collection',
          path: cf.filePath,
          name: cf.fileName,
          matchReason: `📁 ${col?.name || 'Collection'}`,
        });
      }
    }

    // Add recent files
    for (const rf of recentFiles) {
      if (!seen.has(rf.path)) {
        seen.add(rf.path);
        allFiles.push({
          type: 'recent',
          path: rf.path,
          name: rf.name,
          matchReason: '🕐 Recent',
        });
      }
    }

    // Apply filters
    let filtered = allFiles;

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
      );
    }

    // Favorites filter
    if (filterFavorites) {
      filtered = filtered.filter((f) => f.type === 'favorite');
    }

    // Collection filter
    if (selectedCollection) {
      const colFiles = collectionFiles
        .filter((cf) => cf.collectionId === selectedCollection)
        .map((cf) => cf.filePath);
      filtered = filtered.filter((f) => colFiles.includes(f.path));
    }

    // Tag filter
    if (selectedTag) {
      const taggedFiles = fileTags
        .filter((ft) => ft.tagId === selectedTag)
        .map((ft) => ft.filePath);
      filtered = filtered.filter((f) => taggedFiles.includes(f.path));
    }

    return filtered;
  }, [query, filterFavorites, selectedCollection, selectedTag, favorites, collectionFiles, collections, recentFiles, fileTags]);

  const handleSearch = () => {
    if (query.trim()) {
      addToHistory(query, results.length);
    }
  };

  const handleSelectHistory = (q: string) => {
    setQuery(q);
  };

  const handleOpen = (path: string) => {
    onFileOpen?.(path);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t('search.advanced', 'Advanced Search')}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('search.placeholder', 'Search files...')}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <Button onClick={handleSearch}>🔍</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterFavorites}
              onChange={(e) => setFilterFavorites(e.target.checked)}
              className="rounded"
            />
            ⭐ {t('search.favoritesOnly', 'Favorites only')}
          </label>

          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-2 py-1 text-sm rounded border border-border bg-card text-foreground"
          >
            <option value="">{t('search.allCollections', 'All Collections')}</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                📁 {col.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-2 py-1 text-sm rounded border border-border bg-card text-foreground"
          >
            <option value="">{t('search.allTags', 'All Tags')}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                🏷️ {tag.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && !query && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t('search.recentSearches', 'Recent Searches')}
              </p>
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:underline"
              >
                {t('search.clearHistory', 'Clear')}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {searchHistory.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectHistory(item.query)}
                  className="px-2 py-1 text-xs rounded-full bg-secondary hover:bg-secondary/80"
                >
                  {item.query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {query || filterFavorites || selectedCollection || selectedTag
                ? t('search.noResults', 'No results found')
                : t('search.startSearching', 'Start searching...')}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">
                {results.length} {t('search.results', 'results')}
              </p>
              {results.map((result, idx) => (
                <div
                  key={`${result.path}-${idx}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  onClick={() => handleOpen(result.path)}
                >
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.path}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.matchReason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
