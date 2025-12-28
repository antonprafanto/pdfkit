/**
 * Watermark Dialog
 * Dialog for adding text or image watermarks to PDFs
 */

import { useState } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { ColorPicker } from '../ui/ColorPicker';
import { watermarkService, WatermarkPosition } from '../../lib/watermark.service';
import { usePDFStore } from '../../store/pdf-store';

interface WatermarkDialogProps {
  open: boolean;
  onClose: () => void;
}

type WatermarkType = 'text' | 'image';

export function WatermarkDialog({ open, onClose }: WatermarkDialogProps) {
  const [type, setType] = useState<WatermarkType>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState({ r: 0.5, g: 0.5, b: 0.5 });
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState(30);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { document, fileName } = usePDFStore();

  const handleImageSelect = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg';
    input.onchange = (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setImageFile(files[0]);
      }
    };
    input.click();
  };

  const handleApplyTemplate = (templateName: string) => {
    const template = watermarkService.templates.find((t) => t.name === templateName);
    if (template) {
      setType('text');
      setText(template.options.text);
      setFontSize(template.options.fontSize || 48);
      setColor(template.options.color || { r: 0.5, g: 0.5, b: 0.5 });
      setOpacity((template.options.opacity || 0.3) * 100);
      setRotation(template.options.rotation || 0);
      setPosition(template.options.position || 'center');
    }
  };

  const handleApplyWatermark = async () => {
    if (!document || !fileName) {
      setError('No document loaded');
      return;
    }

    if (type === 'text' && !text.trim()) {
      setError('Please enter watermark text');
      return;
    }

    if (type === 'image' && !imageFile) {
      setError('Please select an image file');
      return;
    }

    try {
      setIsApplying(true);
      setError(null);

      // Get PDF data
      const pdfBytes = await document.getData();
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName, { type: 'application/pdf' });

      let watermarkedBytes: Uint8Array;

      if (type === 'text') {
        watermarkedBytes = await watermarkService.addTextWatermark(file, {
          text,
          fontSize,
          color,
          opacity: opacity / 100,
          rotation,
          position,
        });
      } else {
        if (!imageFile) throw new Error('Image file not selected');
        watermarkedBytes = await watermarkService.addImageWatermark(file, {
          imageFile,
          scale: imageScale / 100,
          opacity: opacity / 100,
          rotation,
          position,
        });
      }

      // Save watermarked PDF
      const defaultName = fileName.replace('.pdf', '_watermarked.pdf');
      const filePath = await window.electronAPI.saveFileDialog(defaultName);

      if (filePath) {
        const result = await window.electronAPI.savePdfFile(filePath, watermarkedBytes);

        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Failed to save watermarked PDF');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply watermark');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="💧 Add Watermark"
      description={`Add watermark to ${fileName || 'document'}`}
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button onClick={handleApplyWatermark} disabled={isApplying}>
            {isApplying ? <Spinner size="sm" /> : 'Apply Watermark'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Type selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Watermark Type</label>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setType('text')}
              className={`flex-1 rounded-lg border-2 p-3 text-sm transition-colors ${
                type === 'text'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              📝 Text
            </button>
            <button
              onClick={() => setType('image')}
              className={`flex-1 rounded-lg border-2 p-3 text-sm transition-colors ${
                type === 'image'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              🖼️ Image
            </button>
          </div>
        </div>

        {/* Text watermark options */}
        {type === 'text' && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                placeholder="Enter watermark text"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</label>
                <span className="text-sm text-gray-600 dark:text-gray-400">{fontSize}pt</span>
              </div>
              <input
                type="range"
                min={12}
                max={128}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <div className="mt-1">
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>
          </>
        )}

        {/* Image watermark options */}
        {type === 'image' && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image File</label>
              <div className="mt-1 flex items-center gap-2">
                <Button onClick={handleImageSelect} variant="outline" className="flex-1">
                  {imageFile ? imageFile.name : 'Select Image'}
                </Button>
                {imageFile && (
                  <button
                    onClick={() => setImageFile(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scale</label>
                <span className="text-sm text-gray-600 dark:text-gray-400">{imageScale}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={imageScale}
                onChange={(e) => setImageScale(parseInt(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
          </>
        )}

        {/* Common options */}
        <div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opacity</label>
            <span className="text-sm text-gray-600 dark:text-gray-400">{opacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value))}
            className="mt-1 w-full"
          />
        </div>

        <div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rotation</label>
            <span className="text-sm text-gray-600 dark:text-gray-400">{rotation}°</span>
          </div>
          <input
            type="range"
            min={-90}
            max={90}
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="mt-1 w-full"
          />
        </div>

        {/* Position */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { value: 'top-left' as const, label: 'Top Left' },
              { value: 'center' as const, label: 'Center' },
              { value: 'top-right' as const, label: 'Top Right' },
              { value: 'bottom-left' as const, label: 'Bottom Left' },
              { value: 'diagonal' as const, label: 'Diagonal' },
              { value: 'bottom-right' as const, label: 'Bottom Right' },
              { value: 'repeat' as const, label: 'Repeat', colspan: true },
            ].map((pos) => (
              <button
                key={pos.value}
                onClick={() => setPosition(pos.value)}
                className={`${pos.colspan ? 'col-span-3' : ''} rounded border-2 p-2 text-xs transition-colors ${
                  position === pos.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates - Only for text */}
        {type === 'text' && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Templates</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {watermarkService.templates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleApplyTemplate(template.name)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-blue-900/20"
                  title={template.description}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
