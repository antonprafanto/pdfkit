/**
 * Form Field Overlay Component
 * Renders all form fields as overlays on a PDF page
 */

import React from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { FormTextField } from './FormTextField';
import { FormCheckbox } from './FormCheckbox';
import { FormRadioButton } from './FormRadioButton';
import { FormDropdown } from './FormDropdown';

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
  // Filter fields for current page
  const pageFields = fields.filter((field) => field.page === pageNumber);

  if (pageFields.length === 0) {
    return null;
  }

  return (
    <div
      className="form-fields-overlay absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {pageFields.map((field) => {
        // Enable pointer events for individual fields
        const fieldWrapper = (
          <div key={field.id} className="pointer-events-auto">
            {renderField(field, scale, rotation)}
          </div>
        );

        return fieldWrapper;
      })}
    </div>
  );
};

/**
 * Render appropriate field component based on field type
 */
function renderField(field: FormField, scale: number, rotation: number): React.ReactNode {
  switch (field.type) {
    case 'text':
      return <FormTextField field={field} scale={scale} rotation={rotation} />;

    case 'checkbox':
      return <FormCheckbox field={field} scale={scale} rotation={rotation} />;

    case 'radio':
      return <FormRadioButton field={field} scale={scale} rotation={rotation} />;

    case 'dropdown':
      return <FormDropdown field={field} scale={scale} rotation={rotation} />;

    case 'button':
      // TODO: Implement button field if needed
      return null;

    default:
      console.warn(`Unknown field type: ${field.type}`);
      return null;
  }
}
