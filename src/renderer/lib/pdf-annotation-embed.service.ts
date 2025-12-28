/**
 * PDF Annotation Embedding Service
 * Converts our annotations to real PDF annotations that can be viewed in other PDF readers
 */

import { PDFDocument, PDFPage, PDFArray, PDFDict, PDFName, PDFString } from 'pdf-lib';
import { Annotation, StickyNoteAnnotation, DrawingAnnotation, StampAnnotation } from '../store/annotation-store';

// Color string to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
  return { r: 1, g: 1, b: 0 }; // Default yellow
}

/**
 * Embed annotations into a PDF document
 */
export async function embedAnnotationsToPdf(
  pdfBytes: Uint8Array,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Group annotations by page
  const annotationsByPage = annotations.reduce((acc, ann) => {
    if (!acc[ann.pageNumber]) {
      acc[ann.pageNumber] = [];
    }
    acc[ann.pageNumber].push(ann);
    return acc;
  }, {} as Record<number, Annotation[]>);

  // Process each page
  for (const [pageNumStr, pageAnnotations] of Object.entries(annotationsByPage)) {
    const pageNum = parseInt(pageNumStr);
    if (pageNum < 1 || pageNum > pages.length) continue;
    
    const page = pages[pageNum - 1];
    const { height } = page.getSize();

    for (const ann of pageAnnotations) {
      try {
        switch (ann.type) {
          case 'sticky-note':
            addTextAnnotation(pdfDoc, page, ann as StickyNoteAnnotation, height);
            break;
          case 'drawing':
            addDrawingAnnotation(pdfDoc, page, ann as DrawingAnnotation, height);
            break;
          case 'stamp':
            addStampAnnotation(pdfDoc, page, ann as StampAnnotation, height);
            break;
          // Highlight would require text position data which we don't have
        }
      } catch (err) {
        console.error(`Failed to embed annotation ${ann.id}:`, err);
      }
    }
  }

  return pdfDoc.save();
}

/**
 * Add a text/sticky note annotation
 */
function addTextAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  ann: StickyNoteAnnotation,
  pageHeight: number
) {
  const { r, g, b } = hexToRgb(ann.color);
  
  // PDF coordinates have origin at bottom-left, we use top-left
  const pdfY = pageHeight - ann.y;
  
  const annotDict = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Text',
    Rect: [ann.x, pdfY - 24, ann.x + 24, pdfY],
    Contents: PDFString.of(ann.content || 'Note'),
    Name: 'Comment',
    C: [r, g, b],
    Open: false,
    T: PDFString.of('PDF Kit'),
    M: PDFString.of(new Date().toISOString()),
    F: 4, // Print flag
  });

  addAnnotToPage(pdfDoc, page, annotDict);
}

/**
 * Add a drawing annotation (ink, square, circle, line)
 */
function addDrawingAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  ann: DrawingAnnotation,
  pageHeight: number
) {
  const { r, g, b } = hexToRgb(ann.color);
  
  if (ann.tool === 'pen' && ann.points.length > 1) {
    // Ink annotation for freehand drawing
    const inkList: number[][] = [];
    const pathPoints: number[] = [];
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const pt of ann.points) {
      const pdfY = pageHeight - pt.y;
      pathPoints.push(pt.x, pdfY);
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pdfY);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pdfY);
    }
    
    inkList.push(pathPoints);
    
    const annotDict = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Ink',
      Rect: [minX - 5, minY - 5, maxX + 5, maxY + 5],
      InkList: inkList,
      C: [r, g, b],
      BS: { W: ann.strokeWidth, S: 'S' },
      T: PDFString.of('PDF Kit'),
      M: PDFString.of(new Date().toISOString()),
      F: 4,
    });
    
    addAnnotToPage(pdfDoc, page, annotDict);
    
  } else if (ann.points.length === 2) {
    const [p1, p2] = ann.points;
    const x1 = Math.min(p1.x, p2.x);
    const x2 = Math.max(p1.x, p2.x);
    const y1 = pageHeight - Math.max(p1.y, p2.y);
    const y2 = pageHeight - Math.min(p1.y, p2.y);
    
    if (ann.tool === 'rectangle') {
      const annotDict = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Square',
        Rect: [x1, y1, x2, y2],
        C: [r, g, b],
        BS: { W: ann.strokeWidth, S: 'S' },
        T: PDFString.of('PDF Kit'),
        M: PDFString.of(new Date().toISOString()),
        F: 4,
      });
      addAnnotToPage(pdfDoc, page, annotDict);
      
    } else if (ann.tool === 'circle') {
      const annotDict = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Circle',
        Rect: [x1, y1, x2, y2],
        C: [r, g, b],
        BS: { W: ann.strokeWidth, S: 'S' },
        T: PDFString.of('PDF Kit'),
        M: PDFString.of(new Date().toISOString()),
        F: 4,
      });
      addAnnotToPage(pdfDoc, page, annotDict);
      
    } else if (ann.tool === 'line' || ann.tool === 'arrow') {
      const pdfY1 = pageHeight - p1.y;
      const pdfY2 = pageHeight - p2.y;
      
      const annotDict = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Line',
        Rect: [Math.min(p1.x, p2.x) - 5, Math.min(pdfY1, pdfY2) - 5, 
               Math.max(p1.x, p2.x) + 5, Math.max(pdfY1, pdfY2) + 5],
        L: [p1.x, pdfY1, p2.x, pdfY2],
        C: [r, g, b],
        BS: { W: ann.strokeWidth, S: 'S' },
        LE: ann.tool === 'arrow' ? ['None', 'OpenArrow'] : ['None', 'None'],
        T: PDFString.of('PDF Kit'),
        M: PDFString.of(new Date().toISOString()),
        F: 4,
      });
      addAnnotToPage(pdfDoc, page, annotDict);
    }
  }
}

/**
 * Add a stamp annotation
 */
function addStampAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  ann: StampAnnotation,
  pageHeight: number
) {
  const { r, g, b } = hexToRgb(ann.color);
  const pdfY = pageHeight - ann.y;
  
  // Map our stamp types to PDF stamp names
  const stampNames: Record<string, string> = {
    approved: 'Approved',
    rejected: 'NotApproved',
    draft: 'Draft',
    confidential: 'Confidential',
    reviewed: 'Reviewed',
    custom: 'Draft',
  };
  
  const stampName = stampNames[ann.stampType] || 'Draft';
  const stampWidth = 100;
  const stampHeight = 40;
  
  const annotDict = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Stamp',
    Rect: [ann.x, pdfY - stampHeight, ann.x + stampWidth, pdfY],
    Name: stampName,
    C: [r, g, b],
    T: PDFString.of('PDF Kit'),
    M: PDFString.of(new Date().toISOString()),
    F: 4,
  });

  addAnnotToPage(pdfDoc, page, annotDict);
}

/**
 * Helper to add annotation to page's Annots array
 */
function addAnnotToPage(pdfDoc: PDFDocument, page: PDFPage, annotDict: PDFDict) {
  const annotRef = pdfDoc.context.register(annotDict);
  
  // Get or create the Annots array
  const pageDict = page.node;
  let annots = pageDict.get(PDFName.of('Annots'));
  
  if (!annots) {
    // Create new Annots array
    const annotsArray = pdfDoc.context.obj([annotRef]);
    pageDict.set(PDFName.of('Annots'), annotsArray);
  } else if (annots instanceof PDFArray) {
    // Add to existing array
    annots.push(annotRef);
  } else {
    // It's a reference, need to resolve and add
    const resolvedAnnots = pdfDoc.context.lookup(annots);
    if (resolvedAnnots instanceof PDFArray) {
      resolvedAnnots.push(annotRef);
    }
  }
}

/**
 * Check if a PDF has any embedded annotations
 */
export async function getPdfAnnotationCount(pdfBytes: Uint8Array): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  let count = 0;
  
  for (const page of pages) {
    const annots = page.node.get(PDFName.of('Annots'));
    if (annots instanceof PDFArray) {
      count += annots.size();
    }
  }
  
  return count;
}
