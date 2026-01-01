import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

interface RibbonToolbarProps {
  // File operations
  onOpenFile?: () => void;
  onOpenRecent?: () => void;
  onCloseDocument?: () => void;
  // Page navigation
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  // Zoom
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  // View modes
  viewMode: 'single' | 'continuous' | 'facing';
  onSetViewMode: (mode: 'single' | 'continuous' | 'facing') => void;
  showThumbnails: boolean;
  onToggleThumbnails: () => void;
  // Rotation
  onRotateClockwise: () => void;
  onRotateCounterClockwise: () => void;
  // Modes
  annotationMode: boolean;
  onToggleAnnotationMode: () => void;
  formsMode: boolean;
  onToggleFormsMode: () => void;
  aiMode: boolean;
  onToggleAIMode: () => void;
  // Search
  showSearch: boolean;
  onToggleSearch: () => void;
  // Properties
  onShowProperties: () => void;
  // Tools
  onOpenMerge?: () => void;
  onOpenSplit?: () => void;
  onOpenRotate?: () => void;
  onOpenDelete?: () => void;
  onOpenReorder?: () => void;
  onOpenExtract?: () => void;
  onOpenDuplicate?: () => void;
  onOpenExportImages?: () => void;
  onOpenImportImages?: () => void;
  onOpenConvertOffice?: () => void;
  onOpenEncryptPDF?: () => void;
  onOpenBulkEncrypt?: () => void;
  onOpenWatermark?: () => void;
  onOpenSignatures?: () => void;
  onOpenOCR?: () => void;
  onOpenCompress?: () => void;
  onOpenSignPDF?: () => void;
  onOpenBatch?: () => void;
  onOpenPluginManager?: () => void;
  // State
  hasDocument: boolean;
  filePath?: string; // Path to current PDF for printing
  fileName?: string; // Name of current PDF
  onPrint?: () => void; // Print callback
}

type TabId = 'beranda' | 'edit' | 'halaman' | 'alat' | 'tampilan';

