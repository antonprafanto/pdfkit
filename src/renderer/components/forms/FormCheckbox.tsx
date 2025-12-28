/**
 * Form Checkbox Component
 * Renders an interactive checkbox overlay for PDF forms
 */

import React from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { useFormsStore } from '../../store/forms-store';

interface FormCheckboxProps {
  field: FormField;
  scale: number;
  rotation: number;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ field, scale, rotation }) => {
  const { updateFieldValue } = useFormsStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFieldValue(field.name, e.target.checked);
  };

  const [x, y, width, height] = field.rect;

  // Make it square (use the smaller dimension)
  const size = Math.min(width, height);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x * scale}px`,
    top: `${y * scale}px`,
    width: `${size * scale}px`,
    height: `${size * scale}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'top left',
  };

  const checkboxClassName = `
    w-full h-full
    border-2 border-gray-400 rounded
    ${field.readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${field.required ? 'ring-1 ring-yellow-300' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-400
    checked:bg-blue-600 checked:border-blue-600
    transition-colors
  `;

  return (
    <div style={style} className="form-field-checkbox flex items-center justify-center">
      <input
        type="checkbox"
        checked={!!field.value}
        onChange={handleChange}
        disabled={field.readOnly}
        className={checkboxClassName}
        title={field.name}
      />
    </div>
  );
};
