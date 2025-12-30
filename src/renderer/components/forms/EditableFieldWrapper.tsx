/**
 * Editable Field Wrapper Component
 * Provides drag, resize, delete, and rename functionality for form fields
 */

import React, { useState, useRef, useCallback } from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { useFormsStore } from '../../store/forms-store';
import { useToast } from '../ui/Toast';

interface EditableFieldWrapperProps {
  field: FormField;
  scale: number;
  rotation: number;
  children: React.ReactNode;
}

// Field type icons
const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <span className="text-xs">📝</span>,
  checkbox: <span className="text-xs">☑️</span>,
  radio: <span className="text-xs">🔘</span>,
  dropdown: <span className="text-xs">📋</span>,
  button: <span className="text-xs">🔲</span>,
};

export const EditableFieldWrapper: React.FC<EditableFieldWrapperProps> = ({
  field,
  scale,
  rotation,
  children,
}) => {
  const { editMode, selectedField, selectField, updateField, removeField } = useFormsStore();
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(field.name);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startRect = useRef<[number, number, number, number]>([0, 0, 0, 0]);

  const isSelected = selectedField === field.id;
  const [x, y, width, height] = field.rect;

  // Handle selection - don't block if clicking on input elements
  const handleSelect = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    
    // Allow input elements to receive focus
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      // Still select the field but don't stop propagation
      if (editMode) {
        selectField(field.id);
      }
      return;
    }
    
    e.stopPropagation();
    if (editMode) {
      selectField(field.id);
    }
  };

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeField(field.id);
    toast.success('Field deleted', field.name);
  };

  // Handle double-click to rename
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editMode && isSelected) {
      setEditName(field.name);
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Save rename
  const handleSaveRename = () => {
    const newName = editName.trim();
    if (newName && newName !== field.name) {
      updateField(field.id, { name: newName });
      toast.success('Field renamed', `${field.name} → ${newName}`);
    }
    setIsEditing(false);
  };

  // Cancel rename
  const handleCancelRename = () => {
    setEditName(field.name);
    setIsEditing(false);
  };

  // Handle rename key press
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  // Start dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!editMode || !isSelected || isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startRect.current = [...field.rect];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startPos.current.x) / scale;
      const deltaY = (moveEvent.clientY - startPos.current.y) / scale;

      updateField(field.id, {
        rect: [
          startRect.current[0] + deltaX,
          startRect.current[1] + deltaY,
          startRect.current[2],
          startRect.current[3],
        ],
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [editMode, isSelected, isEditing, field.id, field.rect, scale, updateField]);

  // Start resizing
  const handleResizeStart = useCallback((handle: string) => (e: React.MouseEvent) => {
    if (!editMode || !isSelected) return;
    e.preventDefault();
    e.stopPropagation();

    startPos.current = { x: e.clientX, y: e.clientY };
    startRect.current = [...field.rect];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startPos.current.x) / scale;
      const deltaY = (moveEvent.clientY - startPos.current.y) / scale;

      let newRect: [number, number, number, number] = [...startRect.current];

      switch (handle) {
        case 'se': // Bottom-right
          newRect[2] = Math.max(50, startRect.current[2] + deltaX);
          newRect[3] = Math.max(20, startRect.current[3] + deltaY);
          break;
        case 'sw': // Bottom-left
          newRect[0] = startRect.current[0] + deltaX;
          newRect[2] = Math.max(50, startRect.current[2] - deltaX);
          newRect[3] = Math.max(20, startRect.current[3] + deltaY);
          break;
        case 'ne': // Top-right
          newRect[1] = startRect.current[1] + deltaY;
          newRect[2] = Math.max(50, startRect.current[2] + deltaX);
          newRect[3] = Math.max(20, startRect.current[3] - deltaY);
          break;
        case 'nw': // Top-left
          newRect[0] = startRect.current[0] + deltaX;
          newRect[1] = startRect.current[1] + deltaY;
          newRect[2] = Math.max(50, startRect.current[2] - deltaX);
          newRect[3] = Math.max(20, startRect.current[3] - deltaY);
          break;
        case 'e': // Right
          newRect[2] = Math.max(50, startRect.current[2] + deltaX);
          break;
        case 'w': // Left
          newRect[0] = startRect.current[0] + deltaX;
          newRect[2] = Math.max(50, startRect.current[2] - deltaX);
          break;
        case 'n': // Top
          newRect[1] = startRect.current[1] + deltaY;
          newRect[3] = Math.max(20, startRect.current[3] - deltaY);
          break;
        case 's': // Bottom
          newRect[3] = Math.max(20, startRect.current[3] + deltaY);
          break;
      }

      updateField(field.id, { rect: newRect });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [editMode, isSelected, field.id, scale, updateField]);

  // Wrapper styles
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x * scale}px`,
    top: `${y * scale}px`,
    width: `${width * scale}px`,
    height: `${height * scale}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'top left',
    cursor: editMode && isSelected && !isEditing ? 'move' : editMode ? 'pointer' : 'default',
    zIndex: isSelected ? 50 : 20,
    transition: isDragging ? 'none' : 'box-shadow 0.15s ease',
  };

  // Handle styles for resize handles
  const handleStyle = (position: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: '10px',
      height: '10px',
      backgroundColor: '#3b82f6',
      border: '1px solid white',
      borderRadius: '2px',
      zIndex: 40,
      transition: 'transform 0.1s ease',
    };

    const hover = { transform: 'scale(1.2)' };

    switch (position) {
      case 'nw': return { ...base, top: '-5px', left: '-5px', cursor: 'nwse-resize' };
      case 'ne': return { ...base, top: '-5px', right: '-5px', cursor: 'nesw-resize' };
      case 'sw': return { ...base, bottom: '-5px', left: '-5px', cursor: 'nesw-resize' };
      case 'se': return { ...base, bottom: '-5px', right: '-5px', cursor: 'nwse-resize' };
      case 'n': return { ...base, top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
      case 's': return { ...base, bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
      case 'e': return { ...base, right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };
      case 'w': return { ...base, left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };
      default: return base;
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={wrapperStyle}
      data-field-id={field.id}
      onClick={editMode ? handleSelect : undefined}
      onMouseDown={editMode && isSelected && !isEditing ? handleDragStart : undefined}
      className={`
        ${isSelected && editMode ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${isDragging ? 'opacity-80 shadow-xl' : ''}
      `}
    >
      {/* Field content - allow pointer events when not in edit mode OR when selected */}
      <div 
        className="w-full h-full"
        style={{ pointerEvents: !editMode || isSelected ? 'auto' : 'none' }}
      >
        {children}
      </div>

      {/* Selection UI - only show in edit mode when selected */}
      {editMode && isSelected && (
        <>
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 shadow-md z-50 transition-all"
            title="Delete field (Del)"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Field name label with double-click to edit */}
          <div 
            className="absolute -top-7 left-0 flex items-center gap-1 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-md z-40 cursor-text"
            onDoubleClick={handleDoubleClick}
            title="Double-click to rename"
          >
            {fieldTypeIcons[field.type] || '📄'}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleSaveRename}
                className="bg-white text-gray-900 px-1 rounded text-xs w-24 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="max-w-[120px] truncate">{field.name}</span>
            )}
          </div>

          {/* Resize handles */}
          <div style={handleStyle('nw')} onMouseDown={handleResizeStart('nw')} className="hover:scale-125" />
          <div style={handleStyle('ne')} onMouseDown={handleResizeStart('ne')} className="hover:scale-125" />
          <div style={handleStyle('sw')} onMouseDown={handleResizeStart('sw')} className="hover:scale-125" />
          <div style={handleStyle('se')} onMouseDown={handleResizeStart('se')} className="hover:scale-125" />
          <div style={handleStyle('n')} onMouseDown={handleResizeStart('n')} className="hover:scale-125" />
          <div style={handleStyle('s')} onMouseDown={handleResizeStart('s')} className="hover:scale-125" />
          <div style={handleStyle('e')} onMouseDown={handleResizeStart('e')} className="hover:scale-125" />
          <div style={handleStyle('w')} onMouseDown={handleResizeStart('w')} className="hover:scale-125" />
        </>
      )}

      {/* Hover indicator in edit mode */}
      {editMode && !isSelected && (
        <div 
          className="absolute inset-0 border-2 border-transparent hover:border-blue-400 transition-colors rounded pointer-events-none"
        />
      )}
    </div>
  );
};