const RibbonToolbar: React.FC<RibbonToolbarProps> = (props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('beranda');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'beranda', label: t('ribbon.home') },
    { id: 'edit', label: t('ribbon.edit') },
    { id: 'halaman', label: t('ribbon.page') },
    { id: 'alat', label: t('ribbon.tools') },
    { id: 'tampilan', label: t('ribbon.view') },
  ];

  // Reusable button component for ribbon - COMPACT version
  const RibbonButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
  }> = ({ icon, label, onClick, disabled, active }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center px-1.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[45px] ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${active ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
    >
      <div className="h-4 w-4 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] mt-0.5 text-gray-700 dark:text-gray-300 whitespace-nowrap leading-tight">{label}</span>
    </button>
  );

  // Separator between groups - smaller
  const Separator = () => (
    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1" />
  );

  // Tab content renderers
  const renderBerandaTab = () => (
    <div className="flex items-center">
      {/* File Operations */}
      <div className="flex items-center gap-1">
        <RibbonButton
          icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
          label={t('menu.openPDF')}
          onClick={props.onOpenFile}
        />
        <RibbonButton
          icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label={t('menu.recentFiles')}
          onClick={props.onOpenRecent}
        />
        <RibbonButton
          icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          label={t('menu.closeDocument')}
          onClick={props.onCloseDocument}
          disabled={!props.hasDocument}
        />
        <RibbonButton
          icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>}
          label={t('toolbar.print')}
          onClick={props.onPrint}
          disabled={!props.hasDocument}
        />
        <RibbonButton
          icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label={t('toolbar.properties')}
          onClick={props.onShowProperties}
          disabled={!props.hasDocument}
        />
      </div>

      <Separator />

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => props.onGoToPage(1)} disabled={props.currentPage <= 1} className="px-2" title="First Page">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </Button>
        <Button size="sm" variant="outline" onClick={props.onPreviousPage} disabled={props.currentPage <= 1} className="px-2" title="Previous Page">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Button>
        <input
          type="number"
          min={1}
          max={props.totalPages}
          value={props.currentPage}
          onChange={(e) => props.onGoToPage(parseInt(e.target.value))}
          className="w-12 rounded border border-gray-300 px-1.5 py-0.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">/ {props.totalPages}</span>
        <Button size="sm" variant="outline" onClick={props.onNextPage} disabled={props.currentPage >= props.totalPages} className="px-2" title="Next Page">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Button>
        <Button size="sm" variant="outline" onClick={() => props.onGoToPage(props.totalPages)} disabled={props.currentPage >= props.totalPages} className="px-2" title="Last Page">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
        </Button>
      </div>

      <Separator />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={props.onZoomOut} disabled={props.scale <= 0.25} className="px-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-center">{Math.round(props.scale * 100)}%</span>
        <Button size="sm" variant="outline" onClick={props.onZoomIn} disabled={props.scale >= 5.0} className="px-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </Button>
      </div>

      <Separator />

      {/* Search */}
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
        label={t('toolbar.search')}
        onClick={props.onToggleSearch}
        active={props.showSearch}
        disabled={!props.hasDocument}
      />
    </div>
  );

  const renderEditTab = () => (
    <div className="flex items-center">
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
        label={t('toolbar.enterAnnotation')}
        onClick={props.onToggleAnnotationMode}
        active={props.annotationMode}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        label={t('toolbar.enterForms')}
        onClick={props.onToggleFormsMode}
        active={props.formsMode}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
        label={t('toolbar.enterAI')}
        onClick={props.onToggleAIMode}
        active={props.aiMode}
        disabled={!props.hasDocument}
      />

      <Separator />

      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
        label={t('toolbar.search')}
        onClick={props.onToggleSearch}
        active={props.showSearch}
        disabled={!props.hasDocument}
      />
    </div>
  );

  const renderHalamanTab = () => (
    <div className="flex items-center">
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
        label={t('tools.rotate')}
        onClick={props.onOpenRotate}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>}
        label={t('tools.split')}
        onClick={props.onOpenSplit}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
        label={t('tools.merge')}
        onClick={props.onOpenMerge}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>}
        label={t('tools.reorder')}
        onClick={props.onOpenReorder}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
        label={t('tools.delete')}
        onClick={props.onOpenDelete}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
        label={t('tools.extract')}
        onClick={props.onOpenExtract}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
        label={t('tools.duplicate')}
        onClick={props.onOpenDuplicate}
        disabled={!props.hasDocument}
      />
    </div>
  );

  const renderAlatTab = () => (
    <div className="flex items-center">
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>}
        label={t('tools.ocr')}
        onClick={props.onOpenOCR}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        label={t('tools.compress')}
        onClick={props.onOpenCompress}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
        label={t('tools.watermark')}
        onClick={props.onOpenWatermark}
        disabled={!props.hasDocument}
      />

      <Separator />

      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
        label={t('tools.encrypt')}
        onClick={props.onOpenEncryptPDF}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>}
        label={t('tools.bulkEncrypt')}
        onClick={props.onOpenBulkEncrypt}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        label={t('tools.viewSignatures')}
        onClick={props.onOpenSignatures}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
        label={t('tools.sign')}
        onClick={props.onOpenSignPDF}
        disabled={!props.hasDocument}
      />

      <Separator />

      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        label={t('tools.exportImages')}
        onClick={props.onOpenExportImages}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
        label={t('tools.importImages')}
        onClick={props.onOpenImportImages}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        label={t('tools.officeToPdf')}
        onClick={props.onOpenConvertOffice}
      />

      <Separator />

      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        label={t('tools.batch')}
        onClick={props.onOpenBatch}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>}
        label={t('tools.plugins')}
        onClick={props.onOpenPluginManager}
      />
    </div>
  );

  const renderTampilanTab = () => (
    <div className="flex items-center">
      {/* View Modes */}
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="16" strokeWidth={2} /></svg>}
        label={t('toolbar.singlePage')}
        onClick={() => props.onSetViewMode('single')}
        active={props.viewMode === 'single'}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
        label={t('toolbar.continuousScroll')}
        onClick={() => props.onSetViewMode('continuous')}
        active={props.viewMode === 'continuous'}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="16" strokeWidth={2} /><rect x="13" y="4" width="7" height="16" strokeWidth={2} /></svg>}
        label={t('toolbar.facingPages')}
        onClick={() => props.onSetViewMode('facing')}
        active={props.viewMode === 'facing'}
      />

      <Separator />

      {/* Thumbnails */}
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
        label={props.showThumbnails ? t('toolbar.hideThumbnails') : t('toolbar.showThumbnails')}
        onClick={props.onToggleThumbnails}
        active={props.showThumbnails}
      />

      <Separator />

      {/* Rotation */}
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
        label={t('toolbar.rotateCounterClockwise')}
        onClick={props.onRotateCounterClockwise}
        disabled={!props.hasDocument}
      />
      <RibbonButton
        icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>}
        label={t('toolbar.rotateClockwise')}
        onClick={props.onRotateClockwise}
        disabled={!props.hasDocument}
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'beranda': return renderBerandaTab();
      case 'edit': return renderEditTab();
      case 'halaman': return renderHalamanTab();
      case 'alat': return renderAlatTab();
      case 'tampilan': return renderTampilanTab();
      default: return null;
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content - Scrollable */}
      <div className="px-3 py-2 min-h-[52px] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex items-center min-w-max">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default RibbonToolbar;
