/**
 * Signature Viewer Dialog
 * Displays digital signature information for the current PDF
 */

import { useState, useEffect } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { signatureService, SignatureInfo, SignatureField } from '../../lib/signature.service';
import { useEditingStore } from '../../store/editing-store';

interface SignatureViewerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SignatureViewerDialog({ open, onClose }: SignatureViewerDialogProps) {
  const { modifiedPdfBytes, originalFile } = useEditingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  // Load PDF bytes from modifiedPdfBytes or originalFile
  useEffect(() => {
    const loadPdfBytes = async () => {
      if (modifiedPdfBytes) {
        setPdfBytes(modifiedPdfBytes);
      } else if (originalFile) {
        const buffer = await originalFile.arrayBuffer();
        setPdfBytes(new Uint8Array(buffer));
      } else {
        setPdfBytes(null);
      }
    };
    
    if (open) {
      loadPdfBytes();
    }
  }, [open, modifiedPdfBytes, originalFile]);

  useEffect(() => {
    if (open && pdfBytes) {
      loadSignatureInfo();
    }
  }, [open, pdfBytes]);

  const loadSignatureInfo = async () => {
    if (!pdfBytes) {
      setError('No PDF document loaded');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await signatureService.detectSignatures(pdfBytes);
      setSignatureInfo(info);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze signatures');
    }

    setIsLoading(false);
  };

  const getStatusIcon = (field: SignatureField) => {
    return field.isSigned ? '✅' : '⬜';
  };

  const getOverallStatus = () => {
    if (!signatureInfo) return null;

    if (!signatureInfo.hasSignatures) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <span className="text-2xl">📄</span>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">No Signature Fields</p>
            <p className="text-sm text-gray-500">This document does not contain any signature fields.</p>
          </div>
        </div>
      );
    }

    if (signatureInfo.signedCount === signatureInfo.signatureFields.length) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-medium text-green-700 dark:text-green-300">Fully Signed</p>
            <p className="text-sm text-green-600">All {signatureInfo.signedCount} signature(s) have been applied.</p>
          </div>
        </div>
      );
    }

    if (signatureInfo.signedCount === 0) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-300">Unsigned</p>
            <p className="text-sm text-amber-600">{signatureInfo.unsignedCount} signature field(s) awaiting signature.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <span className="text-2xl">📝</span>
        <div>
          <p className="font-medium text-blue-700 dark:text-blue-300">Partially Signed</p>
          <p className="text-sm text-blue-600">{signatureInfo.signedCount} of {signatureInfo.signatureFields.length} signatures applied.</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="🔏 Digital Signatures"
      description="View signature fields and status"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={loadSignatureInfo} disabled={isLoading || !pdfBytes}>
            {isLoading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {!pdfBytes ? (
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800 text-center">
            <p className="text-gray-500">No PDF document loaded</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-500">Analyzing signatures...</span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : (
          <>
            {/* Overall Status */}
            {getOverallStatus()}

            {/* Signature Fields List */}
            {signatureInfo && signatureInfo.hasSignatures && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Signature Fields ({signatureInfo.signatureFields.length})
                </h4>
                <div className="space-y-2">
                  {signatureInfo.signatureFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getStatusIcon(field)}</span>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {field.name || `Signature ${index + 1}`}
                          </p>
                          {field.pageIndex !== undefined && (
                            <p className="text-xs text-gray-500">
                              Page {field.pageIndex + 1}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        field.isSigned 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {field.isSigned ? 'Signed' : 'Unsigned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info about signing */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">ℹ️ About Digital Signatures</p>
              <p>
                Digital signatures verify document authenticity and integrity. 
                This viewer shows signature fields and their status. 
                For signing documents, use Adobe Acrobat or other PDF signing tools.
              </p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
