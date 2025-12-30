/**
 * Form Text Field Component
 * Renders an interactive text input overlay for PDF forms
 */

import React, { useState, useEffect } from 'react';
import { FormField } from '../../lib/pdf-forms.service';
import { useFormsStore } from '../../store/forms-store';

interface FormTextFieldProps {
  field: FormField;
  scale: number;
  rotation: number;
  noPosition?: boolean; // If true, don't apply positioning (parent handles it)
}

export const FormTextField: React.FC<FormTextFieldProps> = ({ field, scale, rotation, noPosition = false }) => {
  const { updateFieldValue, validationErrors, clearValidationError } = useFormsStore();
  const [localValue, setLocalValue] = useState(field.value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalValue(field.value || '');
  }, [field.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Check max length
    if (field.maxLength && newValue.length > field.maxLength) {
      return;
    }

    setLocalValue(newValue);
    updateFieldValue(field.name, newValue);
    clearValidationError(field.name);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const [x, y, width, height] = field.rect;
  const hasError = !!validationErrors[field.name];

  // Calculate position and size with scale
  const style: React.CSSProperties = noPosition ? {
    // Parent handles positioning - just set size
    width: '100%',
    height: '100%',
  } : {
    // Self-positioning mode (legacy)
    position: 'absolute',
    left: `${x * scale}px`,
    top: `${y * scale}px`,
    width: `${width * scale}px`,
    height: field.multiline ? `${height * scale}px` : `${Math.max(height * scale, 24)}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'top left',
  };

  const inputClassName = `
    w-full h-full px-2 py-1
    border-2 rounded
    ${hasError ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-400'}
    ${field.readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${field.required ? 'ring-1 ring-yellow-300' : ''}
    text-sm font-sans
    focus:outline-none focus:ring-2 focus:ring-blue-400
    transition-colors
  `;

  return (
    <div style={style} className="form-field-text">
      {field.multiline ? (
        <textarea
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={field.readOnly}
          placeholder={field.required ? 'Required' : ''}
          className={inputClassName}
          maxLength={field.maxLength}
          title={field.name}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={field.readOnly}
          placeholder={field.required ? 'Required' : ''}
          className={inputClassName}
          maxLength={field.maxLength}
          title={field.name}
        />
      )}

      {/* Validation error tooltip */}
      {hasError && (
        <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
          {validationErrors[field.name]}
        </div>
      )}
    </div>
  );
};
