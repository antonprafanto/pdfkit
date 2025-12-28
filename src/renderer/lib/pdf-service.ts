/**
 * PDF Service
 * Handles PDF document loading and management
 */

import { pdfjsLib, PDFDocumentProxy, PDF_CONFIG } from './pdf-config';

export class PDFService {
  private currentDocument: PDFDocumentProxy | null = null;

  /**
   * Load PDF from file path
   */
  async loadFromFile(file: File): Promise<PDFDocumentProxy> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const document = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: PDF_CONFIG.cMapUrl,
        cMapPacked: PDF_CONFIG.cMapPacked,
        standardFontDataUrl: PDF_CONFIG.standardFontDataUrl,
      }).promise;
      this.currentDocument = document;
      return document;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw new Error('Failed to load PDF file');
    }
  }

  /**
   * Load PDF from URL
   */
  async loadFromUrl(url: string): Promise<PDFDocumentProxy> {
    try {
      const document = await pdfjsLib.getDocument({
        url,
        cMapUrl: PDF_CONFIG.cMapUrl,
        cMapPacked: PDF_CONFIG.cMapPacked,
        standardFontDataUrl: PDF_CONFIG.standardFontDataUrl,
      }).promise;
      this.currentDocument = document;
      return document;
    } catch (error) {
      console.error('Error loading PDF from URL:', error);
      throw new Error('Failed to load PDF from URL');
    }
  }

  /**
   * Load PDF from ArrayBuffer
   */
  async loadFromBuffer(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
    try {
      const document = await pdfjsLib.getDocument({
        data: buffer,
        cMapUrl: PDF_CONFIG.cMapUrl,
        cMapPacked: PDF_CONFIG.cMapPacked,
        standardFontDataUrl: PDF_CONFIG.standardFontDataUrl,
      }).promise;
      this.currentDocument = document;
      return document;
    } catch (error) {
      console.error('Error loading PDF from buffer:', error);
      throw new Error('Failed to load PDF from buffer');
    }
  }

  /**
   * Get current loaded document
   */
  getCurrentDocument(): PDFDocumentProxy | null {
    return this.currentDocument;
  }

  /**
   * Get document metadata
   */
  async getMetadata(document: PDFDocumentProxy) {
    try {
      const metadata = await document.getMetadata();
      return {
        title: metadata.info?.Title || 'Untitled',
        author: metadata.info?.Author || 'Unknown',
        subject: metadata.info?.Subject || '',
        keywords: metadata.info?.Keywords || '',
        creator: metadata.info?.Creator || '',
        producer: metadata.info?.Producer || '',
        creationDate: metadata.info?.CreationDate || '',
        modificationDate: metadata.info?.ModDate || '',
      };
    } catch (error) {
      console.error('Error getting metadata:', error);
      return null;
    }
  }

  /**
   * Get page count
   */
  getPageCount(document: PDFDocumentProxy): number {
    return document.numPages;
  }

  /**
   * Get specific page
   */
  async getPage(document: PDFDocumentProxy, pageNumber: number) {
    try {
      if (pageNumber < 1 || pageNumber > document.numPages) {
        throw new Error('Page number out of range');
      }
      return await document.getPage(pageNumber);
    } catch (error) {
      console.error(`Error getting page ${pageNumber}:`, error);
      throw error;
    }
  }

  /**
   * Close current document
   */
  async closeDocument(): Promise<void> {
    if (this.currentDocument) {
      await this.currentDocument.destroy();
      this.currentDocument = null;
    }
  }

  /**
   * Extract text from page
   */
  async extractTextFromPage(document: PDFDocumentProxy, pageNumber: number): Promise<string> {
    try {
      const page = await this.getPage(document, pageNumber);
      const textContent = await page.getTextContent();
      return textContent.items.map((item: any) => item.str).join(' ');
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      return '';
    }
  }

  /**
   * Extract text from all pages
   */
  async extractAllText(document: PDFDocumentProxy): Promise<string[]> {
    const texts: string[] = [];
    for (let i = 1; i <= document.numPages; i++) {
      const text = await this.extractTextFromPage(document, i);
      texts.push(text);
    }
    return texts;
  }

  /**
   * Search text with coordinates for highlighting
   */
  async searchTextWithCoordinates(
    document: PDFDocumentProxy,
    pageNumber: number,
    searchQuery: string,
    scale: number = 1,
    rotation: number = 0
  ): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
    try {
      const page = await this.getPage(document, pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale, rotation });

      const highlights: Array<{ x: number; y: number; width: number; height: number }> = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Build full text for searching
      let fullText = '';
      const itemPositions: Array<{ start: number; end: number; item: any }> = [];

      textContent.items.forEach((item: any) => {
        const start = fullText.length;
        fullText += item.str;
        const end = fullText.length;
        itemPositions.push({ start, end, item });
        fullText += ' '; // Add space between items
      });

      // Find all matches
      const lowerText = fullText.toLowerCase();
      let index = lowerText.indexOf(lowerQuery);

      while (index !== -1) {
        const matchEnd = index + searchQuery.length;

        // Find which text items contain this match
        for (const { start, end, item } of itemPositions) {
          // Check if this item overlaps with the match
          if (start <= matchEnd && end >= index) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5]; // Flip Y coordinate
            const width = item.width;
            const height = item.height;

            highlights.push({
              x: x * scale,
              y: (y - height) * scale,
              width: width * scale,
              height: height * scale,
            });
          }
        }

        index = lowerText.indexOf(lowerQuery, index + 1);
      }

      return highlights;
    } catch (error) {
      console.error(`Error searching text on page ${pageNumber}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
