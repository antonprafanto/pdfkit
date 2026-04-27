export interface ExternalDisplayInfo {
  id: number;
  label: string;
  width: number;
  height: number;
}

export interface PresenterStartPayload {
  displayId: number;
  sourceTabId: string;
  fileName: string | null;
  pageNumber: number;
  pdfBytes: number[];
}

export interface PresenterDocumentPayload {
  fileName: string | null;
  pageNumber: number;
  pdfBytes: number[];
}

export interface PresenterStatus {
  active: boolean;
  displayId: number | null;
  sourceTabId: string | null;
}
