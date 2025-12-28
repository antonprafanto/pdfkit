/**
 * Watermark Service
 * Handles adding text and image watermarks to PDFs
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 
  | 'center' 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right'
  | 'diagonal'
  | 'repeat';

export interface TextWatermarkOptions {
  text: string;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  opacity?: number; // 0-1
  rotation?: number; // degrees
  position?: WatermarkPosition;
}

export interface ImageWatermarkOptions {
  imageFile: File;
  scale?: number; // 0-1
  opacity?: number; // 0-1
  rotation?: number; // degrees
  position?: WatermarkPosition;
}

export interface WatermarkTemplate {
  name: string;
  description: string;
  options: TextWatermarkOptions;
}

export class WatermarkService {
  /**
   * Predefined watermark templates
   */
  readonly templates: WatermarkTemplate[] = [
    {
      name: 'Confidential',
      description: 'Red diagonal "CONFIDENTIAL" watermark',
      options: {
        text: 'CONFIDENTIAL',
        fontSize: 72,
        color: { r: 0.8, g: 0, b: 0 },
        opacity: 0.3,
        rotation: 45,
        position: 'center',
      },
    },
    {
      name: 'Draft',
      description: 'Gray "DRAFT" watermark',
      options: {
        text: 'DRAFT',
        fontSize: 96,
        color: { r: 0.5, g: 0.5, b: 0.5 },
        opacity: 0.2,
        rotation: 0,
        position: 'center',
      },
    },
    {
      name: 'Copy',
      description: 'Diagonal repeat "COPY" pattern',
      options: {
        text: 'COPY',
        fontSize: 48,
        color: { r: 0.7, g: 0.7, b: 0.7 },
        opacity: 0.15,
        rotation: 45,
        position: 'repeat',
      },
    },
    {
      name: 'For Review Only',
      description: 'Blue "FOR REVIEW ONLY" watermark',
      options: {
        text: 'FOR REVIEW ONLY',
        fontSize: 48,
        color: { r: 0, g: 0.4, b: 0.8 },
        opacity: 0.25,
        rotation: 0,
        position: 'center',
      },
    },
    {
      name: 'Sample',
      description: 'Orange diagonal "SAMPLE" watermark',
      options: {
        text: 'SAMPLE',
        fontSize: 64,
        color: { r: 1, g: 0.5, b: 0 },
        opacity: 0.3,
        rotation: -45,
        position: 'center',
      },
    },
  ];

  /**
   * Add text watermark to PDF
   */
  async addTextWatermark(file: File, options: TextWatermarkOptions): Promise<Uint8Array> {
    const {
      text,
      fontSize = 48,
      color = { r: 0.5, g: 0.5, b: 0.5 },
      opacity = 0.3,
      rotation = 0,
      position = 'center',
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      if (position === 'repeat') {
        // Diagonal repeat pattern
        this.addRepeatWatermark(page, text, font, fontSize, color, opacity, rotation, width, height);
      } else {
        const { x, y } = this.calculatePosition(position, width, height, textWidth, textHeight);
        
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotation),
        });
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Add image watermark to PDF
   */
  async addImageWatermark(file: File, options: ImageWatermarkOptions): Promise<Uint8Array> {
    const {
      imageFile,
      scale = 0.3,
      opacity = 0.5,
      rotation = 0,
      position = 'center',
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Embed image
    const imageBytes = await imageFile.arrayBuffer();
    let image;

    if (imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error('Unsupported image format. Use PNG or JPEG.');
    }

    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;

      if (position === 'repeat') {
        // Repeat pattern
        this.addRepeatImageWatermark(page, image, scale, opacity, rotation, width, height);
      } else {
        const { x, y } = this.calculatePosition(position, width, height, imageWidth, imageHeight);

        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
          opacity,
          rotate: degrees(rotation),
        });
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Calculate watermark position
   */
  private calculatePosition(
    position: WatermarkPosition,
    pageWidth: number,
    pageHeight: number,
    elementWidth: number,
    elementHeight: number
  ): { x: number; y: number } {
    const margin = 50;

    switch (position) {
      case 'center':
        return {
          x: (pageWidth - elementWidth) / 2,
          y: (pageHeight - elementHeight) / 2,
        };
      case 'top-left':
        return { x: margin, y: pageHeight - elementHeight - margin };
      case 'top-right':
        return { x: pageWidth - elementWidth - margin, y: pageHeight - elementHeight - margin };
      case 'bottom-left':
        return { x: margin, y: margin };
      case 'bottom-right':
        return { x: pageWidth - elementWidth - margin, y: margin };
      case 'diagonal':
        return {
          x: (pageWidth - elementWidth) / 2,
          y: (pageHeight - elementHeight) / 2,
        };
      default:
        return {
          x: (pageWidth - elementWidth) / 2,
          y: (pageHeight - elementHeight) / 2,
        };
    }
  }

  /**
   * Add repeat watermark pattern
   */
  private addRepeatWatermark(
    page: any,
    text: string,
    font: any,
    fontSize: number,
    color: { r: number; g: number; b: number },
    opacity: number,
    rotation: number,
    width: number,
    height: number
  ) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const spacing = 200;

    for (let x = -width; x < width * 2; x += spacing) {
      for (let y = -height; y < height * 2; y += spacing) {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotation),
        });
      }
    }
  }

  /**
   * Add repeat image watermark pattern
   */
  private addRepeatImageWatermark(
    page: any,
    image: any,
    scale: number,
    opacity: number,
    rotation: number,
    width: number,
    height: number
  ) {
    const imageWidth = image.width * scale;
    const imageHeight = image.height * scale;
    const spacing = 250;

    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
          opacity,
          rotate: degrees(rotation),
        });
      }
    }
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): WatermarkTemplate | undefined {
    return this.templates.find(t => t.name === name);
  }
}

// Export singleton instance
export const watermarkService = new WatermarkService();
