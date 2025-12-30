/**
 * Collections Panel Component
 * Manages virtual folders for organizing PDF files
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionsStore, Collection, COLLECTION_COLORS } from '../store/collections-store';
import { Button } from './ui/Button';

interface CollectionsPanelProps {
  currentFilePath?: string;
  currentFileName?: string;
  onFileOpen?: (path: string) => void;
  className?: string;
}

export const CollectionsPanel: React.FC<CollectionsPanelProps> = ({
  currentFilePath,
  currentFileName,
  onFileOpen,
  className = '',
}) => {
  const { t } = useTranslation();
  const {
    collections,
    collectionFiles,
    createCollection,
    updateCollection,
    deleteCollection,
    addFileToCollection,
    removeFileFromCollection,
    getFilesInCollection,
    isFileInCollection,
  } = useCollectionsStore();

  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim(), selectedColor);
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const handleAddCurrentFile = (collectionId: string) => {
    if (currentFilePath && currentFileName) {
      addFileToCollection(collectionId, currentFilePath, currentFileName);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          📁 {t('collections.title', 'Collections')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? '✕' : '+'}
        </Button>
      </div>

      {/* Create New */}
      {isCreating && (
        <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder={t('collections.name', 'Collection Name')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
            autoFocus
          />
          <div className="flex gap-1">
            {COLLECTION_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedColor === color ? 'border-foreground' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!newCollectionName.trim()}>
            {t('collections.create', 'Create Collection')}
          </Button>
        </div>
      )}

      {/* Collections List */}
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('collections.empty', 'No collections yet')}
        </p>
      ) : (
        <div className="space-y-1">
          {collections.map((col) => {
            const files = getFilesInCollection(col.id);
            const isExpanded = expandedId === col.id;
            const hasCurrentFile = currentFilePath && isFileInCollection(col.id, currentFilePath);

            return (
              <div key={col.id} className="rounded-lg border border-border overflow-hidden">
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary/50"
                  onClick={() => setExpandedId(isExpanded ? null : col.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {col.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {files.length}
                  </span>
                  <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 p-2 space-y-1">
                    {currentFilePath && (
                      <button
                        onClick={() => hasCurrentFile
                          ? removeFileFromCollection(col.id, currentFilePath)
                          : handleAddCurrentFile(col.id)
                        }
                        className="w-full text-left text-xs px-2 py-1 rounded hover:bg-secondary"
                      >
                        {hasCurrentFile
                          ? `➖ ${t('collections.removeFile', 'Remove from Collection')}`
                          : `➕ ${t('collections.addFile', 'Add to Collection')}`
                        }
                      </button>
                    )}
                    {files.map((file) => (
                      <div
                        key={file.filePath}
                        className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-secondary cursor-pointer"
                        onClick={() => onFileOpen?.(file.filePath)}
                      >
                        <span>📄</span>
                        <span className="truncate">{file.fileName}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => deleteCollection(col.id)}
                      className="w-full text-left text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      🗑️ {t('collections.delete', 'Delete Collection')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
