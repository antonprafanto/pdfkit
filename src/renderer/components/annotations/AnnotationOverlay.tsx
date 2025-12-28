/**
 * Annotation Overlay
 * SVG overlay that renders annotations on top of PDF page
 */

import { useState, useRef, useCallback } from 'react';
import {
  useAnnotationStore,
  Annotation,
  HighlightAnnotation,
  StickyNoteAnnotation,
  DrawingAnnotation,
  StampAnnotation,
} from '../../store/annotation-store';

interface AnnotationOverlayProps {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

// Stamp labels
const STAMP_LABELS: Record<string, { text: string; color: string }> = {
  approved: { text: 'APPROVED ✓', color: '#22c55e' },
  rejected: { text: 'REJECTED ✗', color: '#ef4444' },
  draft: { text: 'DRAFT', color: '#f59e0b' },
  confidential: { text: 'CONFIDENTIAL', color: '#dc2626' },
  reviewed: { text: 'REVIEWED', color: '#3b82f6' },
  custom: { text: 'CUSTOM', color: '#6b7280' },
};

export function AnnotationOverlay({ pageNumber, width, height, scale }: AnnotationOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const {
    currentTool,
    currentColor,
    strokeWidth,
    stampType,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    selectedAnnotationId,
    setCurrentTool,
    getAnnotationsByPage,
  } = useAnnotationStore();

  const annotations = getAnnotationsByPage(pageNumber);

  // Convert screen coords to PDF coords
  const screenToPage = useCallback((screenX: number, screenY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left) / scale,
      y: (screenY - rect.top) / scale,
    };
  }, [scale]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if we clicked on an existing annotation (it will have stopPropagation)
    const target = e.target as SVGElement;
    if (target.tagName === 'rect' || target.tagName === 'path' || target.classList.contains('annotation-element')) {
      return; // Don't create new annotation if clicking on existing one
    }
    
    if (currentTool === 'select') return;
    
    const { x, y } = screenToPage(e.clientX, e.clientY);
    
    if (currentTool === 'pen') {
      setIsDrawing(true);
      setDrawingPoints([{ x, y }]);
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(currentTool)) {
      setDragStart({ x, y });
      setCurrentShape({ x, y, width: 0, height: 0 });
    } else if (currentTool === 'sticky-note') {
      const note: StickyNoteAnnotation = {
        id: '',
        type: 'sticky-note',
        pageNumber,
        x,
        y,
        content: '',
        isExpanded: false,
        color: currentColor,
        createdAt: '',
        updatedAt: '',
      };
      addAnnotation(note);
      // Auto-select the newly created note
      setCurrentTool('select');
    } else if (currentTool === 'stamp') {
      const stamp: StampAnnotation = {
        id: '',
        type: 'stamp',
        pageNumber,
        x,
        y,
        stampType,
        scale: 1,
        rotation: 0,
        color: STAMP_LABELS[stampType]?.color || currentColor,
        createdAt: '',
        updatedAt: '',
      };
      addAnnotation(stamp);
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing && !dragStart) return;
    
    const { x, y } = screenToPage(e.clientX, e.clientY);
    
    if (isDrawing && currentTool === 'pen') {
      setDrawingPoints((prev) => [...prev, { x, y }]);
    } else if (dragStart && ['rectangle', 'circle', 'line', 'arrow'].includes(currentTool)) {
      setCurrentShape({
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width: Math.abs(x - dragStart.x),
        height: Math.abs(y - dragStart.y),
      });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isDrawing && currentTool === 'pen' && drawingPoints.length > 1) {
      const drawing: DrawingAnnotation = {
        id: '',
        type: 'drawing',
        tool: 'pen',
        pageNumber,
        points: drawingPoints,
        strokeWidth,
        color: currentColor,
        createdAt: '',
        updatedAt: '',
      };
      addAnnotation(drawing);
    } else if (dragStart && currentShape && ['rectangle', 'circle', 'line', 'arrow'].includes(currentTool)) {
      if (currentShape.width > 5 || currentShape.height > 5) {
        const drawing: DrawingAnnotation = {
          id: '',
          type: 'drawing',
          tool: currentTool as 'rectangle' | 'circle' | 'line' | 'arrow',
          pageNumber,
          points: [
            { x: dragStart.x, y: dragStart.y },
            { x: dragStart.x + (currentShape.width || 0), y: dragStart.y + (currentShape.height || 0) },
          ],
          strokeWidth,
          color: currentColor,
          createdAt: '',
          updatedAt: '',
        };
        addAnnotation(drawing);
      }
    }
    
