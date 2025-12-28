/**
 * Digital Signature Service
 * Detects and displays information about digital signatures in PDFs
 */

import { PDFDocument } from 'pdf-lib';

export interface SignatureField {
  name: string;
  isSigned: boolean;
  rect?: { x: number; y: number; width: number; height: number };
  pageIndex?: number;
}

export interface SignatureInfo {
  hasSignatures: boolean;
  signatureFields: SignatureField[];
  signedCount: number;
  unsignedCount: number;
}

export interface SignatureDetails {
  fieldName: string;
  signedBy?: string;
  signDate?: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  isValid?: boolean;
  certificateInfo?: {
    issuer?: string;
    subject?: string;
    validFrom?: string;
    validTo?: string;
  };
}

class SignatureService {
  /**
   * Detect signature fields in a PDF document
   */
  async detectSignatures(pdfBytes: Uint8Array): Promise<SignatureInfo> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });

      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const signatureFields: SignatureField[] = [];
      
      for (const field of fields) {
        const fieldType = field.constructor.name;
        const fieldName = field.getName();
        
        // Check if it's a signature field
        if (fieldType === 'PDFSignature' || fieldName.toLowerCase().includes('signature')) {
          const widgets = field.acroField.getWidgets();
          let rect = undefined;
          let pageIndex = undefined;
          
          if (widgets.length > 0) {
            const widget = widgets[0];
            const rectObj = widget.getRectangle();
            rect = {
              x: rectObj.x,
              y: rectObj.y,
              width: rectObj.width,
              height: rectObj.height,
            };
            
            // Try to get page index
            const pages = pdfDoc.getPages();
            for (let i = 0; i < pages.length; i++) {
              const pageRef = pages[i].ref;
              const widgetPageRef = widget.P();
              if (widgetPageRef && pageRef.toString() === widgetPageRef.toString()) {
                pageIndex = i;
                break;
              }
            }
          }
          
          // Check if signed (has a value)
          const acroField = field.acroField;
          const hasValue = acroField.V() !== undefined;
          
          signatureFields.push({
            name: fieldName,
            isSigned: hasValue,
            rect,
            pageIndex,
          });
        }
      }
      
      const signedCount = signatureFields.filter(f => f.isSigned).length;
      const unsignedCount = signatureFields.filter(f => !f.isSigned).length;

      return {
        hasSignatures: signatureFields.length > 0,
        signatureFields,
        signedCount,
        unsignedCount,
      };
    } catch (error) {
      console.error('Error detecting signatures:', error);
      return {
        hasSignatures: false,
        signatureFields: [],
        signedCount: 0,
        unsignedCount: 0,
      };
    }
  }

  /**
   * Get detailed signature information
   * Note: Full signature validation requires cryptographic libraries
   * This provides basic metadata extraction
   */
  async getSignatureDetails(pdfBytes: Uint8Array, fieldName: string): Promise<SignatureDetails | null> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });

      const form = pdfDoc.getForm();
      
      // Try to find the field
      const fields = form.getFields();
      const field = fields.find(f => f.getName() === fieldName);
      
      if (!field) {
        return null;
      }

      const acroField = field.acroField;
      const value = acroField.V();
      
      if (!value) {
        return {
          fieldName,
          signedBy: undefined,
          isValid: undefined,
        };
      }

      // Extract signature dictionary info if available
      // Note: Full signature parsing would require ASN.1/PKCS#7 parsing
      return {
        fieldName,
        signedBy: 'Signature Present',
        signDate: undefined,
        reason: undefined,
        location: undefined,
        isValid: undefined, // Would need crypto validation
        certificateInfo: undefined,
      };
    } catch (error) {
      console.error('Error getting signature details:', error);
      return null;
    }
  }

  /**
   * Check if PDF has any form of digital signature
   * Uses raw PDF content analysis
   */
  async hasDigitalSignature(pdfBytes: Uint8Array): Promise<boolean> {
    try {
      // Quick check by looking for signature-related strings
      const decoder = new TextDecoder('latin1');
      const content = decoder.decode(pdfBytes);
      
      // Look for signature indicators
      const hasSignatureDict = content.includes('/Type /Sig') || 
                               content.includes('/Type/Sig') ||
                               content.includes('/SubFilter /adbe.pkcs7') ||
                               content.includes('/SubFilter /ETSI.CAdES');
      
      if (hasSignatureDict) {
        return true;
      }
      
      // Also check via form fields
      const info = await this.detectSignatures(pdfBytes);
      return info.signedCount > 0;
    } catch (error) {
      console.error('Error checking signature:', error);
      return false;
    }
  }

  /**
   * Get quick signature status for display
   */
  async getSignatureStatus(pdfBytes: Uint8Array): Promise<{
    status: 'none' | 'unsigned' | 'signed' | 'partial';
    message: string;
    signedCount: number;
    totalFields: number;
  }> {
    const info = await this.detectSignatures(pdfBytes);
    
    if (info.signatureFields.length === 0) {
      // Check for embedded signatures without form fields
      const hasEmbedded = await this.hasDigitalSignature(pdfBytes);
      if (hasEmbedded) {
        return {
          status: 'signed',
          message: 'Document contains digital signature',
          signedCount: 1,
          totalFields: 1,
        };
      }
      return {
        status: 'none',
        message: 'No signature fields',
        signedCount: 0,
        totalFields: 0,
      };
    }
    
    if (info.signedCount === 0) {
      return {
        status: 'unsigned',
        message: `${info.unsignedCount} unsigned signature field(s)`,
        signedCount: 0,
        totalFields: info.signatureFields.length,
      };
    }
    
    if (info.unsignedCount === 0) {
      return {
        status: 'signed',
        message: `${info.signedCount} signature(s) applied`,
        signedCount: info.signedCount,
        totalFields: info.signatureFields.length,
      };
    }
    
    return {
      status: 'partial',
      message: `${info.signedCount}/${info.signatureFields.length} signed`,
      signedCount: info.signedCount,
      totalFields: info.signatureFields.length,
    };
  }
}

export const signatureService = new SignatureService();
