import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFViewer } from './PDFViewer';
import { usePDFStore } from '../store/pdf-store';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock('./PDFPage', () => ({
  PDFPage: () => <div>PDF Page</div>,
}));

vi.mock('./PDFThumbnailSidebar', () => ({
  PDFThumbnailSidebar: () => <div>Thumbnail Sidebar</div>,
}));

vi.mock('./PDFContinuousView', () => ({
  PDFContinuousView: () => <div>Continuous View</div>,
}));

vi.mock('./PDFFacingView', () => ({
  PDFFacingView: () => <div>Facing View</div>,
}));

vi.mock('./PDFSearchBar', () => ({
  PDFSearchBar: () => <div>Search Bar</div>,
}));

vi.mock('./PDFPropertiesDialog', () => ({
  PDFPropertiesDialog: () => null,
}));

vi.mock('./KeyboardShortcutsHelp', () => ({
  KeyboardShortcutsHelp: () => null,
}));

vi.mock('./annotations', () => ({
  AnnotationToolbar: () => <div>Annotation Toolbar</div>,
  AnnotationListSidebar: () => <div>Annotation Sidebar</div>,
}));

vi.mock('./forms', () => ({
  FormToolbar: () => <div>Form Toolbar</div>,
}));

vi.mock('./ai/ChatWithPDFPanel', () => ({
  ChatWithPDFPanel: () => <div>Chat Panel</div>,
}));

vi.mock('./ai/DocumentAnalysisPanel', () => ({
  DocumentAnalysisPanel: () => <div>Analysis Panel</div>,
}));

vi.mock('../hooks/useViewportSize', () => ({
  useViewportSize: () => ({ width: 1280, height: 720 }),
}));

vi.mock('../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => undefined,
}));

vi.mock('./ui', () => ({
  Spinner: () => <div>Spinner</div>,
}));

vi.mock('./ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('./RibbonToolbar', () => ({
  default: (props: { onToggleReadMode: () => void }) => (
    <button type="button" onClick={props.onToggleReadMode}>
      Toggle Read Mode
    </button>
  ),
}));

describe('PDFViewer floating toolbar', () => {
  const getPageMock = vi.fn().mockResolvedValue({
    getViewport: () => ({
      width: 600,
      height: 800,
    }),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    getPageMock.mockClear();

    usePDFStore.getState().closeAllTabs();
    const tabId = usePDFStore.getState().addTab({
      document: {
        getPage: getPageMock,
      } as any,
      fileName: 'sample.pdf',
      totalPages: 4,
      currentPage: 1,
      scale: 1,
      viewMode: 'single',
      isLoading: false,
      error: null,
    });

    usePDFStore.getState().setActiveTab(tabId);

    window.electronAPI.onTriggerPrint = vi.fn().mockReturnValue(() => {});
    window.electronAPI.onMenuToggleViewerFullscreen = vi.fn().mockReturnValue(() => {});
    window.electronAPI.onMenuStartSlideshow = vi.fn().mockReturnValue(() => {});
  });

  it('updates the zoom pill and auto-hides after inactivity', () => {
    render(<PDFViewer />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Read Mode' }));

    const toolbar = screen.getByTestId('viewer-floating-controls');
    expect(toolbar).toHaveClass('opacity-100');
    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('100%');

    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('105%');

    fireEvent.click(screen.getByTitle('Fit to Screen'));
    expect(getPageMock).toHaveBeenCalledWith(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(toolbar).toHaveClass('opacity-0');

    fireEvent.mouseMove(screen.getByTestId('pdf-viewer-root'));
    expect(toolbar).toHaveClass('opacity-100');
  });

  it('snaps zoom steps after a non-5 fit-to-screen result', async () => {
    getPageMock.mockResolvedValue({
      getViewport: () => ({
        width: 950,
        height: 1000,
      }),
    });

    render(<PDFViewer />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Read Mode' }));
    await act(async () => {
      fireEvent.click(screen.getByTitle('Fit to Screen'));
    });
    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('68%');

    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('70%');

    await act(async () => {
      fireEvent.click(screen.getByTitle('Fit to Screen'));
    });
    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('68%');

    fireEvent.click(screen.getByTitle('Zoom Out'));
    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('65%');
  });
});
