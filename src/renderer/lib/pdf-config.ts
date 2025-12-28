/**
 * PDF.js Configuration
 * Setup worker and global settings for PDF.js
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with better error handling
try {
  // Try to use dynamic import URL (works in both dev and properly bundled prod)
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  console.log('[PDF.js] Worker configured successfully:', workerSrc);
} catch (error) {
  console.error('[PDF.js] Failed to configure worker via dynamic URL:', error);
  // Fallback: try relative path (for production builds)
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdf.worker.min.mjs';
    console.log('[PDF.js] Using fallback worker path');
  } catch (fallbackError) {
    console.error('[PDF.js] Failed to configure worker on fallback:', fallbackError);
  }
}

// Configure CMap for font support (required for CJK and special characters)
// Use CDN by default to avoid local file issues with cmaps
const cMapUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/';
const standardFontDataUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/';

console.log('[PDF.js] CMap URL configured (CDN):', cMapUrl);
console.log('[PDF.js] Standard Fonts URL configured (CDN):', standardFontDataUrl);

// Export CMap configuration for use in getDocument calls
export const PDF_CONFIG = {
  cMapUrl,
  cMapPacked: true,
  standardFontDataUrl,
  // Add verbosity for debugging font issues
  verbosity: 1, // 0 = errors, 1 = warnings, 5 = infos
  // Disable font face rendering as fallback for problematic fonts
  disableFontFace: false,
  // Enable worker font rendering
  useWorkerFetch: false,
};

// Export configured pdfjs
export { pdfjsLib };

// PDF.js types and interfaces
export type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;
export type PDFPageProxy = pdfjsLib.PDFPageProxy;
export type PDFPageViewport = pdfjsLib.PageViewport;

// PDF rendering options
export interface RenderOptions {
  scale: number;
  rotation: number;
  enableWebGL?: boolean;
}

// Default rendering options
export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  scale: 1.0,
  rotation: 0,
  enableWebGL: false,
};

// Zoom levels
export const ZOOM_LEVELS = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0,
] as const;

export const DEFAULT_ZOOM = 1.0;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 5.0;
export const ZOOM_STEP = 0.25;

// Rotation angles
export const ROTATION_ANGLES = [0, 90, 180, 270] as const;
export type RotationAngle = (typeof ROTATION_ANGLES)[number];
