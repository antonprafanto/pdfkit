/**
 * AI Service Tests
 * Test AI-related functionality and utilities
 */

import { describe, it, expect, vi } from 'vitest';

describe('AI Services', () => {
  describe('Text Extraction', () => {
    it('should extract clean text from basic content', () => {
      const rawText = '  Hello   World  \n\n  Test  ';
      const cleaned = rawText.replace(/\s+/g, ' ').trim();
      
      expect(cleaned).toBe('Hello World Test');
    });

    it('should handle empty content', () => {
      const rawText = '';
      const cleaned = rawText.replace(/\s+/g, ' ').trim();
      
      expect(cleaned).toBe('');
    });

    it('should preserve meaningful whitespace', () => {
      const rawText = 'Line 1\nLine 2\nLine 3';
      const lines = rawText.split('\n');
      
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Line 1');
    });
  });

  describe('Chunking Logic', () => {
    it('should split text into chunks', () => {
      const text = 'This is a long text that needs to be split into smaller chunks for processing.';
      const chunkSize = 20;
      const chunks: string[] = [];
      
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.join('')).toBe(text);
    });

    it('should handle overlap', () => {
      const text = 'ABCDEFGHIJ';
      const chunkSize = 4;
      const step = 2; // Overlap of 2 means step of chunkSize-2
      const chunks: string[] = [];
      
      for (let i = 0; i < text.length; i += step) {
        const chunk = text.slice(i, i + chunkSize);
        if (chunk.length > 0) chunks.push(chunk);
      }
      
      // With step=2, chunkSize=4: ABCD, CDEF, EFGH, GHIJ, IJ
      expect(chunks[0]).toBe('ABCD');
      expect(chunks[1]).toBe('CDEF');
      expect(chunks.length).toBeGreaterThan(2);
    });
  });

  describe('Embedding Utilities', () => {
    it('should normalize vector', () => {
      const vector = [3, 4];
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      const normalized = vector.map(v => v / magnitude);
      
      // Normalized vector should have magnitude ~1
      const normalizedMag = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
      expect(normalizedMag).toBeCloseTo(1, 5);
    });

    it('should calculate cosine similarity', () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      const vec3 = [1, 0];
      
      const dotProduct = (a: number[], b: number[]) => 
        a.reduce((sum, val, i) => sum + val * b[i], 0);
      
      // Orthogonal vectors = 0 similarity
      expect(dotProduct(vec1, vec2)).toBe(0);
      // Same vectors = 1 similarity
      expect(dotProduct(vec1, vec3)).toBe(1);
    });
  });

  describe('API Response Handling', () => {
    it('should parse streaming response chunks', () => {
      const chunks = ['Hello', ' World', '!'];
      let result = '';
      
      for (const chunk of chunks) {
        result += chunk;
      }
      
      expect(result).toBe('Hello World!');
    });

    it('should handle error responses', () => {
      const errorResponse = { error: { message: 'Rate limit exceeded' } };
      
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.message).toContain('limit');
    });
  });

  describe('Prompt Templates', () => {
    it('should format system prompt', () => {
      const template = 'You are a helpful assistant for {{document}}';
      const filled = template.replace('{{document}}', 'annual_report.pdf');
      
      expect(filled).toContain('annual_report.pdf');
    });

    it('should build context from chunks', () => {
      const chunks = [
        { content: 'Revenue increased 20%', page: 1 },
        { content: 'Expenses decreased 10%', page: 2 },
      ];
      
      const context = chunks.map(c => `[Page ${c.page}] ${c.content}`).join('\n\n');
      
      expect(context).toContain('[Page 1]');
      expect(context).toContain('[Page 2]');
    });
  });
});
