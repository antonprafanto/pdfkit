/**
 * Form Field Editor Component
 * Handles field creation mode with click-to-place functionality
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
  const { editMode, addField } = useFormsStore();
  const [showDialog, setShowDialog] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  if (!editMode) {
    return null;
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get click position relative to the canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

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

  return (
    <>
      {/* Click overlay - disable when dialog is open */}
      <div
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-crosshair z-20 bg-blue-500 bg-opacity-10"
        style={{ pointerEvents: editMode && !showDialog ? 'auto' : 'none' }}
        title="Click to add a form field"
      >
        {/* Visual indicator - hide when dialog is open */}
        {!showDialog && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg text-sm">
            Click anywhere to add a form field
          </div>
        )}
      </div>

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
