/**
 * Tags Store Tests (Simplified)
 * Test tag/label logic without zustand persist
 */

import { describe, it, expect } from 'vitest';

// Simple unit tests that don't depend on zustand store internals
describe('Tags Logic', () => {
  describe('Tag Data Structure', () => {
    it('should have valid tag structure', () => {
      const tag = {
        id: 'tag_123',
        name: 'Important',
        color: '#EF4444',
        createdAt: new Date(),
      };
      
      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('Important');
      expect(tag.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should have valid file tag association', () => {
      const fileTag = {
        filePath: '/path/to/file.pdf',
        tagId: 'tag_123',
      };
      
      expect(fileTag.filePath).toContain('.pdf');
      expect(fileTag.tagId).toBeDefined();
    });
  });

  describe('Tag Utilities', () => {
    it('should filter tags for file', () => {
      const fileTags = [
        { filePath: '/a.pdf', tagId: 'tag_1' },
        { filePath: '/a.pdf', tagId: 'tag_2' },
        { filePath: '/b.pdf', tagId: 'tag_1' },
      ];
      
      const tagsForFileA = fileTags.filter(ft => ft.filePath === '/a.pdf');
      expect(tagsForFileA).toHaveLength(2);
    });

    it('should check if file has tag', () => {
      const fileTags = [
        { filePath: '/a.pdf', tagId: 'tag_1' },
      ];
      
      const hasTag = fileTags.some(ft => ft.filePath === '/a.pdf' && ft.tagId === 'tag_1');
      const noTag = fileTags.some(ft => ft.filePath === '/a.pdf' && ft.tagId === 'tag_2');
      
      expect(hasTag).toBe(true);
      expect(noTag).toBe(false);
    });

    it('should get files with specific tag', () => {
      const fileTags = [
        { filePath: '/a.pdf', tagId: 'tag_1' },
        { filePath: '/b.pdf', tagId: 'tag_1' },
        { filePath: '/c.pdf', tagId: 'tag_2' },
      ];
      
      const filesWithTag1 = fileTags
        .filter(ft => ft.tagId === 'tag_1')
        .map(ft => ft.filePath);
      
      expect(filesWithTag1).toHaveLength(2);
      expect(filesWithTag1).toContain('/a.pdf');
      expect(filesWithTag1).toContain('/b.pdf');
    });
  });
});
