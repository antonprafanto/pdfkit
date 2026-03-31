export type ViewMode = 'single' | 'continuous' | 'two-page' | 'book';
export type ViewerShellMode = 'normal' | 'read' | 'fullscreen' | 'slideshow';

export type PersistedViewMode = ViewMode | 'facing' | null | undefined;

export function normalizeViewMode(
  viewMode: PersistedViewMode,
  fallback: ViewMode = 'continuous'
): ViewMode {
  switch (viewMode) {
    case 'single':
    case 'continuous':
    case 'two-page':
    case 'book':
      return viewMode;
    case 'facing':
      return 'book';
    default:
      return fallback;
  }
}
