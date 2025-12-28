/**
 * Field Placeholder Component
 * Visual preview for form fields being created
 */

import React from 'react';
import { FormFieldType } from '../../lib/pdf-forms.service';

interface FieldPlaceholderProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  type?: FormFieldType;
  scale: number;
}

export const FieldPlaceholder: React.FC<FieldPlaceholderProps> = ({
  x,
  y,
  width = 200,
  height = 30,
  type = 'text',
  scale,
}) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x * scale}px`,
    top: `${y * scale}px`,
    width: `${width * scale}px`,
    height: `${height * scale}px`,
    pointerEvents: 'none',
  };

  // Different styles based on field type
  const getFieldIcon = () => {
    switch (type) {
      case 'text':
        return '📝';
      case 'checkbox':
        return '☑️';
      case 'radio':
        return '🔘';
      case 'dropdown':
        return '📋';
      case 'button':
        return '🔲';
      default:
        return '📄';
    }
  };

  const getFieldLabel = () => {
    switch (type) {
      case 'text':
        return 'Text Field';
      case 'checkbox':
        return 'Checkbox';
      case 'radio':
        return 'Radio Button';
      case 'dropdown':
        return 'Dropdown';
      case 'button':
        return 'Button';
      default:
        return 'Field';
    }
  };

  return (
    <div
      style={style}
      className="border-2 border-dashed border-blue-500 bg-blue-100 dark:bg-blue-900 bg-opacity-30 dark:bg-opacity-30 rounded flex items-center justify-center gap-2 animate-pulse"
    >
      <span className="text-2xl">{getFieldIcon()}</span>
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {getFieldLabel()}
      </span>
    </div>
  );
};
