/**
 * PDF Annotation Extraction Service
 * Reads existing annotations from PDF files and converts them to our format
 */

import { PDFDocument, PDFPage, PDFArray, PDFDict, PDFName, PDFString } from 'pdf-lib';
import { Annotation, StickyNoteAnnotation, DrawingAnnotation, StampAnnotation } from '../store/annotation-store';

/**
 * Extract all annotations from a PDF
 */
export async function extractAnnotationsFromPdf(pdfBytes: Uint8Array): Promise<Annotation[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const annotations: Annotation[] = [];
  
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const pageAnnotations = await extractPageAnnotations(pdfDoc, page, pageIndex + 1);
    annotations.push(...pageAnnotations);
  }
  
  return annotations;
}

/**
 * Extract annotations from a single page
 */
async function extractPageAnnotations(
  pdfDoc: PDFDocument,
  page: PDFPage,
  pageNumber: number
): Promise<Annotation[]> {
  const annotations: Annotation[] = [];
  const { height } = page.getSize();
  
  const pageDict = page.node;
  const annots = pageDict.get(PDFName.of('Annots'));
  
  if (!annots) return annotations;
  
  // Resolve if it's a reference
  const annotsArray = annots instanceof PDFArray 
    ? annots 
    : pdfDoc.context.lookup(annots) as PDFArray;
    
  if (!(annotsArray instanceof PDFArray)) return annotations;
  
  for (let i = 0; i < annotsArray.size(); i++) {
    const annotRef = annotsArray.get(i);
    const annotDict = pdfDoc.context.lookup(annotRef) as PDFDict;
    
    if (!(annotDict instanceof PDFDict)) continue;
    
    try {
      const annotation = parseAnnotation(annotDict, pageNumber, height);
      if (annotation) {
        annotations.push(annotation);
      }
    } catch (err) {
      console.error('Failed to parse annotation:', err);
    }
  }
  
  return annotations;
}

/**
 * Parse a single annotation
 */
