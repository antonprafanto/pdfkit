/**
 * PDF Compression Service
 * Handles PDF compression by rendering pages and recompressing as JPEG
 */

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export interface CompressionOptions {
  quality: 'high' | 'medium' | 'low' | 'custom';
  customQuality?: number; // 0-100
  removeMetadata?: boolean;
  optimizeImages?: boolean;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  savings: number;
  savingsPercent: number;
}

// Quality presets - JPEG quality values
const QUALITY_PRESETS = {
  high: 0.85,    // Good quality, some compression
  medium: 0.65,  // Balanced
  low: 0.45,     // Maximum compression, lower quality
};

/**
 * PDF Compression Service Class
 */
export class CompressionService {
  /**
   * Compress a PDF by rendering pages as JPEG images and rebuilding
   * This is a "flatten" approach that converts pages to images
   */
  async compressPDF(
    pdfBytes: Uint8Array,
    options: CompressionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    console.log('[Compression] Starting PDF compression with image optimization...');
    
    const originalSize = pdfBytes.length;
    onProgress?.(0.05);

    // Get JPEG quality from options
    const jpegQuality = options.quality === 'custom' 
      ? (options.customQuality || 65) / 100 
      : QUALITY_PRESETS[options.quality];

    console.log(`[Compression] Using JPEG quality: ${(jpegQuality * 100).toFixed(0)}%`);

    // Load PDF with PDF.js for rendering
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const numPages = pdfDoc.numPages;
    
    console.log(`[Compression] Processing ${numPages} pages...`);
    onProgress?.(0.1);

    // Create new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Remove metadata if requested
    if (options.removeMetadata) {
      newPdfDoc.setTitle('');
      newPdfDoc.setAuthor('');
      newPdfDoc.setSubject('');
      newPdfDoc.setKeywords([]);
      newPdfDoc.setProducer('');
      newPdfDoc.setCreator('');
    }

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      
      // Get page dimensions at 1.5x scale (good balance of quality vs size)
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Render PDF page to canvas
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      // Convert canvas to JPEG blob with specified quality
      const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      
      // Convert data URL to Uint8Array
      const base64 = jpegDataUrl.split(',')[1];
      const binaryString = atob(base64);
      const jpegBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        jpegBytes[i] = binaryString.charCodeAt(i);
      }

      // Embed JPEG into new PDF
      const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
      
      // Calculate page size in points (72 DPI)
      // Original viewport was at scale, so divide by scale to get original size
      const pageWidth = viewport.width / scale * 72 / 96; // Convert from CSS pixels to points
      const pageHeight = viewport.height / scale * 72 / 96;
      
      // Add page and draw image to fill it
      const newPage = newPdfDoc.addPage([pageWidth * scale, pageHeight * scale]);
      newPage.drawImage(jpegImage, {
        x: 0,
        y: 0,
        width: pageWidth * scale,
        height: pageHeight * scale,
      });

      // Update progress
      const progress = 0.1 + (pageNum / numPages) * 0.8;
      onProgress?.(progress);
      
      console.log(`[Compression] Processed page ${pageNum}/${numPages}`);
    }

    onProgress?.(0.95);

    // Save the new compressed PDF
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
    });

    onProgress?.(1);

    const compressedSize = compressedBytes.length;
    const savings = originalSize - compressedSize;
    const savingsPercent = (savings / originalSize) * 100;
    
    console.log(`[Compression] Original: ${this.formatBytes(originalSize)}`);
    console.log(`[Compression] Compressed: ${this.formatBytes(compressedSize)}`);
    console.log(`[Compression] Saved: ${this.formatBytes(savings)} (${savingsPercent.toFixed(1)}%)`);

    // If compressed is larger, return original
    if (compressedSize >= originalSize) {
      console.log('[Compression] Compressed file is larger than original, returning original');
      return pdfBytes;
    }

    return compressedBytes;
  }

  /**
   * Quick compression - just re-save with object streams (for already-optimized PDFs)
   */
  async quickCompress(
    pdfBytes: Uint8Array,
    removeMetadata: boolean = true
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    if (removeMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }
    
    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(originalSize: number, compressedSize: number): CompressionResult {
    const savings = originalSize - compressedSize;
    const savingsPercent = (savings / originalSize) * 100;
    
    return {
      originalSize,
      compressedSize,
      savings,
      savingsPercent,
    };
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Estimate compression (for preview before actual compression)
   */
  estimateCompression(originalSize: number, quality: CompressionOptions['quality']): CompressionResult {
    // More realistic estimation based on JPEG recompression
    const reductionRates = {
      high: 0.25,   // ~25% reduction with high quality JPEG
      medium: 0.45, // ~45% reduction
      low: 0.60,    // ~60% reduction with low quality JPEG
      custom: 0.35,
    };
    
    const estimatedReduction = reductionRates[quality];
    const estimatedCompressedSize = Math.round(originalSize * (1 - estimatedReduction));
    
    return this.getCompressionStats(originalSize, estimatedCompressedSize);
  }
}

// Export singleton instance
export const compressionService = new CompressionService();
