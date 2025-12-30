/**
 * PDF Utilities Tests
 * Test PDF manipulation logic and utilities
 */

import { describe, it, expect } from 'vitest';

describe('PDF Utilities', () => {
  describe('Page Range Parsing', () => {
    it('should parse single page', () => {
      const range = '5';
      const pages = range.split(',').map(r => {
        const trimmed = r.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [Number(trimmed)];
      }).flat();
      
      expect(pages).toEqual([5]);
    });

    it('should parse page range', () => {
      const range = '1-5';
      const pages = range.split(',').map(r => {
        const trimmed = r.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [Number(trimmed)];
      }).flat();
      
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse complex range', () => {
      const range = '1-3, 5, 7-9';
      const pages = range.split(',').map(r => {
        const trimmed = r.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [Number(trimmed)];
      }).flat();
      
      expect(pages).toEqual([1, 2, 3, 5, 7, 8, 9]);
    });
  });

  describe('Split Operations', () => {
    it('should calculate split by every N pages', () => {
      const totalPages = 10;
      const splitEvery = 3;
      const groups: number[][] = [];
      
      for (let i = 0; i < totalPages; i += splitEvery) {
        const end = Math.min(i + splitEvery, totalPages);
        groups.push(Array.from({ length: end - i }, (_, j) => i + j + 1));
      }
      
      expect(groups).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10],
      ]);
    });

    it('should split into individual pages', () => {
      const totalPages = 5;
      const individualPages = Array.from({ length: totalPages }, (_, i) => [i + 1]);
      
      expect(individualPages).toEqual([[1], [2], [3], [4], [5]]);
    });
  });

  describe('Merge Operations', () => {
    it('should calculate total page count after merge', () => {
      const pdfs = [
        { name: 'doc1.pdf', pageCount: 10 },
        { name: 'doc2.pdf', pageCount: 5 },
        { name: 'doc3.pdf', pageCount: 8 },
      ];
      
      const totalPages = pdfs.reduce((sum, pdf) => sum + pdf.pageCount, 0);
      
      expect(totalPages).toBe(23);
    });

    it('should generate output filename', () => {
      const inputFiles = ['doc1.pdf', 'doc2.pdf'];
      const baseName = inputFiles[0].replace('.pdf', '');
      const outputName = `${baseName}_merged.pdf`;
      
      expect(outputName).toBe('doc1_merged.pdf');
    });
  });

  describe('Compression Calculations', () => {
    it('should calculate compression ratio', () => {
      const originalSize = 10 * 1024 * 1024; // 10 MB
      const compressedSize = 3 * 1024 * 1024; // 3 MB
      
      const ratio = (1 - compressedSize / originalSize) * 100;
      
      expect(ratio).toBe(70);
    });

    it('should format file size', () => {
      const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      };
      
      expect(formatSize(512)).toBe('512 B');
      expect(formatSize(2048)).toBe('2.00 KB');
      expect(formatSize(5242880)).toBe('5.00 MB');
    });
  });

  describe('Validation', () => {
    it('should validate page number', () => {
      const totalPages = 10;
      const validatePage = (page: number) => page >= 1 && page <= totalPages;
      
      expect(validatePage(1)).toBe(true);
      expect(validatePage(10)).toBe(true);
      expect(validatePage(0)).toBe(false);
      expect(validatePage(11)).toBe(false);
    });

    it('should validate file extension', () => {
      const isPdf = (filename: string) => filename.toLowerCase().endsWith('.pdf');
      
      expect(isPdf('document.pdf')).toBe(true);
      expect(isPdf('document.PDF')).toBe(true);
      expect(isPdf('document.docx')).toBe(false);
    });
  });
});
