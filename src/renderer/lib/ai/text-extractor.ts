/**
 * PDF Text Extractor
 * Extracts text from PDF pages with chunking for RAG
 */

import * as pdfjsLib from 'pdfjs-dist';

export interface TextChunk {
  id: string;
  text: string;
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

export interface ExtractionResult {
  chunks: TextChunk[];
  totalPages: number;
  totalCharacters: number;
}

/**
 * Extract all text from a PDF document
 */
export async function extractTextFromPDF(
  pdfDocument: pdfjsLib.PDFDocumentProxy
): Promise<string[]> {
  const pageTexts: string[] = [];
  
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    pageTexts.push(pageText);
  }
  
  return pageTexts;
}

/**
 * Split text into chunks with overlap for better context
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }
  
  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Try to break at a sentence boundary
    if (endIndex < text.length) {
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > startIndex + chunkSize / 2) {
        endIndex = breakPoint + 1;
      }
    }
    
    chunks.push(text.substring(startIndex, endIndex).trim());
    startIndex = endIndex - overlap;
  }
  
  return chunks;
}

/**
 * Extract and chunk text from PDF with page metadata
 */
export async function extractAndChunkPDF(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  chunkSize: number = 500,
  overlap: number = 50
): Promise<ExtractionResult> {
  const pageTexts = await extractTextFromPDF(pdfDocument);
  const chunks: TextChunk[] = [];
  let totalCharacters = 0;
  let chunkIndex = 0;
  
  for (let pageNum = 0; pageNum < pageTexts.length; pageNum++) {
    const pageText = pageTexts[pageNum];
    totalCharacters += pageText.length;
    
    if (pageText.length === 0) continue;
    
    const pageChunks = chunkText(pageText, chunkSize, overlap);
    let charIndex = 0;
    
    for (const chunkText of pageChunks) {
      chunks.push({
        id: `chunk_${chunkIndex++}`,
        text: chunkText,
        pageNumber: pageNum + 1,
        startIndex: charIndex,
        endIndex: charIndex + chunkText.length,
      });
      charIndex += chunkText.length - overlap;
    }
  }
  
  return {
    chunks,
    totalPages: pageTexts.length,
    totalCharacters,
  };
}

/**
 * Get full text from specific pages
 */
export async function getPageText(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  pageNumbers: number[]
): Promise<string> {
  const pageTexts = await extractTextFromPDF(pdfDocument);
  
  return pageNumbers
    .filter((p) => p >= 1 && p <= pageTexts.length)
    .map((p) => `[Page ${p}]\n${pageTexts[p - 1]}`)
    .join('\n\n');
}
