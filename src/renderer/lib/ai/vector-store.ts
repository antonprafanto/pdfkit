/**
 * Vector Store - In-memory vector database for RAG
 * Stores embeddings and performs similarity search
 */

import { aiService, EmbeddingResponse } from './ai-service';
import { TextChunk } from './text-extractor';

export interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    pageNumber: number;
    chunkIndex: number;
    documentId?: string;
  };
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-memory vector store for document embeddings
 */
export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private documentId: string | null = null;

  /**
   * Clear all stored documents
   */
  clear(): void {
    this.documents.clear();
    this.documentId = null;
  }

  /**
   * Get number of stored documents
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Check if store has documents
   */
  isEmpty(): boolean {
    return this.documents.size === 0;
  }

  /**
   * Set current document ID
   */
  setDocumentId(id: string): void {
    this.documentId = id;
  }

  /**
   * Get current document ID
   */
  getDocumentId(): string | null {
    return this.documentId;
  }

  /**
   * Add a document with pre-computed embedding
   */
  addDocument(doc: VectorDocument): void {
    this.documents.set(doc.id, doc);
  }

  /**
   * Add a text chunk and generate embedding
   */
  async addChunk(chunk: TextChunk, chunkIndex: number): Promise<VectorDocument> {
    try {
      const embeddingResponse = await aiService.embed(chunk.text);
      
      const doc: VectorDocument = {
        id: chunk.id,
        text: chunk.text,
        embedding: embeddingResponse.embedding,
        metadata: {
          pageNumber: chunk.pageNumber,
          chunkIndex,
          documentId: this.documentId || undefined,
        },
      };
      
      this.addDocument(doc);
      return doc;
    } catch (error) {
      console.error('Failed to embed chunk:', error);
      throw error;
    }
  }

  /**
   * Add multiple chunks with embeddings (with progress callback)
   */
  async addChunks(
    chunks: TextChunk[],
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      await this.addChunk(chunks[i], i);
      onProgress?.(i + 1, chunks.length);
      
      // Add small delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Search for similar documents
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (this.isEmpty()) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await aiService.embed(query);
    
    // Calculate similarity with all documents
    const results: SearchResult[] = [];
    
    for (const doc of this.documents.values()) {
      const similarity = cosineSimilarity(queryEmbedding.embedding, doc.embedding);
      results.push({ document: doc, similarity });
    }
    
    // Sort by similarity (highest first) and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Get context from search results formatted for LLM
   */
  getContextFromResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant context found in the document.';
    }

    const contextParts = results.map((result, index) => {
      const { document, similarity } = result;
      return `[Source ${index + 1} - Page ${document.metadata.pageNumber}, Relevance: ${(similarity * 100).toFixed(1)}%]\n${document.text}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Get unique page numbers from search results
   */
  getPageNumbers(results: SearchResult[]): number[] {
    const pages = new Set<number>();
    results.forEach((r) => pages.add(r.document.metadata.pageNumber));
    return Array.from(pages).sort((a, b) => a - b);
  }
}

// Singleton instance
export const vectorStore = new VectorStore();
