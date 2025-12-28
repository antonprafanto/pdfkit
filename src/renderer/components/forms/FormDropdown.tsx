/**
 * Form Dropdown Component
 * Renders an interactive dropdown/select overlay for PDF forms
 */

import React from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { useFormsStore } from '../../store/forms-store';

interface FormDropdownProps {
  field: FormField;
  scale: number;
  rotation: number;
}

export const FormDropdown: React.FC<FormDropdownProps> = ({ field, scale, rotation }) => {
  const { updateFieldValue, validationErrors } = useFormsStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFieldValue(field.name, e.target.value);
  };

  const [x, y, width, height] = field.rect;
  const hasError = !!validationErrors[field.name];

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x * scale}px`,
    top: `${y * scale}px`,
    width: `${width * scale}px`,
    height: `${Math.max(height * scale, 24)}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'top left',
  };

  const selectClassName = `
    w-full h-full px-2 py-1
    border-2 rounded
    ${hasError ? 'border-red-500' : 'border-gray-400'}
    ${field.readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
    ${field.required ? 'ring-1 ring-yellow-300' : ''}
    text-sm font-sans
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500
    transition-colors
  `;

  return (
    <div style={style} className="form-field-dropdown">
      <select
        value={field.value || ''}
        onChange={handleChange}
        disabled={field.readOnly}
        className={selectClassName}
        title={field.name}
      >
        {/* Empty option if not required */}
        {!field.required && <option value="">-- Select --</option>}

        {/* Render options */}
        {field.options?.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}

        {/* Fallback if no options */}
        {(!field.options || field.options.length === 0) && (
          <option value="" disabled>
            No options available
          </option>
        )}
      </select>

      {/* Validation error tooltip */}
      {hasError && (
        <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
          {validationErrors[field.name]}
        </div>
      )}
    </div>
  );
};