    setIsDrawing(false);
    setDrawingPoints([]);
    setDragStart(null);
    setCurrentShape(null);
  };

  // Render highlight
  const renderHighlight = (ann: HighlightAnnotation) => (
    <g key={ann.id} onClick={() => selectAnnotation(ann.id)}>
      {ann.rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x * scale}
          y={rect.y * scale}
          width={rect.width * scale}
          height={rect.height * scale}
          fill={ann.color}
          fillOpacity={0.35}
          className="cursor-pointer hover:fill-opacity-50"
        />
      ))}
    </g>
  );

  // Render sticky note
  const renderStickyNote = (ann: StickyNoteAnnotation) => {
    // Calculate popup position - flip to left if too close to right edge
    const noteX = ann.x * scale;
    const noteY = ann.y * scale;
    const popupWidth = 220;
    const popupHeight = 130;
    
    // Check if popup would go off the right edge
    const flipToLeft = (noteX + 30 + popupWidth) > width;
    const popupX = flipToLeft ? noteX - popupWidth - 10 : noteX + 30;
    
    // Check if popup would go off the bottom edge
    const flipToTop = (noteY + popupHeight) > height;
    const popupY = flipToTop ? Math.max(0, noteY - popupHeight + 24) : noteY;

    return (
      <g key={ann.id}>
        <rect
          x={noteX}
          y={noteY}
          width={24}
          height={24}
          fill={ann.color}
          rx={4}
          className="cursor-pointer drop-shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            selectAnnotation(ann.id);
          }}
          style={{ pointerEvents: 'all' }}
        />
        <text
          x={noteX + 12}
          y={noteY + 16}
          textAnchor="middle"
          fontSize={16}
          className="pointer-events-none"
        >
          💬
        </text>
        {selectedAnnotationId === ann.id && (
          <foreignObject
            x={popupX}
            y={popupY}
            width={popupWidth}
            height={popupHeight}
            style={{ overflow: 'visible' }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3" style={{ width: popupWidth - 10 }}>
              <textarea
                value={ann.content}
                onChange={(e) => updateAnnotation(ann.id, { content: e.target.value })}
                placeholder="Tulis catatan di sini..."
                className="w-full h-20 text-sm resize-none border border-gray-200 dark:border-gray-600 rounded p-2 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">Page {ann.pageNumber}</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded dark:bg-red-900/30 dark:text-red-400"
                  >
                    🗑 Delete
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); selectAnnotation(null); }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 rounded dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    ✓ Done
                  </button>
                </div>
              </div>
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  // Render drawing
  const renderDrawing = (ann: DrawingAnnotation) => {
    const isSelected = selectedAnnotationId === ann.id;
    
    if (ann.tool === 'pen' && ann.points.length > 1) {
      const pathData = ann.points.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${p.x * scale} ${p.y * scale}`
      ).join(' ');
      
      return (
        <path
          key={ann.id}
          d={pathData}
          stroke={ann.color}
          strokeWidth={ann.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`cursor-pointer ${isSelected ? 'stroke-[3]' : ''}`}
          onClick={() => selectAnnotation(ann.id)}
        />
      );
    }
    
    if (ann.points.length === 2) {
      const [p1, p2] = ann.points;
      const x = Math.min(p1.x, p2.x) * scale;
      const y = Math.min(p1.y, p2.y) * scale;
      const w = Math.abs(p2.x - p1.x) * scale;
      const h = Math.abs(p2.y - p1.y) * scale;
      
      switch (ann.tool) {
        case 'rectangle':
          return (
            <rect
              key={ann.id}
              x={x}
              y={y}
              width={w}
              height={h}
              stroke={ann.color}
              strokeWidth={ann.strokeWidth}
              fill="none"
              className={`cursor-pointer ${isSelected ? 'stroke-[3]' : ''}`}
              onClick={() => selectAnnotation(ann.id)}
            />
          );
        case 'circle':
          return (
            <ellipse
              key={ann.id}
              cx={x + w / 2}
              cy={y + h / 2}
              rx={w / 2}
              ry={h / 2}
              stroke={ann.color}
              strokeWidth={ann.strokeWidth}
              fill="none"
              className={`cursor-pointer ${isSelected ? 'stroke-[3]' : ''}`}
              onClick={() => selectAnnotation(ann.id)}
            />
          );
        case 'line':
        case 'arrow':
          return (
            <g key={ann.id} onClick={() => selectAnnotation(ann.id)}>
              <line
                x1={p1.x * scale}
                y1={p1.y * scale}
                x2={p2.x * scale}
                y2={p2.y * scale}
                stroke={ann.color}
                strokeWidth={ann.strokeWidth}
                className={`cursor-pointer ${isSelected ? 'stroke-[3]' : ''}`}
              />
              {ann.tool === 'arrow' && (
                <polygon
                  points={`0,-5 10,0 0,5`}
                  fill={ann.color}
                  transform={`translate(${p2.x * scale}, ${p2.y * scale}) rotate(${Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI})`}
                />
              )}
            </g>
          );
      }
    }
    return null;
  };

  // Render stamp
  const renderStamp = (ann: StampAnnotation) => {
    const label = STAMP_LABELS[ann.stampType] || STAMP_LABELS.custom;
    const text = ann.customText || label.text;
    
    return (
      <g
        key={ann.id}
        onClick={() => selectAnnotation(ann.id)}
        transform={`translate(${ann.x * scale}, ${ann.y * scale}) rotate(${ann.rotation})`}
        className="cursor-pointer"
      >
        <rect
          x={-5}
          y={-20}
          width={text.length * 12 + 20}
          height={32}
          fill="transparent"
          stroke={ann.color}
          strokeWidth={3}
          rx={4}
        />
        <text
          x={text.length * 6 + 5}
          y={0}
          textAnchor="middle"
          fill={ann.color}
          fontSize={16}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {text}
        </text>
      </g>
    );
  };

  // Render current drawing in progress
  const renderCurrentDrawing = () => {
    if (isDrawing && drawingPoints.length > 1) {
      const pathData = drawingPoints.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${p.x * scale} ${p.y * scale}`
      ).join(' ');
      
      return (
        <path
          d={pathData}
          stroke={currentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      );
    }
    
    if (dragStart && currentShape) {
      const x = currentShape.x * scale;
      const y = currentShape.y * scale;
      const w = currentShape.width * scale;
      const h = currentShape.height * scale;
      
      switch (currentTool) {
        case 'rectangle':
          return <rect x={x} y={y} width={w} height={h} stroke={currentColor} strokeWidth={strokeWidth} fill="none" opacity={0.7} />;
        case 'circle':
          return <ellipse cx={x + w/2} cy={y + h/2} rx={w/2} ry={h/2} stroke={currentColor} strokeWidth={strokeWidth} fill="none" opacity={0.7} />;
        case 'line':
        case 'arrow':
          return <line x1={dragStart.x * scale} y1={dragStart.y * scale} x2={(dragStart.x + currentShape.width) * scale} y2={(dragStart.y + currentShape.height) * scale} stroke={currentColor} strokeWidth={strokeWidth} opacity={0.7} />;
      }
    }
    
    return null;
  };

  // Render each annotation
  const renderAnnotation = (ann: Annotation) => {
    switch (ann.type) {
      case 'highlight':
        return renderHighlight(ann);
      case 'sticky-note':
        return renderStickyNote(ann);
      case 'drawing':
        return renderDrawing(ann);
      case 'stamp':
        return renderStamp(ann);
      default:
        return null;
    }
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="absolute inset-0 z-10"
      style={{ cursor: currentTool === 'select' ? 'default' : 'crosshair', overflow: 'visible' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render existing annotations */}
      {annotations.map(renderAnnotation)}
      
      {/* Render current drawing in progress */}
      {renderCurrentDrawing()}

      {/* Delete button for selected annotation */}
      {selectedAnnotationId && (
        <foreignObject x={width - 80} y={10} width={70} height={30}>
          <button
            onClick={() => deleteAnnotation(selectedAnnotationId)}
            className="w-full h-full text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            🗑 Delete
          </button>
        </foreignObject>
      )}
    </svg>
  );
}
