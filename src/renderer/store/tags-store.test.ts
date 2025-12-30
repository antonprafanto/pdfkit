/**
 * Tags Store Tests
 * Test tag/label management for files
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTagsStore, TAG_COLORS } from '../store/tags-store';

describe('Tags Store', () => {
  beforeEach(() => {
    // Reset store
    useTagsStore.setState({ 
      tags: [], 
      fileTags: [] 
    });
  });

  describe('Create Tag', () => {
    it('should create a new tag', () => {
      const { createTag } = useTagsStore.getState();
      
      createTag('Important', '#EF4444');
      
      const { tags } = useTagsStore.getState();
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe('Important');
      expect(tags[0].color).toBe('#EF4444');
    });

    it('should create multiple tags', () => {
      const { createTag } = useTagsStore.getState();
      
      createTag('Important', '#EF4444');
      createTag('Review', '#F59E0B');
      createTag('Archived', '#6B7280');
      
      expect(useTagsStore.getState().tags).toHaveLength(3);
    });
  });

  describe('Update Tag', () => {
    it('should update tag name', () => {
      const { createTag, updateTag } = useTagsStore.getState();
      
      createTag('Old', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().updateTag(tagId, { name: 'New' });
      
      expect(useTagsStore.getState().tags[0].name).toBe('New');
    });

    it('should update tag color', () => {
      const { createTag } = useTagsStore.getState();
      
      createTag('Test', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().updateTag(tagId, { color: '#3B82F6' });
      
      expect(useTagsStore.getState().tags[0].color).toBe('#3B82F6');
    });
  });

  describe('Delete Tag', () => {
    it('should delete tag', () => {
      const { createTag, deleteTag } = useTagsStore.getState();
      
      createTag('To Delete', '#EF4444');
      expect(useTagsStore.getState().tags).toHaveLength(1);
      
      const tagId = useTagsStore.getState().tags[0].id;
      useTagsStore.getState().deleteTag(tagId);
      
      expect(useTagsStore.getState().tags).toHaveLength(0);
    });

    it('should also remove file associations when tag is deleted', () => {
      const { createTag, assignTag, deleteTag } = useTagsStore.getState();
      
      createTag('Test', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().assignTag('/doc.pdf', tagId);
      expect(useTagsStore.getState().fileTags).toHaveLength(1);
      
      useTagsStore.getState().deleteTag(tagId);
      expect(useTagsStore.getState().fileTags).toHaveLength(0);
    });
  });

  describe('Assign/Unassign Tags', () => {
    it('should assign tag to file', () => {
      const { createTag, assignTag } = useTagsStore.getState();
      
      createTag('Important', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().assignTag('/document.pdf', tagId);
      
      const { fileTags } = useTagsStore.getState();
      expect(fileTags).toHaveLength(1);
      expect(fileTags[0].filePath).toBe('/document.pdf');
    });

    it('should not duplicate tag assignment', () => {
      const { createTag, assignTag } = useTagsStore.getState();
      
      createTag('Test', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().assignTag('/doc.pdf', tagId);
      useTagsStore.getState().assignTag('/doc.pdf', tagId);
      
      expect(useTagsStore.getState().fileTags).toHaveLength(1);
    });

    it('should unassign tag from file', () => {
      const { createTag, assignTag, unassignTag } = useTagsStore.getState();
      
      createTag('Test', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().assignTag('/doc.pdf', tagId);
      expect(useTagsStore.getState().fileTags).toHaveLength(1);
      
      useTagsStore.getState().unassignTag('/doc.pdf', tagId);
      expect(useTagsStore.getState().fileTags).toHaveLength(0);
    });
  });

  describe('Query Tags', () => {
    it('should get tags for file', () => {
      const { createTag, assignTag, getTagsForFile } = useTagsStore.getState();
      
      createTag('Important', '#EF4444');
      createTag('Review', '#F59E0B');
      
      const tag1Id = useTagsStore.getState().tags[0].id;
      const tag2Id = useTagsStore.getState().tags[1].id;
      
      useTagsStore.getState().assignTag('/doc.pdf', tag1Id);
      useTagsStore.getState().assignTag('/doc.pdf', tag2Id);
      
      const tags = useTagsStore.getState().getTagsForFile('/doc.pdf');
      expect(tags).toHaveLength(2);
    });

    it('should check if file has specific tag', () => {
      const { createTag, assignTag, hasTag } = useTagsStore.getState();
      
      createTag('Important', '#EF4444');
      const tagId = useTagsStore.getState().tags[0].id;
      
      useTagsStore.getState().assignTag('/doc.pdf', tagId);
      
      expect(useTagsStore.getState().hasTag('/doc.pdf', tagId)).toBe(true);
      expect(useTagsStore.getState().hasTag('/other.pdf', tagId)).toBe(false);
    });
  });
});
