/**
 * Simple Color Picker Component
 */

import { useState } from 'react';

interface ColorPickerProps {
  value: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const presetColors = [
    { name: 'Red', r: 1, g: 0, b: 0 },
    { name: 'Orange', r: 1, g: 0.5, b: 0 },
    { name: 'Yellow', r: 1, g: 1, b: 0 },
    { name: 'Green', r: 0, g: 0.5, b: 0 },
    { name: 'Blue', r: 0, g: 0, b: 1 },
    { name: 'Purple', r: 0.5, g: 0, b: 0.5 },
    { name: 'Black', r: 0, g: 0, b: 0 },
    { name: 'Gray', r: 0.5, g: 0.5, b: 0.5 },
  ];

  // Convert RGB (0-1) to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (val: number) => Math.round(val * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Convert hex to RGB (0-1)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0.5, g: 0.5, b: 0.5 };
  };

  const [hexValue, setHexValue] = useState(rgbToHex(value.r, value.g, value.b));

  const handleHexChange = (hex: string) => {
    setHexValue(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hexToRgb(hex));
    }
  };

  return (
    <div className="space-y-2">
      {/* Hex input */}
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded border-2 border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: rgbToHex(value.r, value.g, value.b) }}
        />
        <input
          type="text"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
          placeholder="#000000"
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
          maxLength={7}
        />
      </div>

      {/* Preset colors */}
      <div className="grid grid-cols-8 gap-1">
        {presetColors.map((color) => (
          <button
            key={color.name}
            onClick={() => {
              onChange(color);
              setHexValue(rgbToHex(color.r, color.g, color.b));
            }}
            className="h-6 w-6 rounded border-2 border-gray-300 hover:border-blue-500 dark:border-gray-600"
            style={{ backgroundColor: rgbToHex(color.r, color.g, color.b) }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
