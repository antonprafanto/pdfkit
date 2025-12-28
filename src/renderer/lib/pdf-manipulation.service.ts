/**
 * PDF Manipulation Service
 * Handles PDF editing operations using pdf-lib
 */

import { PDFDocument, degrees } from 'pdf-lib';

export interface PageRange {
  start: number;
  end: number;
}

export class PDFManipulationService {
  /**
   * Convert File to ArrayBuffer
   */
  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Merge multiple PDF files into one
   * @param pageRanges - Optional array of page ranges per file (e.g., ["all", "1-5,10-15", "all"])
   */
  async mergePDFs(files: File[], pageRanges?: string[]): Promise<Uint8Array> {
    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const range = pageRanges?.[i] || 'all';
        
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        
        // Parse page range
        const pages = this.parsePageRange(range, pdf.getPageCount());
        
        // Copy specified pages
        const copiedPages = await mergedPdf.copyPages(pdf, pages);
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      return await mergedPdf.save();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error('Failed to merge PDF files');
    }
  }

  /**
   * Parse page range string to array of page indices
   * @param range - e.g., "all", "1-5", "1,3,5-10"
   * @param totalPages - total pages in PDF
   */
  private parsePageRange(range: string, totalPages: number): number[] {
    if (!range || range.trim().toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages: number[] = [];
    const parts = range.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Range notation: 5-10
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr?.trim() || '');
        const end = parseInt(endStr?.trim() || '');
        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i - 1); // Convert to 0-indexed
          }
        }
      } else {
        // Single page
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          pages.push(page - 1); // Convert to 0-indexed
        }
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  }

  /**
   * Split PDF by page ranges
   */
  async splitPDF(file: File, ranges: PageRange[]): Promise<Uint8Array[]> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const results: Uint8Array[] = [];

      for (const range of ranges) {
        const newPdf = await PDFDocument.create();
        const pageIndices: number[] = [];

        // Build page indices for this range (1-based to 0-based)
        for (let i = range.start - 1; i < range.end; i++) {
          if (i >= 0 && i < sourcePdf.getPageCount()) {
            pageIndices.push(i);
          }
        }

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        results.push(await newPdf.save());
      }

      return results;
    } catch (error) {
      console.error('Error splitting PDF:', error);
      throw new Error('Failed to split PDF');
    }
  }

  /**
   * Split PDF every N pages
   */
  async splitEveryNPages(file: File, pagesPerFile: number): Promise<Uint8Array[]> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      const results: Uint8Array[] = [];

      for (let i = 0; i < totalPages; i += pagesPerFile) {
        const newPdf = await PDFDocument.create();
        const pageIndices: number[] = [];

        const endPage = Math.min(i + pagesPerFile, totalPages);
        for (let j = i; j < endPage; j++) {
          pageIndices.push(j);
        }

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        results.push(await newPdf.save());
      }

      return results;
    } catch (error) {
      console.error('Error splitting PDF every N pages:', error);
      throw new Error('Failed to split PDF');
    }
  }

  /**
   * Split PDF into individual pages
   */
  async splitIntoIndividualPages(file: File): Promise<Uint8Array[]> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      const results: Uint8Array[] = [];

      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);
        results.push(await newPdf.save());
      }

      return results;
    } catch (error) {
      console.error('Error splitting PDF into individual pages:', error);
      throw new Error('Failed to split PDF');
    }
  }

  /**
   * Split PDF into fixed intervals
   */
  async splitIntoFixedIntervals(file: File, numberOfFiles: number): Promise<Uint8Array[]> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      const pagesPerFile = Math.ceil(totalPages / numberOfFiles);
      const results: Uint8Array[] = [];

      for (let i = 0; i < numberOfFiles; i++) {
        const startPage = i * pagesPerFile;
        if (startPage >= totalPages) break;

        const newPdf = await PDFDocument.create();
        const pageIndices: number[] = [];

        const endPage = Math.min(startPage + pagesPerFile, totalPages);
        for (let j = startPage; j < endPage; j++) {
          pageIndices.push(j);
        }

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        results.push(await newPdf.save());
      }

      return results;
    } catch (error) {
      console.error('Error splitting PDF into fixed intervals:', error);
      throw new Error('Failed to split PDF');
    }
  }

  /**
   * Delete specific pages from PDF
   */
  async deletePages(file: File, pageNumbers: number[]): Promise<Uint8Array> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer);

      // Sort in descending order to avoid index shifting issues
      const sortedPages = [...pageNumbers].sort((a, b) => b - a);

      for (const pageNum of sortedPages) {
        const index = pageNum - 1; // Convert to 0-based
        if (index >= 0 && index < pdf.getPageCount()) {
          pdf.removePage(index);
        }
      }

      return await pdf.save();
    } catch (error) {
      console.error('Error deleting pages:', error);
      throw new Error('Failed to delete pages');
    }
  }

  /**
   * Rotate specific pages
   */
  async rotatePages(
    file: File,
    pageNumbers: number[],
    rotationDegrees: number
  ): Promise<Uint8Array> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer);

      for (const pageNum of pageNumbers) {
        const index = pageNum - 1; // Convert to 0-based
        if (index >= 0 && index < pdf.getPageCount()) {
          const page = pdf.getPage(index);
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationDegrees));
        }
      }

      return await pdf.save();
    } catch (error) {
      console.error('Error rotating pages:', error);
      throw new Error('Failed to rotate pages');
    }
  }

  /**
   * Reorder pages based on new order array
   */
  async reorderPages(file: File, newOrder: number[]): Promise<Uint8Array> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Convert 1-based page numbers to 0-based indices
      const indices = newOrder.map((pageNum) => pageNum - 1);

      const copiedPages = await newPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      return await newPdf.save();
    } catch (error) {
      console.error('Error reordering pages:', error);
      throw new Error('Failed to reorder pages');
    }
  }

  /**
   * Extract specific pages to new PDF
   */
  async extractPages(file: File, pageNumbers: number[]): Promise<Uint8Array> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Convert 1-based to 0-based and sort
      const indices = pageNumbers.map((pageNum) => pageNum - 1).sort((a, b) => a - b);

      const copiedPages = await newPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      return await newPdf.save();
    } catch (error) {
      console.error('Error extracting pages:', error);
      throw new Error('Failed to extract pages');
    }
  }

  /**
   * Duplicate a specific page
   */
  async duplicatePage(file: File, pageNumber: number, insertAfter: boolean = true): Promise<Uint8Array> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer);

      const index = pageNumber - 1; // Convert to 0-based
      if (index < 0 || index >= pdf.getPageCount()) {
        throw new Error('Invalid page number');
      }

      const [copiedPage] = await pdf.copyPages(pdf, [index]);

      if (insertAfter) {
        pdf.insertPage(index + 1, copiedPage);
      } else {
        pdf.insertPage(index, copiedPage);
      }

      return await pdf.save();
    } catch (error) {
      console.error('Error duplicating page:', error);
      throw new Error('Failed to duplicate page');
    }
  }

  /**
   * Get page count from PDF file
   */
  async getPageCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer);
      return pdf.getPageCount();
    } catch (error) {
      console.error('Error getting page count:', error);
      throw new Error('Failed to get page count');
    }
  }

  /**
   * Validate PDF file
   */
  async validatePDF(file: File): Promise<boolean> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      await PDFDocument.load(arrayBuffer);
      return true;
    } catch (error) {
      console.error('Invalid PDF file:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pdfManipulationService = new PDFManipulationService();
