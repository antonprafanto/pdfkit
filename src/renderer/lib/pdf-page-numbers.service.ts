import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface AddPageNumbersOptions {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: 'numbers' | 'page-of-total' | 'roman' | 'letters';
  startNumber: number;
  fontSize: number;
  margin: number;
  pageRange: string; // 'all' or '1-5, 8, 10-12'
}

/**
 * Converts a number to Roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

/**
 * Converts a number to letters (A, B, C, ... Z, AA, AB, ...)
 */
function toLetters(num: number): string {
  let result = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

/**
 * Parses page range string into array of page indices
 * Example: '1-5, 8, 10-12' -> [0, 1, 2, 3, 4, 7, 9, 10, 11]
 */
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (rangeStr === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',').map(s => s.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      if (isNaN(start) || isNaN(end)) continue;
      
      const from = Math.max(1, Math.min(start, totalPages));
      const to = Math.max(1, Math.min(end, totalPages));
      
      for (let i = from; i <= to; i++) {
        pages.add(i - 1); // Convert to 0-indexed
      }
    } else {
      const pageNum = parseInt(part);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1); // Convert to 0-indexed
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Formats the page number according to the specified format
 */
function formatPageNumber(
  pageIndex: number,
  totalPages: number,
  format: AddPageNumbersOptions['format'],
  startNumber: number
): string {
  const actualNumber = pageIndex + startNumber;

  switch (format) {
    case 'numbers':
      return actualNumber.toString();
    case 'page-of-total':
      return `Page ${actualNumber} of ${totalPages + startNumber - 1}`;
    case 'roman':
      return toRoman(actualNumber);
    case 'letters':
      return toLetters(actualNumber);
    default:
      return actualNumber.toString();
  }
}

/**
 * Gets the position coordinates for the page number
 */
function getPosition(
  position: AddPageNumbersOptions['position'],
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  fontSize: number,
  margin: number
): { x: number; y: number } {
  const positions: Record<AddPageNumbersOptions['position'], { x: number; y: number }> = {
    'top-left': { x: margin, y: pageHeight - margin - fontSize },
    'top-center': { x: (pageWidth - textWidth) / 2, y: pageHeight - margin - fontSize },
    'top-right': { x: pageWidth - margin - textWidth, y: pageHeight - margin - fontSize },
    'bottom-left': { x: margin, y: margin },
    'bottom-center': { x: (pageWidth - textWidth) / 2, y: margin },
    'bottom-right': { x: pageWidth - margin - textWidth, y: margin },
  };

  return positions[position];
}

/**
 * Adds page numbers to a PDF
 */
export async function addPageNumbers(
  pdfBytes: Uint8Array,
  options: AddPageNumbersOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  
  // Load font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Parse page range
  const pageIndices = parsePageRange(options.pageRange, totalPages);

  // Add page numbers to specified pages
  for (const pageIndex of pageIndices) {
    if (pageIndex >= totalPages) continue;
    
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    
    // Format the page number
    const text = formatPageNumber(
      pageIndex,
      totalPages,
      options.format,
      options.startNumber
    );
    
    // Calculate text width
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    
    // Get position
    const { x, y } = getPosition(
      options.position,
      width,
      height,
      textWidth,
      options.fontSize,
      options.margin
    );
    
    // Draw text
    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // Save the modified PDF
  return await pdfDoc.save();
}

/**
 * Validates page range string
 */
export function validatePageRange(rangeStr: string, totalPages: number): boolean {
  if (rangeStr === 'all') return true;
  
  try {
    const pages = parsePageRange(rangeStr, totalPages);
    return pages.length > 0;
  } catch {
    return false;
  }
}
