/**
 * TabBar Component - Multi-Tab PDF Viewer
 * Displays tabs for open PDF documents with close, switch, and new tab actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePDFStore, TabState } from '../store/pdf-store';
import { useAnnotationStore } from '../store/annotation-store';

export function TabBar() {
  const { t } = useTranslation();
  const { 
    tabs, 
    activeTabId, 
    setActiveTab, 
    removeTab, 
    canAddTab,
  } = usePDFStore();
  
  const { setCurrentDocument } = useAnnotationStore();

  // Don't render if no tabs
  if (tabs.length === 0) {
    return null;
  }

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTabId) {
      setActiveTab(tabId);
      // Sync annotation store to new tab
      setCurrentDocument(tabId);
    }
  };

  const handleTabClose = (e: React.MouseEvent, tab: TabState) => {
    e.stopPropagation(); // Don't trigger tab switch
    
    // If tab has unsaved changes, confirm
    if (tab.hasUnsavedChanges) {
      if (!confirm(t('tabs.unsavedChangesConfirm'))) {
        return;
      }
    }
    
    removeTab(tab.id);
  };

  const handleMiddleClick = (e: React.MouseEvent, tab: TabState) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      handleTabClose(e, tab);
    }
  };

  const getTabDisplayName = (tab: TabState) => {
    if (tab.fileName) {
      // Truncate long names
      const name = tab.fileName;
      if (name.length > 25) {
        return name.substring(0, 22) + '...';
      }
      return name;
    }
    return t('tabs.untitled');
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar-scroll">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onMouseDown={(e) => handleMiddleClick(e, tab)}
            title={tab.filePath || tab.fileName || t('tabs.untitled')}
          >
            {/* PDF icon */}
            <svg 
              className="tab-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            
            {/* Tab name */}
            <span className="tab-name">
              {getTabDisplayName(tab)}
            </span>
            
            {/* Unsaved indicator */}
            {tab.hasUnsavedChanges && (
              <span className="tab-unsaved" title={t('tabs.unsavedChanges')}>•</span>
            )}
            
            {/* Close button */}
            <button
              className="tab-close"
              onClick={(e) => handleTabClose(e, tab)}
              title={t('tabs.closeTab')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      {/* New tab button - shown when user can add more tabs */}
      {canAddTab() && (
        <button
          className="tab-new"
          onClick={() => {
            // Will be handled by App.tsx to open file dialog
            const event = new CustomEvent('open-new-tab');
            window.dispatchEvent(event);
          }}
          title={t('tabs.newTab')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      
      {/* Tab count indicator when approaching limit */}
      {tabs.length >= 8 && (
        <span className="tab-count" title={t('tabs.tabLimitWarning')}>
          {tabs.length}/10
        </span>
      )}

      <style>{`
        .tab-bar {
          display: flex !important;
          align-items: center;
          background: #2d2d2d !important;
          border-bottom: 1px solid #444 !important;
          height: 40px !important;
          min-height: 40px !important;
          padding: 0 4px;
          overflow: hidden;
          flex-shrink: 0;
          z-index: 100;
        }
        
        .tab-bar-scroll {
          display: flex;
          align-items: center;
          overflow-x: auto;
          overflow-y: hidden;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: var(--color-border, #555) transparent;
        }
        
        .tab-bar-scroll::-webkit-scrollbar {
          height: 4px;
        }
        
        .tab-bar-scroll::-webkit-scrollbar-thumb {
          background: var(--color-border, #555);
          border-radius: 2px;
        }
        
        .tab-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: var(--color-background, #252526);
          border: 1px solid transparent;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
          cursor: pointer;
          min-width: 120px;
          max-width: 200px;
          height: 32px;
          margin-right: 2px;
          transition: background 0.15s ease;
        }
        
        .tab-item:hover {
          background: var(--color-background-hover, #2d2d2d);
        }
        
        .tab-item.active {
          background: var(--color-background-primary, #1e1e1e);
          border-color: var(--color-border, #333);
          border-bottom-color: var(--color-background-primary, #1e1e1e);
        }
        
        .tab-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          color: var(--color-text-muted, #888);
        }
        
        .tab-item.active .tab-icon {
          color: var(--color-primary, #0078d4);
        }
        
        .tab-name {
          flex: 1;
          font-size: 12px;
          color: var(--color-text-secondary, #ccc);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tab-item.active .tab-name {
          color: var(--color-text, #fff);
        }
        
        .tab-unsaved {
          color: var(--color-warning, #ffc107);
          font-size: 16px;
          line-height: 1;
        }
        
        .tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s, background 0.15s;
        }
        
        .tab-item:hover .tab-close {
          opacity: 0.7;
        }
        
        .tab-close:hover {
          opacity: 1 !important;
          background: var(--color-danger, #dc3545);
        }
        
        .tab-close svg {
          width: 12px;
          height: 12px;
          color: var(--color-text-secondary, #ccc);
        }
        
        .tab-close:hover svg {
          color: white;
        }
        
        .tab-new {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          margin-left: 4px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: var(--color-text-secondary, #888);
          transition: background 0.15s, color 0.15s;
        }
        
        .tab-new:hover {
          background: var(--color-background-hover, #333);
          color: var(--color-text, #fff);
        }
        
        .tab-new svg {
          width: 16px;
          height: 16px;
        }
        
        .tab-count {
          font-size: 11px;
          color: var(--color-warning, #ffc107);
          padding: 2px 6px;
          margin-left: 8px;
          background: rgba(255, 193, 7, 0.1);
          border-radius: 4px;
        }
        
        /* Light theme overrides */
        :root[data-theme="light"] .tab-bar {
          background: #f3f3f3;
          border-color: #ddd;
        }
        
        :root[data-theme="light"] .tab-item {
          background: #e8e8e8;
        }
        
        :root[data-theme="light"] .tab-item:hover {
          background: #ddd;
        }
        
        :root[data-theme="light"] .tab-item.active {
          background: #fff;
          border-color: #ddd;
        }
        
        :root[data-theme="light"] .tab-name {
          color: #666;
        }
        
        :root[data-theme="light"] .tab-item.active .tab-name {
          color: #333;
        }
      `}</style>
    </div>
  );
}
