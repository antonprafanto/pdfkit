/**
 * OCR Service
 * Handles Optical Character Recognition using Tesseract.js
 */

import { createWorker, Worker, PSM, OEM } from 'tesseract.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface OCRLanguage {
  code: string;
  name: string;
}

export interface OCRProgress {
  status: string;
  progress: number;
  page?: number;
  totalPages?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  page: number;
  words?: Array<{
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
    confidence: number;
  }>;
}

export interface OCROptions {
  language: string;
  pageSegMode?: PSM;
  oem?: OEM;
}

/**
 * Supported OCR languages
 */
export const OCR_LANGUAGES: OCRLanguage[] = [
  { code: 'eng', name: 'English' },
  { code: 'ind', name: 'Indonesian' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'chi_tra', name: 'Chinese (Traditional)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
  { code: 'tha', name: 'Thai' },
  { code: 'vie', name: 'Vietnamese' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'spa', name: 'Spanish' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'rus', name: 'Russian' },
];

/**
 * OCR Service Class
 */
export class OCRService {
  private worker: Worker | null = null;
  private currentLanguage: string = 'eng';

  /**
   * Initialize Tesseract worker
   */
  async initialize(language: string = 'eng', onProgress?: (progress: OCRProgress) => void): Promise<void> {
    // Terminate existing worker if language changed
    if (this.worker && this.currentLanguage !== language) {
      await this.terminate();
    }

    if (!this.worker) {
      console.log(`[OCR] Initializing Tesseract worker with language: ${language}`);
      
      this.worker = await createWorker(language, OEM.LSTM_ONLY, {
        logger: (m) => {
          if (onProgress && m.progress !== undefined) {
            onProgress({
              status: m.status || 'Processing',
              progress: m.progress,
            });
          }
        },
      });

      this.currentLanguage = language;
      console.log('[OCR] Worker initialized');
    }
  }

  /**
   * Terminate Tesseract worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('[OCR] Worker terminated');
    }
  }

  /**
   * Perform OCR on a single image
   */
  async recognizeImage(
    imageData: ImageData | HTMLCanvasElement | string,
    options: OCROptions = { language: 'eng' }
  ): Promise<OCRResult> {
    await this.initialize(options.language);

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    const result = await this.worker.recognize(imageData);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      page: 1,
      words: result.data.words?.map((word) => ({
        text: word.text,
        bbox: word.bbox,
        confidence: word.confidence,
      })),
    };
  }

  /**
   * Perform OCR on PDF pages (rendered as images)
   */
  async recognizePDFPages(
    pageImages: HTMLCanvasElement[],
    options: OCROptions = { language: 'eng' },
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    const totalPages = pageImages.length;

    await this.initialize(options.language, onProgress);

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    for (let i = 0; i < pageImages.length; i++) {
      const pageNum = i + 1;
      
      if (onProgress) {
        onProgress({
          status: `Processing page ${pageNum} of ${totalPages}`,
          progress: i / totalPages,
          page: pageNum,
          totalPages,
        });
      }

      const result = await this.worker.recognize(pageImages[i]);

      results.push({
        text: result.data.text,
        confidence: result.data.confidence,
        page: pageNum,
        words: result.data.words?.map((word) => ({
          text: word.text,
          bbox: word.bbox,
          confidence: word.confidence,
        })),
      });
    }

    if (onProgress) {
      onProgress({
        status: 'Complete',
        progress: 1,
        page: totalPages,
        totalPages,
      });
    }

    return results;
  }

  /**
   * Create a searchable PDF by adding text layer
   * This overlays invisible text on top of the original PDF
   */
  async createSearchablePDF(
    originalPdfBytes: Uint8Array,
    ocrResults: OCRResult[],
    pageImages: HTMLCanvasElement[]
  ): Promise<Uint8Array> {
    console.log('[OCR] Creating searchable PDF...');

    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < Math.min(ocrResults.length, pages.length); i++) {
      const page = pages[i];
      const result = ocrResults[i];
      const canvas = pageImages[i];
      
      if (!result.words || result.words.length === 0) continue;

      const { width: pageWidth, height: pageHeight } = page.getSize();
      const scaleX = pageWidth / canvas.width;
      const scaleY = pageHeight / canvas.height;

      // Add invisible text layer
      for (const word of result.words) {
        const x = word.bbox.x0 * scaleX;
        const y = pageHeight - (word.bbox.y1 * scaleY); // PDF coordinates are bottom-up
        const wordWidth = (word.bbox.x1 - word.bbox.x0) * scaleX;
        const wordHeight = (word.bbox.y1 - word.bbox.y0) * scaleY;

        // Calculate font size to fit the word
        const fontSize = Math.min(wordHeight * 0.8, 12);

        try {
          page.drawText(word.text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0, // Invisible text for searchability
          });
        } catch (e) {
          // Skip words with unsupported characters
          console.warn(`[OCR] Skipping word with unsupported characters: ${word.text}`);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    console.log('[OCR] Searchable PDF created');
    return pdfBytes;
  }

  /**
   * Extract text only (without creating searchable PDF)
   */
  async extractText(
    pageImages: HTMLCanvasElement[],
    options: OCROptions = { language: 'eng' },
    onProgress?: (progress: OCRProgress) => void
  ): Promise<string> {
    const results = await this.recognizePDFPages(pageImages, options, onProgress);
    return results.map((r) => r.text).join('\n\n--- Page Break ---\n\n');
  }

  /**
   * Get average confidence across all results
   */
  getAverageConfidence(results: OCRResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.confidence, 0);
    return sum / results.length;
  }
}

// Export singleton instance
export const ocrService = new OCRService();
