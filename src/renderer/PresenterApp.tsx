import { useCallback, useEffect, useRef, useState } from 'react';
import { PDFPage } from './components/PDFPage';
import { Spinner } from './components/ui';
import { useViewportSize } from './hooks/useViewportSize';
import { pdfService } from './lib/pdf-service';
import type { PDFDocumentProxy } from './lib/pdf-config';
import type { PresenterDocumentPayload } from '../shared/types/presenter';

const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
const PAGE_PADDING = 32;

const clampScale = (scale: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

export default function PresenterApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportSize = useViewportSize(containerRef);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fitCurrentPageToScreen = useCallback(
    async (pdfDocument: PDFDocumentProxy, pageNumber: number) => {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1, rotation: 0 });
      const availableWidth = Math.max(viewportSize.width - PAGE_PADDING, 1);
      const availableHeight = Math.max(viewportSize.height - PAGE_PADDING, 1);
      const fittedScale = Math.min(availableWidth / viewport.width, availableHeight / viewport.height);
      setScale(clampScale(fittedScale));
    },
    [viewportSize.height, viewportSize.width]
  );

  const loadPresenterDocument = useCallback(
    async (payload: PresenterDocumentPayload) => {
      try {
        setIsLoading(true);
        setError(null);
        setFileName(payload.fileName);
        setCurrentPage(payload.pageNumber);

        await pdfService.closeDocument();
        const pdfDocument = await pdfService.loadFromBuffer(new Uint8Array(payload.pdfBytes).buffer);
        setDocument(pdfDocument);
        await fitCurrentPageToScreen(pdfDocument, payload.pageNumber);
      } catch (loadError) {
        console.error('[PresenterApp] Failed to load presenter document:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load presenter document');
      } finally {
        setIsLoading(false);
      }
    },
    [fitCurrentPageToScreen]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const payload = await window.electronAPI.getPresenterBootstrapData();
      if (payload && isMounted) {
        await loadPresenterDocument(payload);
      } else if (isMounted && !payload) {
        setIsLoading(false);
        setError('Presenter session is not ready');
      }
    };

    void bootstrap();

    const unsubscribeDocument = window.electronAPI.onPresenterLoadDocument((payload) => {
      void loadPresenterDocument(payload);
    });
    const unsubscribePage = window.electronAPI.onPresenterPageChanged((pageNumber) => {
      setCurrentPage(pageNumber);
    });

    return () => {
      isMounted = false;
      unsubscribeDocument();
      unsubscribePage();
      void pdfService.closeDocument();
    };
  }, [loadPresenterDocument]);

  useEffect(() => {
    if (!document) {
      return;
    }

    void fitCurrentPageToScreen(document, currentPage);
  }, [currentPage, document, fitCurrentPageToScreen]);

  return (
    <main
      ref={containerRef}
      className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black text-white"
    >
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-white/70">Loading presenter view...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="max-w-md text-center">
          <p className="text-lg font-medium">Presenter Mode unavailable</p>
          <p className="mt-2 text-sm text-white/70">{error}</p>
        </div>
      )}

      {!isLoading && !error && document && (
        <div className="flex h-full w-full items-center justify-center p-4">
          <PDFPage
            document={document}
            pageNumber={currentPage}
            scale={scale}
            rotation={0}
          />
        </div>
      )}

      {!isLoading && !error && !document && (
        <div className="text-sm text-white/70">
          {fileName ? `Waiting for ${fileName}` : 'Waiting for presenter content'}
        </div>
      )}
    </main>
  );
}
