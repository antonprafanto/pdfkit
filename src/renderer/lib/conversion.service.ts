/**
 * Conversion Service
 * Handles PDF to Image and Image to PDF conversions
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type PageSize = 'A4' | 'Letter' | 'Legal' | 'Fit';
export type FitMode = 'fit' | 'fill' | 'stretch';

export interface ExportOptions {
  format: ImageFormat;
  quality?: number; // 0-1 for jpeg/webp
  scale?: number; // 1x, 2x, 3x for DPI
}

export interface ImportOptions {
  pageSize: PageSize;
  fitMode: FitMode;
  margin?: number; // in points
}

export class ConversionService {
  /**
   * Export a PDF page as an image
   */
  async exportPageAsImage(
    page: pdfjsLib.PDFPageProxy,
    options: ExportOptions
  ): Promise<Blob> {
    const { format, quality = 0.92, scale = 2 } = options;

    // Get viewport at desired scale
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType,
        format === 'png' ? undefined : quality
      );
    });

    // For PNG, inject DPI metadata (pHYs chunk)
    if (format === 'png') {
      return await this.injectPNGDPI(blob, scale * 72);
    }

    // For JPEG, inject DPI metadata (JFIF APP0 marker)
    if (format === 'jpeg') {
      return await this.injectJPEGDPI(blob, scale * 72);
    }

    return blob;
  }

  /**
   * Inject DPI metadata into PNG file
   * Adds pHYs chunk to set physical pixel dimensions
   */
  private async injectPNGDPI(blob: Blob, dpi: number): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // PNG signature
    const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // Check if it's a valid PNG
    if (data.length < 8 || !data.slice(0, 8).every((v, i) => v === PNG_SIGNATURE[i])) {
      return blob;
    }

    // Create pHYs chunk
    // pHYs = physical pixel dimensions
    // Format: 4 bytes X pixels per unit, 4 bytes Y pixels per unit, 1 byte unit (1 = meter)
    const pixelsPerMeter = Math.round(dpi * 39.3701); // DPI to pixels per meter
    const pHYsData = new Uint8Array(21); // 4 (length) + 4 (type) + 9 (data) + 4 (crc)
    
    // Chunk length (4 bytes)
    pHYsData[0] = 0; pHYsData[1] = 0; pHYsData[2] = 0; pHYsData[3] = 9; 
    // Chunk type 'pHYs' (4 bytes)
    pHYsData[4] = 112; pHYsData[5] = 72; pHYsData[6] = 89; pHYsData[7] = 115; 
    // X pixels per meter (4 bytes, big endian)
    pHYsData[8] = (pixelsPerMeter >> 24) & 0xFF;
    pHYsData[9] = (pixelsPerMeter >> 16) & 0xFF;
    pHYsData[10] = (pixelsPerMeter >> 8) & 0xFF;
    pHYsData[11] = pixelsPerMeter & 0xFF;
    // Y pixels per meter (same as X)
    pHYsData[12] = (pixelsPerMeter >> 24) & 0xFF;
    pHYsData[13] = (pixelsPerMeter >> 16) & 0xFF;
    pHYsData[14] = (pixelsPerMeter >> 8) & 0xFF;
    pHYsData[15] = pixelsPerMeter & 0xFF;
    pHYsData[16] = 1; // Unit = meter

    // Calculate CRC for pHYs chunk (type + data)
    const crc = this.calculateCRC(pHYsData.slice(4, 17));
    pHYsData[17] = (crc >> 24) & 0xFF;
    pHYsData[18] = (crc >> 16) & 0xFF;
    pHYsData[19] = (crc >> 8) & 0xFF;
    pHYsData[20] = crc & 0xFF;

    // Find IHDR chunk (should be right after signature)
    let pos = 8;
    // Read IHDR chunk length
    const ihdrLength = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
    // IHDR chunk structure: 4 bytes length + 4 bytes type + length bytes data + 4 bytes CRC
    const ihdrEnd = pos + 4 + 4 + ihdrLength + 4; 

    // Insert pHYs chunk after IHDR
    const newData = new Uint8Array(data.length + pHYsData.length);
    newData.set(data.slice(0, ihdrEnd), 0);
    newData.set(pHYsData, ihdrEnd);
    newData.set(data.slice(ihdrEnd), ihdrEnd + pHYsData.length);

    return new Blob([newData], { type: 'image/png' });
  }

  /**
   * Inject DPI metadata into JPEG file
   * Always inserts/replaces JFIF APP0 marker with DPI information
   */
  private async injectJPEGDPI(blob: Blob, dpi: number): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // JPEG should start with FFD8 (SOI marker)
    if (data.length < 2 || data[0] !== 0xFF || data[1] !== 0xD8) {
      console.warn('[ConversionService] Not a valid JPEG file');
      return blob;
    }

    const dpiRounded = Math.round(dpi);
    console.log(`[ConversionService] Injecting JPEG DPI: ${dpiRounded}`);
    
    // Create JFIF APP0 segment with DPI
    // Structure: FFE0 (marker) + length (2 bytes) + "JFIF\0" + version(2) + units(1) + Xdpi(2) + Ydpi(2) + thumb(2)
    const jfifSegment = new Uint8Array([
      0xFF, 0xE0,           // APP0 marker
      0x00, 0x10,           // Length: 16 bytes
      0x4A, 0x46, 0x49, 0x46, 0x00,  // "JFIF\0" (5 bytes)
      0x01, 0x02,           // Version 1.2 (2 bytes)
      0x01,                 // Units: 1 = dots per inch
      (dpiRounded >> 8) & 0xFF, dpiRounded & 0xFF,  // X density (2 bytes)
      (dpiRounded >> 8) & 0xFF, dpiRounded & 0xFF,  // Y density (2 bytes)
      0x00, 0x00            // No thumbnail
    ]);

    // Check if there's already an APP0 marker right after SOI
    let skipBytes = 2; // Start after SOI (FFD8)
    
    if (data.length > 4 && data[2] === 0xFF && data[3] === 0xE0) {
      // APP0 exists, skip it entirely (we'll replace it)
      const existingLength = (data[4] << 8) | data[5];
      skipBytes = 2 + 2 + existingLength; // SOI + marker + length
      console.log(`[ConversionService] Replacing existing APP0 (${existingLength} bytes)`);
    }
    
    // Build new JPEG: SOI + new JFIF + rest of original data
    const newData = new Uint8Array(2 + jfifSegment.length + (data.length - skipBytes));
    newData.set(data.slice(0, 2), 0);           // SOI (FFD8)
    newData.set(jfifSegment, 2);                 // New JFIF APP0
    newData.set(data.slice(skipBytes), 2 + jfifSegment.length);  // Rest of JPEG
    
    console.log(`[ConversionService] JPEG rewritten with ${dpiRounded} DPI. Size: ${data.length} -> ${newData.length}`);
    
    return new Blob([newData], { type: 'image/jpeg' });
  }

  /**
   * Calculate CRC32 for PNG chunk
   */
  private calculateCRC(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const crcTable: number[] = [];

    // Pre-calculate CRC table
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        if (c & 1) {
          c = 0xEDB88320 ^ (c >>> 1);
        } else {
          c = c >>> 1;
        }
      }
      crcTable[i] = c;
    }

    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /**
   * Export multiple PDF pages as images
   * Returns array of Blobs
   */
  async exportPagesAsImages(
    document: pdfjsLib.PDFDocumentProxy,
    pageNumbers: number[],
    options: ExportOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob[]> {
    const results: Blob[] = [];

    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNum = pageNumbers[i];
      const page = await document.getPage(pageNum);
      const blob = await this.exportPageAsImage(page, options);
      results.push(blob);

      if (onProgress) {
        onProgress(i + 1, pageNumbers.length);
      }
    }

    return results;
  }

  /**
   * Convert images to PDF
   */
  async convertImagesToPDF(
    imageFiles: File[],
    options: ImportOptions
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const { pageSize, fitMode, margin = 36 } = options; // 36pt = 0.5 inch

    for (const imageFile of imageFiles) {
      // Load image
      const imageBytes = await imageFile.arrayBuffer();
      let embeddedImage;

      // Embed image based on type
      if (imageFile.type === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        // For other formats, convert to PNG first using canvas
        const img = await this.loadImage(imageFile);
        const pngBytes = await this.convertImageToPNG(img);
        embeddedImage = await pdfDoc.embedPng(pngBytes);
      }

      // Get page dimensions
      const pageDims = this.getPageDimensions(pageSize, embeddedImage);
      const page = pdfDoc.addPage([pageDims.width, pageDims.height]);

      // Calculate image dimensions based on fit mode
      const imageDims = this.calculateImageDimensions(
        embeddedImage.width,
        embeddedImage.height,
        pageDims.width - margin * 2,
        pageDims.height - margin * 2,
        fitMode
      );

      // Center image on page
      const x = (pageDims.width - imageDims.width) / 2;
      const y = (pageDims.height - imageDims.height) / 2;

      // Draw image
      page.drawImage(embeddedImage, {
        x,
        y,
        width: imageDims.width,
        height: imageDims.height,
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Load image from File
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert image to PNG using canvas
   */
  private async convertImageToPNG(img: HTMLImageElement): Promise<ArrayBuffer> {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            resolve(await blob.arrayBuffer());
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        },
        'image/png'
      );
    });
  }

  /**
   * Get page dimensions based on page size
   */
  private getPageDimensions(
    pageSize: PageSize,
    image?: { width: number; height: number }
  ): { width: number; height: number } {
    // Standard page sizes in points (1 inch = 72 points)
    const sizes = {
      A4: { width: 595, height: 842 }, // 210mm x 297mm
      Letter: { width: 612, height: 792 }, // 8.5" x 11"
      Legal: { width: 612, height: 1008 }, // 8.5" x 14"
    };

    if (pageSize === 'Fit' && image) {
      // Use image dimensions (at 72 DPI)
      return { width: image.width, height: image.height };
    }

    return sizes[pageSize as keyof typeof sizes] || sizes.A4;
  }

  /**
   * Calculate image dimensions based on fit mode
   */
  private calculateImageDimensions(
    imageWidth: number,
    imageHeight: number,
    maxWidth: number,
    maxHeight: number,
    fitMode: FitMode
  ): { width: number; height: number } {
    const imageRatio = imageWidth / imageHeight;
    const containerRatio = maxWidth / maxHeight;

    if (fitMode === 'stretch') {
      return { width: maxWidth, height: maxHeight };
    }

    if (fitMode === 'fit') {
      // Scale to fit inside container
      if (imageRatio > containerRatio) {
        // Width is limiting factor
        return { width: maxWidth, height: maxWidth / imageRatio };
      } else {
        // Height is limiting factor
        return { width: maxHeight * imageRatio, height: maxHeight };
      }
    }

    if (fitMode === 'fill') {
      // Scale to fill container (may crop)
      if (imageRatio > containerRatio) {
        return { width: maxHeight * imageRatio, height: maxHeight };
      } else {
        return { width: maxWidth, height: maxWidth / imageRatio };
      }
    }

    return { width: imageWidth, height: imageHeight };
  }
}

// Export singleton instance
export const conversionService = new ConversionService();
