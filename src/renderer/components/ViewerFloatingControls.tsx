import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewerShellMode } from '../lib/view-mode';

interface ViewerFloatingControlsProps {
  shellMode: Exclude<ViewerShellMode, 'normal'>;
  scale: number;
  isVisible: boolean;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onExit: () => void;
  onInteract: () => void;
}

export function ViewerFloatingControls({
  shellMode,
  scale,
  isVisible,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onExit,
  onInteract,
}: ViewerFloatingControlsProps) {
  const { t } = useTranslation();
  const zoomPercentage = `${Math.round(scale * 100)}%`;
  const modeLabel =
    shellMode === 'read'
      ? t('toolbar.readMode', 'Read Mode')
      : shellMode === 'fullscreen'
        ? t('toolbar.fullScreen', 'Full Screen')
        : t('toolbar.slideShow', 'Slide Show');

  const ControlButton = ({
    label,
    onClick,
    disabled = false,
    children,
  }: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => {
        onInteract();
        onClick();
      }}
      disabled={disabled}
      title={label}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 px-3 text-sm text-white shadow-lg transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        data-testid="viewer-floating-controls"
        aria-hidden={!isVisible}
        className={`flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-white shadow-2xl backdrop-blur transition-all duration-300 ${
          isVisible
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <span className="px-2 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
          {modeLabel}
        </span>

        <ControlButton
          label={t('toolbar.previousPage', 'Previous Page')}
          onClick={onPreviousPage}
          disabled={currentPage <= 1}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </ControlButton>

        <div className="min-w-[88px] text-center text-sm font-medium">
          {currentPage} / {totalPages}
        </div>

        <ControlButton
          label={t('toolbar.nextPage', 'Next Page')}
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </ControlButton>

        <div className="mx-1 h-6 w-px bg-white/20" />

        <ControlButton label={t('toolbar.zoomOut', 'Zoom Out')} onClick={onZoomOut}>
          <span className="text-base font-semibold">-</span>
        </ControlButton>
        <ControlButton label={t('toolbar.zoomIn', 'Zoom In')} onClick={onZoomIn}>
          <span className="text-base font-semibold">+</span>
        </ControlButton>
        <ControlButton label={t('toolbar.fitToScreen', 'Fit to Screen')} onClick={onFitToScreen}>
          {zoomPercentage}
        </ControlButton>

        <div className="mx-1 h-6 w-px bg-white/20" />

        <ControlButton label={t('viewer.exitMode', 'Exit Mode')} onClick={onExit}>
          {t('viewer.exitMode', 'Exit Mode')}
        </ControlButton>
      </div>
    </div>
  );
}
