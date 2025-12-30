/**
 * Tags Manager Component
 * Create, edit, and assign tags to PDF files
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTagsStore, Tag, TAG_COLORS } from '../store/tags-store';
import { Button } from './ui/Button';

interface TagsManagerProps {
  currentFilePath?: string;
  showManagement?: boolean;
  className?: string;
}

export const TagsManager: React.FC<TagsManagerProps> = ({
  currentFilePath,
  showManagement = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const {
    tags,
    createTag,
    updateTag,
    deleteTag,
    assignTag,
    unassignTag,
    getTagsForFile,
    hasTag,
  } = useTagsStore();

  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const fileTags = currentFilePath ? getTagsForFile(currentFilePath) : [];

  const handleCreate = () => {
    if (newTagName.trim()) {
      createTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setIsCreating(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (!currentFilePath) return;
    if (hasTag(currentFilePath, tagId)) {
      unassignTag(currentFilePath, tagId);
    } else {
      assignTag(currentFilePath, tagId);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          🏷️ {t('tags.title', 'Tags')}
        </h3>
        {showManagement && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? '✕' : '+'}
          </Button>
        )}
      </div>

      {/* Create New Tag */}
      {isCreating && (
        <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t('tags.name', 'Tag Name')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
            autoFocus
          />
          <div className="flex flex-wrap gap-1">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!newTagName.trim()}>
            {t('tags.create', 'Create Tag')}
          </Button>
        </div>
      )}

      {/* Current File Tags */}
      {currentFilePath && fileTags.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('tags.assigned', 'Assigned Tags')}:</p>
          <div className="flex flex-wrap gap-1">
            {fileTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white cursor-pointer hover:opacity-80"
                style={{ backgroundColor: tag.color }}
                onClick={() => handleToggleTag(tag.id)}
              >
                {tag.name}
                <span className="opacity-75">✕</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* All Tags */}
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('tags.empty', 'No tags yet')}
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {currentFilePath ? t('tags.clickToAssign', 'Click to assign/unassign') : t('tags.allTags', 'All Tags')}:
          </p>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => {
              const isAssigned = currentFilePath && hasTag(currentFilePath, tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={currentFilePath ? () => handleToggleTag(tag.id) : undefined}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                    isAssigned
                      ? 'text-white ring-2 ring-foreground ring-offset-1'
                      : 'text-white opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tag Management */}
      {showManagement && tags.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">{t('tags.manage', 'Manage Tags')}:</p>
          <div className="space-y-1">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-foreground">{tag.name}</span>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact tag display for file list
export const FileTags: React.FC<{ filePath: string }> = ({ filePath }) => {
  const { getTagsForFile } = useTagsStore();
  const tags = getTagsForFile(filePath);

  if (tags.length === 0) return null;

  return (
    <div className="flex gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag.id}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tag.color }}
          title={tag.name}
        />
      ))}
      {tags.length > 3 && (
        <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
      )}
    </div>
  );
};
