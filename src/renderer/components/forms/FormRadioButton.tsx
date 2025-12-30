/**
 * Form Radio Button Component
 * Renders an interactive radio button overlay for PDF forms
 */

import React from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { useFormsStore } from '../../store/forms-store';

interface FormRadioButtonProps {
  field: FormField;
  scale: number;
  rotation: number;
  noPosition?: boolean;
}

export const FormRadioButton: React.FC<FormRadioButtonProps> = ({ field, scale, rotation, noPosition = false }) => {
  const { updateFieldValue, fields } = useFormsStore();

  const handleChange = () => {
    if (field.readOnly) return;

    // Set this radio button's value
    updateFieldValue(field.name, field.value);

    // Clear other radio buttons in the same group
    if (field.group) {
      const groupFields = fields.filter(
        (f) => f.type === 'radio' && f.group === field.group && f.id !== field.id
      );

      groupFields.forEach((groupField) => {
        updateFieldValue(groupField.name, false);
      });
    }
  };

  const [x, y, width, height] = field.rect;

  // Make it square (use the smaller dimension)
  const size = Math.min(width, height);

  const style: React.CSSProperties = noPosition ? {
    width: '100%',
    height: '100%',
  } : {
    position: 'absolute',
    left: `${x * scale}px`,
    top: `${y * scale}px`,
    width: `${size * scale}px`,
    height: `${size * scale}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'top left',
  };

  // Check if this radio button is selected
  // For radio buttons, we need to check if the group's current value matches this field's value
  const isChecked = !!field.value;

  const radioClassName = `
    w-full h-full
    border-2 border-gray-400 rounded-full
    ${field.readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${field.required ? 'ring-1 ring-yellow-300' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-400
    ${isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white'}
    transition-colors
  `;

  return (
    <div style={style} className="form-field-radio flex items-center justify-center">
      <button
        type="button"
        onClick={handleChange}
        disabled={field.readOnly}
        className={radioClassName}
        title={`${field.name} - ${field.group || 'No group'}`}
        aria-checked={isChecked}
        role="radio"
      >
        {isChecked && (
          <div className="w-1/2 h-1/2 bg-white rounded-full m-auto"></div>
        )}
      </button>
    </div>
  );
};
