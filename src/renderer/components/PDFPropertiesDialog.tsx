/**
 * PDF Properties Dialog
 * Shows detailed information about the PDF document
 */

import { PDFDocumentProxy } from '../lib/pdf-config';
import { PDFMetadata } from '../store/pdf-store';
import { Dialog, Button } from './ui';

interface PDFPropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  document: PDFDocumentProxy;
  metadata: PDFMetadata | null;
  fileName: string | null;
}

export function PDFPropertiesDialog({
  open,
  onClose,
  document,
  metadata,
  fileName,
}: PDFPropertiesDialogProps) {
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      // PDF dates are in format: D:YYYYMMDDHHmmSSOHH'mm'
      if (dateString.startsWith('D:')) {
        const year = dateString.substring(2, 6);
        const month = dateString.substring(6, 8);
        const day = dateString.substring(8, 10);
        const hours = dateString.substring(10, 12);
        const minutes = dateString.substring(12, 14);

        return `${year}-${month}-${day} ${hours}:${minutes}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const properties = [
    { label: 'File Name', value: fileName || 'Unknown' },
    { label: 'Title', value: metadata?.title || 'Untitled' },
    { label: 'Author', value: metadata?.author || 'Unknown' },
    { label: 'Subject', value: metadata?.subject || 'N/A' },
    { label: 'Keywords', value: metadata?.keywords || 'N/A' },
    { label: 'Creator', value: metadata?.creator || 'N/A' },
    { label: 'Producer', value: metadata?.producer || 'N/A' },
    { label: 'Created', value: formatDate(metadata?.creationDate || '') },
    { label: 'Modified', value: formatDate(metadata?.modificationDate || '') },
    { label: 'Pages', value: document.numPages.toString() },
    { label: 'PDF Version', value: `${document.pdfInfo?.PDFFormatVersion || 'Unknown'}` },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Document Properties"
      description="Detailed information about this PDF document"
      footer={
        <Button onClick={onClose}>Close</Button>
      }
    >
      <div className="space-y-3">
        {properties.map((prop) => (
          <div
            key={prop.label}
            className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2 dark:border-gray-700"
          >
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{prop.label}:</dt>
            <dd className="col-span-2 text-sm text-gray-900 dark:text-white break-words">
              {prop.value}
            </dd>
          </div>
        ))}
      </div>

      {/* Additional info */}
      <div className="mt-4 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              PDF information is extracted from the document's metadata. Some fields may be empty if
              not set by the creator.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
