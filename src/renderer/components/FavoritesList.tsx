/**
 * Favorites List Component
 * Displays and manages starred/favorite PDF files
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFavoritesStore, FavoriteFile } from '../store/favorites-store';
import { Button } from './ui/Button';

interface FavoritesListProps {
  onFileOpen?: (path: string) => void;
  className?: string;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  onFileOpen,
  className = '',
}) => {
  const { t } = useTranslation();
  const { favorites, removeFavorite } = useFavoritesStore();

  const handleOpen = (file: FavoriteFile) => {
    onFileOpen?.(file.path);
  };

  const handleRemove = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(path);
  };

  if (favorites.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <span className="text-2xl">⭐</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('favorites.empty', 'No favorites yet')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('favorites.hint', 'Star files to quickly access them here')}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <h3 className="text-sm font-medium text-foreground px-2 mb-2">
        ⭐ {t('favorites.title', 'Favorites')} ({favorites.length})
      </h3>
      {favorites.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer group"
          onClick={() => handleOpen(file)}
        >
          <span className="text-lg">📄</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {file.path}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleRemove(file.path, e)}
            className="opacity-0 group-hover:opacity-100"
            title={t('favorites.remove', 'Remove from Favorites')}
          >
            ✕
          </Button>
        </div>
      ))}
    </div>
  );
};

// Favorite Toggle Button for header
interface FavoriteToggleButtonProps {
  filePath: string;
  fileName: string;
  className?: string;
}

export const FavoriteToggleButton: React.FC<FavoriteToggleButtonProps> = ({
  filePath,
  fileName,
  className = '',
}) => {
  const { t } = useTranslation();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const starred = isFavorite(filePath);

  const handleToggle = () => {
    if (starred) {
      removeFavorite(filePath);
    } else {
      addFavorite(filePath, fileName);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-colors ${
        starred
          ? 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
          : 'text-muted-foreground hover:bg-secondary'
      } ${className}`}
      title={starred ? t('favorites.remove', 'Remove from Favorites') : t('favorites.add', 'Add to Favorites')}
    >
      {starred ? '⭐' : '☆'}
    </button>
  );
};
