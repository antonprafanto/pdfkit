/**
 * RAG Service - Retrieval Augmented Generation
 * Orchestrates text extraction, embedding, and AI responses
 */

import * as pdfjsLib from 'pdfjs-dist';
import { aiService, AIMessage, ChatResponse } from './ai-service';
import { extractAndChunkPDF, TextChunk } from './text-extractor';
import { vectorStore, SearchResult } from './vector-store';
import { useAIStore } from '../../store/ai-store';

export interface RAGConfig {
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  minSimilarity: number;
}

const DEFAULT_CONFIG: RAGConfig = {
  topK: 5,
  chunkSize: 500,
  chunkOverlap: 50,
  minSimilarity: 0.3,
};

export interface RAGResponse {
  answer: string;
  sources: {
    pageNumber: number;
    text: string;
    similarity: number;
  }[];
  tokensUsed: number;
}

export interface IndexingProgress {
  stage: 'extracting' | 'embedding' | 'complete';
  current: number;
  total: number;
  message: string;
}

class RAGService {
  private config: RAGConfig = DEFAULT_CONFIG;
  private isIndexed: boolean = false;
  private currentDocumentId: string | null = null;

  /**
   * Update configuration
   */
  configure(config: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if document is indexed
   */
  isDocumentIndexed(): boolean {
    return this.isIndexed && !vectorStore.isEmpty();
  }

  /**
   * Get current document ID
   */
  getDocumentId(): string | null {
    return this.currentDocumentId;
  }

  /**
   * Index a PDF document for RAG
   */
  async indexDocument(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    documentId: string,
    onProgress?: (progress: IndexingProgress) => void
  ): Promise<void> {
    // Clear previous data if different document
    if (this.currentDocumentId !== documentId) {
      vectorStore.clear();
      this.isIndexed = false;
    }

    this.currentDocumentId = documentId;
    vectorStore.setDocumentId(documentId);

    // Check if AI is configured
    if (!aiService.isConfigured()) {
      throw new Error('Please configure an AI API key in Settings → AI');
    }

    try {
      // Stage 1: Extract text
      onProgress?.({
        stage: 'extracting',
        current: 0,
        total: pdfDocument.numPages,
        message: 'Extracting text from PDF...',
      });

      const extraction = await extractAndChunkPDF(
        pdfDocument,
        this.config.chunkSize,
        this.config.chunkOverlap
      );

      onProgress?.({
        stage: 'extracting',
        current: extraction.totalPages,
        total: extraction.totalPages,
        message: `Extracted ${extraction.chunks.length} text chunks from ${extraction.totalPages} pages`,
      });

      // Stage 2: Generate embeddings
      const totalChunks = extraction.chunks.length;
      
      onProgress?.({
        stage: 'embedding',
        current: 0,
        total: totalChunks,
        message: 'Generating embeddings...',
      });

      await vectorStore.addChunks(extraction.chunks, (current, total) => {
        onProgress?.({
          stage: 'embedding',
          current,
          total,
          message: `Embedding chunk ${current}/${total}...`,
        });
      });

      this.isIndexed = true;

      onProgress?.({
        stage: 'complete',
        current: totalChunks,
        total: totalChunks,
        message: `Ready! Indexed ${totalChunks} chunks.`,
      });

    } catch (error) {
      this.isIndexed = false;
      throw error;
    }
  }

  /**
   * Query the document with RAG
   */
  async query(
    question: string,
    conversationHistory: AIMessage[] = [],
    language?: string
  ): Promise<RAGResponse> {
    if (!this.isDocumentIndexed()) {
      throw new Error('Document not indexed. Please index the document first.');
    }

    if (!aiService.isConfigured()) {
      throw new Error('Please configure an AI API key in Settings → AI');
    }

    // Search for relevant chunks
    const searchResults = await vectorStore.search(question, this.config.topK);
    
    // Filter by minimum similarity
    const relevantResults = searchResults.filter(
      (r) => r.similarity >= this.config.minSimilarity
    );

    // Build context from search results
    const context = vectorStore.getContextFromResults(relevantResults);

    // Generate answer with context
    const response = await aiService.answerWithContext(
      question,
      context,
      conversationHistory,
      language
    );

    // Track token usage
    useAIStore.getState().addTokenUsage(response.tokensUsed);

    // Format sources
    const sources = relevantResults.map((r) => ({
      pageNumber: r.document.metadata.pageNumber,
      text: r.document.text.substring(0, 200) + '...',
      similarity: r.similarity,
    }));

    return {
      answer: response.content,
      sources,
      tokensUsed: response.tokensUsed,
    };
  }

  /**
   * Semantic search in document
   */
  async semanticSearch(query: string, topK: number = 10): Promise<SearchResult[]> {
    if (!this.isDocumentIndexed()) {
      throw new Error('Document not indexed');
    }

    return vectorStore.search(query, topK);
  }

  /**
   * Clear indexed data
   */
  clear(): void {
    vectorStore.clear();
    this.isIndexed = false;
    this.currentDocumentId = null;
  }
}

// Singleton instance
export const ragService = new RAGService();