function parseAnnotation(
  annotDict: PDFDict,
  pageNumber: number,
  pageHeight: number
): Annotation | null {
  const subtype = annotDict.get(PDFName.of('Subtype'));
  if (!subtype) return null;
  
  const subtypeName = (subtype as PDFName).asString();
  const rect = annotDict.get(PDFName.of('Rect')) as PDFArray;
  const contents = annotDict.get(PDFName.of('Contents'));
  const color = annotDict.get(PDFName.of('C')) as PDFArray;
  
  // Get color
  const annotColor = color ? rgbToHex(
    (color.get(0) as any).asNumber(),
    (color.get(1) as any).asNumber(),
    (color.get(2) as any).asNumber()
  ) : '#FFEB3B';
  
  const now = new Date().toISOString();
  const id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  switch (subtypeName) {
    case '/Text': {
      // Sticky note annotation
      const rectArray = [
        (rect.get(0) as any).asNumber(),
        (rect.get(1) as any).asNumber(),
        (rect.get(2) as any).asNumber(),
        (rect.get(3) as any).asNumber()
      ];
      
      const x = rectArray[0];
      const pdfY = rectArray[3]; // Top of rect
      const y = pageHeight - pdfY; // Convert to top-left origin
      
      const contentStr = contents instanceof PDFString 
        ? contents.asString() 
        : '';
      
      return {
        id,
        type: 'sticky-note',
        pageNumber,
        x,
        y,
        content: contentStr,
        color: annotColor,
        isExpanded: false,
        createdAt: now,
        updatedAt: now,
      } as StickyNoteAnnotation;
    }
    
    case '/Ink': {
      // Ink/pen annotation
      const inkList = annotDict.get(PDFName.of('InkList')) as PDFArray;
      if (!inkList) return null;
      
      const points: Array<{ x: number; y: number }> = [];
      const path = inkList.get(0) as PDFArray;
      
      for (let i = 0; i < path.size(); i += 2) {
        const x = (path.get(i) as any).asNumber();
        const pdfY = (path.get(i + 1) as any).asNumber();
        points.push({ x, y: pageHeight - pdfY });
      }
      
      const bs = annotDict.get(PDFName.of('BS')) as PDFDict;
      const strokeWidth = bs ? ((bs.get(PDFName.of('W')) as any)?.asNumber() || 2) : 2;
      
      return {
        id,
        type: 'drawing',
        pageNumber,
        tool: 'pen',
        points,
        strokeWidth,
        color: annotColor,
        createdAt: now,
        updatedAt: now,
      } as DrawingAnnotation;
    }
    
    case '/Square': {
      // Rectangle annotation
      const rectArray = [
        (rect.get(0) as any).asNumber(),
        (rect.get(1) as any).asNumber(),
        (rect.get(2) as any).asNumber(),
        (rect.get(3) as any).asNumber()
      ];
      
      const x1 = rectArray[0];
      const pdfY1 = rectArray[1];
      const x2 = rectArray[2];
      const pdfY2 = rectArray[3];
      
      const points = [
        { x: x1, y: pageHeight - pdfY2 },
        { x: x2, y: pageHeight - pdfY1 }
      ];
      
      const bs = annotDict.get(PDFName.of('BS')) as PDFDict;
      const strokeWidth = bs ? ((bs.get(PDFName.of('W')) as any)?.asNumber() || 2) : 2;
      
      return {
        id,
        type: 'drawing',
        pageNumber,
        tool: 'rectangle',
        points,
        strokeWidth,
        color: annotColor,
        createdAt: now,
        updatedAt: now,
      } as DrawingAnnotation;
    }
    
    case '/Circle': {
      // Circle annotation
      const rectArray = [
        (rect.get(0) as any).asNumber(),
        (rect.get(1) as any).asNumber(),
        (rect.get(2) as any).asNumber(),
        (rect.get(3) as any).asNumber()
      ];
      
      const x1 = rectArray[0];
      const pdfY1 = rectArray[1];
      const x2 = rectArray[2];
      const pdfY2 = rectArray[3];
      
      const points = [
        { x: x1, y: pageHeight - pdfY2 },
        { x: x2, y: pageHeight - pdfY1 }
      ];
      
      const bs = annotDict.get(PDFName.of('BS')) as PDFDict;
      const strokeWidth = bs ? ((bs.get(PDFName.of('W')) as any)?.asNumber() || 2) : 2;
      
      return {
        id,
        type: 'drawing',
        pageNumber,
        tool: 'circle',
        points,
        strokeWidth,
        color: annotColor,
        createdAt: now,
        updatedAt: now,
      } as DrawingAnnotation;
    }
    
    case '/Line': {
      // Line/Arrow annotation
      const l = annotDict.get(PDFName.of('L')) as PDFArray;
      if (!l) return null;
      
      const x1 = (l.get(0) as any).asNumber();
      const pdfY1 = (l.get(1) as any).asNumber();
      const x2 = (l.get(2) as any).asNumber();
      const pdfY2 = (l.get(3) as any).asNumber();
      
      const points = [
        { x: x1, y: pageHeight - pdfY1 },
        { x: x2, y: pageHeight - pdfY2 }
      ];
      
      const le = annotDict.get(PDFName.of('LE')) as PDFArray;
      const hasArrow = le && le.size() > 1 && (le.get(1) as PDFName).asString().includes('Arrow');
      
      const bs = annotDict.get(PDFName.of('BS')) as PDFDict;
      const strokeWidth = bs ? ((bs.get(PDFName.of('W')) as any)?.asNumber() || 2) : 2;
      
      return {
        id,
        type: 'drawing',
        pageNumber,
        tool: hasArrow ? 'arrow' : 'line',
        points,
        strokeWidth,
        color: annotColor,
        createdAt: now,
        updatedAt: now,
      } as DrawingAnnotation;
    }
    
    case '/Stamp': {
      // Stamp annotation
      const rectArray = [
        (rect.get(0) as any).asNumber(),
        (rect.get(1) as any).asNumber(),
        (rect.get(2) as any).asNumber(),
        (rect.get(3) as any).asNumber()
      ];
      
      const x = rectArray[0];
      const pdfY = rectArray[3];
      const y = pageHeight - pdfY;
      
      const name = annotDict.get(PDFName.of('Name')) as PDFName;
      const stampName = name ? name.asString().replace('/', '').toLowerCase() : 'draft';
      
      // Map PDF stamp names to our types
      const stampTypeMap: Record<string, StampAnnotation['stampType']> = {
        'approved': 'approved',
        'notapproved': 'rejected',
        'draft': 'draft',
        'confidential': 'confidential',
        'reviewed': 'reviewed',
      };
      
      const stampType = stampTypeMap[stampName] || 'draft';
      
      return {
        id,
        type: 'stamp',
        pageNumber,
        x,
        y,
        stampType,
        color: annotColor,
        scale: 1,
        rotation: 0,
        createdAt: now,
        updatedAt: now,
      } as StampAnnotation;
    }
    
    default:
      return null;
  }
}

/**
 * Helper to convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
