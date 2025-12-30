/**
 * Empty State Components
 * Display helpful messages when content is empty or unavailable
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// Base empty state component
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`empty-state ${className}`}>
    {icon && <div className="empty-state__icon">{icon}</div>}
    <h3 className="empty-state__title">{title}</h3>
    {description && <p className="empty-state__description">{description}</p>}
    {action && (
      <button className="empty-state__action" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);

// No PDF Open
export const EmptyStatePDF: React.FC<{ onOpen?: () => void }> = ({ onOpen }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      }
      title={t('emptyState.noPdf.title', 'No PDF Open')}
      description={t('emptyState.noPdf.description', 'Open a PDF file to get started')}
      action={onOpen ? { label: t('common.openFile', 'Open File'), onClick: onOpen } : undefined}
    />
  );
};

// No Favorites
export const EmptyStateFavorites: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      }
      title={t('emptyState.favorites.title', 'No Favorites Yet')}
      description={t('emptyState.favorites.description', 'Star important files to find them quickly')}
    />
  );
};

// No Collections
export const EmptyStateCollections: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      }
      title={t('emptyState.collections.title', 'No Collections')}
      description={t('emptyState.collections.description', 'Create collections to organize your files')}
      action={onCreate ? { label: t('common.createCollection', 'Create Collection'), onClick: onCreate } : undefined}
    />
  );
};

// No Tags
export const EmptyStateTags: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      }
      title={t('emptyState.tags.title', 'No Tags')}
      description={t('emptyState.tags.description', 'Add tags to categorize your files')}
      action={onCreate ? { label: t('common.createTag', 'Create Tag'), onClick: onCreate } : undefined}
    />
  );
};

// No Search Results
export const EmptyStateSearch: React.FC<{ query?: string }> = ({ query }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      }
      title={t('emptyState.search.title', 'No Results Found')}
      description={
        query
          ? t('emptyState.search.descriptionWithQuery', 'No results for "{{query}}"', { query })
          : t('emptyState.search.description', 'Try a different search term')
      }
    />
  );
};

// No Recent Files
export const EmptyStateRecent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      }
      title={t('emptyState.recent.title', 'No Recent Files')}
      description={t('emptyState.recent.description', 'Files you open will appear here')}
    />
  );
};

// Error State
export const EmptyStateError: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
      title={t('emptyState.error.title', 'Something Went Wrong')}
      description={message || t('emptyState.error.description', 'An error occurred. Please try again.')}
      action={onRetry ? { label: t('common.retry', 'Try Again'), onClick: onRetry } : undefined}
      className="empty-state--error"
    />
  );
};

export default EmptyState;
