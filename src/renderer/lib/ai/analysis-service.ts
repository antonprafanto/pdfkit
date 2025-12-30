/**
 * Document Analysis Service
 * Provides summarization, key points extraction, categorization, and translation
 */

import { aiService, ChatResponse } from './ai-service';
import { extractTextFromPDF } from './text-extractor';
import { useAIStore } from '../../store/ai-store';
import * as pdfjsLib from 'pdfjs-dist';

export type SummaryLength = 'short' | 'medium' | 'long';

export interface AnalysisResult {
  content: string;
  tokensUsed: number;
  timestamp: Date;
}

export interface DocumentCategory {
  category: string;
  confidence: string;
  reason: string;
}

const SUPPORTED_LANGUAGES = {
  en: 'English',
  id: 'Indonesian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  pt: 'Portuguese',
  it: 'Italian',
};

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

class AnalysisService {
  private textCache: Map<string, string> = new Map();

  /**
   * Get or extract text from PDF
   */
  async getDocumentText(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    documentId: string,
    maxPages?: number
  ): Promise<string> {
    const cacheKey = `${documentId}_${maxPages || 'all'}`;
    
    if (this.textCache.has(cacheKey)) {
      return this.textCache.get(cacheKey)!;
    }

    const pageTexts = await extractTextFromPDF(pdfDocument);
    const pagesToUse = maxPages ? pageTexts.slice(0, maxPages) : pageTexts;
    const fullText = pagesToUse.join('\n\n');
    
    this.textCache.set(cacheKey, fullText);
    return fullText;
  }

  /**
   * Clear text cache
   */
  clearCache(): void {
    this.textCache.clear();
  }

  /**
   * Summarize document
   */
  async summarize(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    documentId: string,
    length: SummaryLength = 'medium',
    language?: string
  ): Promise<AnalysisResult> {
    if (!aiService.isConfigured()) {
      throw new Error('AI not configured');
    }

    // Get first 10 pages for summary (to manage token limits)
    const text = await this.getDocumentText(pdfDocument, documentId, 10);
    
    // Truncate if too long (rough token estimate)
    const maxChars = length === 'long' ? 15000 : length === 'medium' ? 10000 : 5000;
    const truncatedText = text.substring(0, maxChars);

    const response = await aiService.summarize(truncatedText, { length, language });
    
    useAIStore.getState().addTokenUsage(response.tokensUsed);

    return {
      content: response.content,
      tokensUsed: response.tokensUsed,
      timestamp: new Date(),
    };
  }

  /**
   * Extract key points
   */
  async extractKeyPoints(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    documentId: string,
    language?: string
  ): Promise<AnalysisResult> {
    if (!aiService.isConfigured()) {
      throw new Error('AI not configured');
    }

    const text = await this.getDocumentText(pdfDocument, documentId, 10);
    const truncatedText = text.substring(0, 12000);

    const response = await aiService.extractKeyPoints(truncatedText, language);
    
    useAIStore.getState().addTokenUsage(response.tokensUsed);

    return {
      content: response.content,
      tokensUsed: response.tokensUsed,
      timestamp: new Date(),
    };
  }

  /**
   * Categorize document
   */
  async categorize(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    documentId: string
  ): Promise<{ result: AnalysisResult; category: DocumentCategory }> {
    if (!aiService.isConfigured()) {
      throw new Error('AI not configured');
    }

    // Use first 5 pages for categorization
    const text = await this.getDocumentText(pdfDocument, documentId, 5);
    const truncatedText = text.substring(0, 5000);

    const response = await aiService.categorize(truncatedText);
    
    useAIStore.getState().addTokenUsage(response.tokensUsed);

    // Parse the category from response
    const lines = response.content.split('\n');
    const category: DocumentCategory = {
      category: lines[0]?.replace(/^Category:\s*/i, '').trim() || 'Unknown',
      confidence: 'Medium',
      reason: lines.slice(1).join(' ').trim() || response.content,
    };

    return {
      result: {
        content: response.content,
        tokensUsed: response.tokensUsed,
        timestamp: new Date(),
      },
      category,
    };
  }

  /**
   * Translate document content
   */
  async translate(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    documentId: string,
    targetLanguage: SupportedLanguage,
    pageNumbers?: number[]
  ): Promise<AnalysisResult> {
    if (!aiService.isConfigured()) {
      throw new Error('AI not configured');
    }

    const pageTexts = await extractTextFromPDF(pdfDocument);
    
    // Get specific pages or first 5 pages
    let textToTranslate: string;
    if (pageNumbers && pageNumbers.length > 0) {
      textToTranslate = pageNumbers
        .filter((p) => p >= 1 && p <= pageTexts.length)
        .map((p) => `[Page ${p}]\n${pageTexts[p - 1]}`)
        .join('\n\n');
    } else {
      textToTranslate = pageTexts.slice(0, 5).join('\n\n');
    }

    // Truncate if too long
    const truncatedText = textToTranslate.substring(0, 8000);

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
    const response = await aiService.translate(truncatedText, {
      targetLanguage: targetLangName,
      preserveFormatting: true,
    });
    
    useAIStore.getState().addTokenUsage(response.tokensUsed);

    return {
      content: response.content,
      tokensUsed: response.tokensUsed,
      timestamp: new Date(),
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { code: SupportedLanguage; name: string }[] {
    return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      code: code as SupportedLanguage,
      name,
    }));
  }
}

// Singleton
export const analysisService = new AnalysisService();
