/**
 * Form Field Editor Component
 * Handles field creation mode with click-to-place functionality
 * Updated to not block interaction with existing fields
 */

import React, { useState } from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { useFormsStore } from '../../store/forms-store';
import { CreateFieldDialog } from './CreateFieldDialog';

interface FormFieldEditorProps {
  pageNumber: number;
  scale: number;
  onFieldCreated?: () => void;
}

export const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  pageNumber,
  scale,
  onFieldCreated,
}) => {
  const { editMode, addField, fields, selectField } = useFormsStore();
  const [showDialog, setShowDialog] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  if (!editMode) {
    return null;
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if we clicked on an existing field - if so, let it handle the event
    const target = e.target as HTMLElement;
    const fieldElement = target.closest('[data-field-id]');
    if (fieldElement) {
      // Click was on a field, don't create new one
      return;
    }

    // Get click position relative to the canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Deselect any selected field when clicking empty area
    selectField(null);

    setClickPosition({ x, y });
    setShowDialog(true);
  };

  const handleFieldConfirm = (fieldConfig: Partial<FormField>) => {
    const newField: FormField = {
      id: fieldConfig.id || `field_${Date.now()}`,
      name: fieldConfig.name || `field_${Date.now()}`,
      type: fieldConfig.type || 'text',
      page: pageNumber,
      rect: fieldConfig.rect || [clickPosition.x, clickPosition.y, 200, 30],
      value: fieldConfig.value || '',
      defaultValue: fieldConfig.defaultValue || '',
      required: fieldConfig.required || false,
      readOnly: fieldConfig.readOnly || false,
      multiline: fieldConfig.multiline,
      options: fieldConfig.options,
      group: fieldConfig.group,
      validation: fieldConfig.validation,
      maxLength: fieldConfig.maxLength,
    };

    addField(newField);
    setShowDialog(false);

    if (onFieldCreated) {
      onFieldCreated();
    }
  };

  const handleFieldCancel = () => {
    setShowDialog(false);
  };

  // Count fields on this page
  const pageFieldCount = fields.filter(f => f.page === pageNumber).length;

  return (
    <>
      {/* Click overlay for adding new fields - lower z-index so fields are on top */}
      <div
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-crosshair"
        style={{ 
          zIndex: 5, // Lower than FormFieldOverlay (z-10)
          backgroundColor: 'rgba(59, 130, 246, 0.05)', // Very subtle blue tint
        }}
        title="Click to add a form field"
      />

      {/* Visual indicator - always on top */}
      {!showDialog && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg text-sm pointer-events-none"
          style={{ zIndex: 100 }}
        >
          Click anywhere to add a form field
          {pageFieldCount > 0 && (
            <span className="ml-2 opacity-75">
              ({pageFieldCount} field{pageFieldCount !== 1 ? 's' : ''} on this page)
            </span>
          )}
        </div>
      )}

      {/* Instructions for existing fields */}
      {pageFieldCount > 0 && !showDialog && (
        <div 
          className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1.5 rounded shadow-lg text-xs pointer-events-none"
          style={{ zIndex: 100 }}
        >
          💡 Click a field to select it, then drag/resize/delete
        </div>
      )}

      {/* Create field dialog */}
      <CreateFieldDialog
        isOpen={showDialog}
        position={clickPosition}
        pageNumber={pageNumber}
        onConfirm={handleFieldConfirm}
        onCancel={handleFieldCancel}
      />
    </>
  );
};
