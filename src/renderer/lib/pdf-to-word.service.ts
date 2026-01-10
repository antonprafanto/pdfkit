/**
 * PDF to Word Conversion Service
 * Converts PDF documents to Word (.docx) format
 */

import { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel, AlignmentType } from 'docx';
import { pdfjsLib, PDF_CONFIG } from './pdf-config';

export interface ConversionProgress {
  percent: number;
  currentPage: number;
  totalPages: number;
  status: string;
}

export interface ConversionResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  pageCount?: number;
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

/**
 * Convert PDF bytes to Word document
 */
export async function convertPdfToWord(
  pdfBytes: Uint8Array,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      ...PDF_CONFIG,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    if (totalPages === 0) {
      return {
        success: false,
        error: 'PDF kosong atau tidak memiliki halaman',
      };
    }

    onProgress?.({
      percent: 0,
      currentPage: 0,
      totalPages,
      status: 'Memulai konversi...',
    });

    // Extract text from all pages
    const sections: Paragraph[][] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.({
        percent: Math.round((pageNum / totalPages) * 80),
        currentPage: pageNum,
        totalPages,
        status: `Mengekstrak halaman ${pageNum} dari ${totalPages}...`,
      });

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Process text items into paragraphs
      const paragraphs = processTextItems(textContent.items as TextItem[], pageNum, totalPages);
      sections.push(paragraphs);
    }

    onProgress?.({
      percent: 85,
      currentPage: totalPages,
      totalPages,
      status: 'Membuat dokumen Word...',
    });

    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections.flat(),
        },
      ],
    });

    onProgress?.({
      percent: 95,
      currentPage: totalPages,
      totalPages,
      status: 'Memfinalisasi dokumen...',
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);

    onProgress?.({
      percent: 100,
      currentPage: totalPages,
      totalPages,
      status: 'Selesai!',
    });

    return {
      success: true,
      blob,
      pageCount: totalPages,
    };
  } catch (error: any) {
    console.error('[PDF to Word] Conversion error:', error);
    
    // Handle specific errors
    if (error.name === 'PasswordException') {
      return {
        success: false,
        error: 'PDF terenkripsi. Silakan unlock PDF terlebih dahulu.',
      };
    }

    return {
      success: false,
      error: error.message || 'Gagal mengkonversi PDF ke Word',
    };
  }
}

/**
 * Process text items from PDF into paragraphs
 */
function processTextItems(
  items: TextItem[],
  pageNum: number,
  totalPages: number
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (items.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[Halaman ${pageNum} tidak memiliki teks]`,
            italics: true,
            color: '888888',
          }),
        ],
      })
    );
    return paragraphs;
  }

  // Group text items by line (similar Y position)
  const lines: { y: number; items: TextItem[] }[] = [];
  const Y_THRESHOLD = 5; // pixels

  for (const item of items) {
    if (!item.str.trim()) continue;

    const y = item.transform[5]; // Y position
    
    // Find existing line with similar Y
    let existingLine = lines.find(line => Math.abs(line.y - y) < Y_THRESHOLD);
    
    if (existingLine) {
      existingLine.items.push(item);
    } else {
      lines.push({ y, items: [item] });
    }
  }

  // Sort lines by Y position (descending - PDF coords are bottom-up)
  lines.sort((a, b) => b.y - a.y);

  // Convert lines to paragraphs
  let lastY = lines[0]?.y || 0;
  
  for (const line of lines) {
    // Sort items in line by X position
    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
    
    // Combine text with spaces
    const lineText = line.items.map(item => item.str).join(' ').trim();
    
    if (!lineText) continue;

    // Detect if this is a heading (larger font or significant gap)
    const avgHeight = line.items.reduce((sum, item) => sum + item.height, 0) / line.items.length;
    const isHeading = avgHeight > 14; // Rough heuristic
    const gapFromPrevious = lastY - line.y;
    const isNewParagraph = gapFromPrevious > 20;

    if (isHeading) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: lineText,
              bold: true,
            }),
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: isNewParagraph ? { before: 200 } : undefined,
          children: [
            new TextRun({
              text: lineText,
            }),
          ],
        })
      );
    }

    lastY = line.y;
  }

  // Add page break if not the last page
  if (pageNum < totalPages) {
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  return paragraphs;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
