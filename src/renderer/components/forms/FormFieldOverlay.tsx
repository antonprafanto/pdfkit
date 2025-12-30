/**
 * Form Field Overlay Component
 * Renders all form fields as overlays on a PDF page
 * Now with editable wrapper for drag/resize/delete
 */

import React from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { FormTextField } from './FormTextField';
import { FormCheckbox } from './FormCheckbox';
import { FormRadioButton } from './FormRadioButton';
import { FormDropdown } from './FormDropdown';
import { EditableFieldWrapper } from './EditableFieldWrapper';
import { useFieldKeyboardShortcuts } from '../../hooks/useFieldKeyboardShortcuts';

interface FormFieldOverlayProps {
  fields: FormField[];
  pageNumber: number;
  scale: number;
  rotation: number;
}

export const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  fields,
  pageNumber,
  scale,
  rotation,
}) => {
  
  // Enable keyboard shortcuts for field manipulation
  useFieldKeyboardShortcuts();
  
  // Filter fields for current page
  const pageFields = fields.filter((field) => field.page === pageNumber);

  if (pageFields.length === 0) {
    return null;
  }

  return (
    <div
      className="form-fields-overlay absolute inset-0"
      style={{ zIndex: 10, pointerEvents: 'none' }}
    >
      {pageFields.map((field) => (
        <div key={field.id} style={{ pointerEvents: 'auto' }}>
          <EditableFieldWrapper
            field={field}
            scale={scale}
            rotation={rotation}
          >
            {renderField(field, scale, rotation)}
          </EditableFieldWrapper>
        </div>
      ))}
    </div>
  );
};

/**
 * Render appropriate field component based on field type
 * Using noPosition=true since EditableFieldWrapper handles positioning
 */
function renderField(field: FormField, scale: number, rotation: number): React.ReactNode {
  switch (field.type) {
    case 'text':
      return <FormTextField field={field} scale={scale} rotation={rotation} noPosition={true} />;

    case 'checkbox':
      return <FormCheckbox field={field} scale={scale} rotation={rotation} noPosition={true} />;

    case 'radio':
      return <FormRadioButton field={field} scale={scale} rotation={rotation} noPosition={true} />;

    case 'dropdown':
      return <FormDropdown field={field} scale={scale} rotation={rotation} noPosition={true} />;

    case 'button':
      // TODO: Implement button field if needed
      return null;

    default:
      console.warn(`Unknown field type: ${field.type}`);
      return null;
  }
}
