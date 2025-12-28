/**
 * Annotation Toolbar
 * Tool selection, color picker, and annotation controls
 */

import { useAnnotationStore, AnnotationTool, StampAnnotation } from '../../store/annotation-store';

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Purple', value: '#9C27B0' },
];

const STAMP_PRESETS: Array<{ type: StampAnnotation['stampType']; label: string; icon: string }> = [
  { type: 'approved', label: 'Approved', icon: '✓' },
  { type: 'rejected', label: 'Rejected', icon: '✗' },
  { type: 'draft', label: 'Draft', icon: '📝' },
  { type: 'confidential', label: 'Confidential', icon: '🔒' },
  { type: 'reviewed', label: 'Reviewed', icon: '👁' },
];

interface ToolButtonProps {
  tool: AnnotationTool;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
    </button>
  );
}

export function AnnotationToolbar() {
  const {
    currentTool,
    currentColor,
    strokeWidth,
    stampType,
    setCurrentTool,
    setCurrentColor,
    setStrokeWidth,
    setStampType,
    undo,
    redo,
    canUndo,
    canRedo,
    annotations,
    clearAnnotations,
  } = useAnnotationStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Selection Tool */}
      <ToolButton
        tool="select"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        }
        label="Select"
        isActive={currentTool === 'select'}
        onClick={() => setCurrentTool('select')}
      />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Highlight Tool - DISABLED: Text layer causes visual artifacts */}
      {/* <ToolButton
        tool="highlight"
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.243 4.515l4.243 4.243-9.9 9.9-4.243-4.243 9.9-9.9zm-3.535 12.728L4.465 10l1.414-1.414 7.243 7.243-1.414 1.414zm8.486-11.314l-1.414 1.414-4.243-4.243 1.414-1.414 4.243 4.243z"/>
          </svg>
        }
        label="Highlight"
        isActive={currentTool === 'highlight'}
        onClick={() => setCurrentTool('highlight')}
      /> */}

      {/* Sticky Note */}
      <ToolButton
        tool="sticky-note"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        }
        label="Sticky Note"
        isActive={currentTool === 'sticky-note'}
        onClick={() => setCurrentTool('sticky-note')}
      />

      {/* Pen Tool */}
      <ToolButton
        tool="pen"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
        label="Pen"
        isActive={currentTool === 'pen'}
        onClick={() => setCurrentTool('pen')}
      />

      {/* Shapes Dropdown */}
      <div className="relative group">
        <ToolButton
          tool="rectangle"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            </svg>
          }
          label="Shapes"
          isActive={['rectangle', 'circle', 'line', 'arrow'].includes(currentTool)}
          onClick={() => setCurrentTool('rectangle')}
        />
        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[120px]">
          <button onClick={() => setCurrentTool('rectangle')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" strokeWidth={2} /></svg>
            Rectangle
          </button>
          <button onClick={() => setCurrentTool('circle')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" strokeWidth={2} /></svg>
            Circle
          </button>
          <button onClick={() => setCurrentTool('line')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" strokeWidth={2} /></svg>
            Line
          </button>
          <button onClick={() => setCurrentTool('arrow')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
            Arrow
          </button>
        </div>
      </div>

      {/* Stamp Tool */}
      <div className="relative group">
        <ToolButton
          tool="stamp"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          label="Stamp"
          isActive={currentTool === 'stamp'}
          onClick={() => setCurrentTool('stamp')}
        />
        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[140px]">
          {STAMP_PRESETS.map((stamp) => (
            <button
              key={stamp.type}
              onClick={() => {
                setStampType(stamp.type);
                setCurrentTool('stamp');
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                stampType === stamp.type && currentTool === 'stamp' ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
            >
              <span>{stamp.icon}</span>
              {stamp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Color Picker */}
      <div className="flex items-center gap-1">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setCurrentColor(color.value)}
            title={color.name}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              currentColor === color.value
                ? 'border-gray-800 dark:border-white scale-110'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Stroke Width */}
      {(currentTool === 'pen' || ['rectangle', 'circle', 'line', 'arrow'].includes(currentTool)) && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Width:</span>
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="text-xs p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((w) => (
                <option key={w} value={w}>{w}px</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        </>
      )}

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
        className={`p-2 rounded-lg transition-colors ${
          canUndo()
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            : 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <button
        onClick={redo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Y)"
        className={`p-2 rounded-lg transition-colors ${
          canRedo()
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            : 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      {/* Clear All */}
      {annotations.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={() => {
              if (confirm('Delete all annotations?')) {
                clearAnnotations();
              }
            }}
            title="Clear all annotations"
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}

      {/* Annotation Count */}
      {annotations.length > 0 && (
        <span className="text-xs text-gray-500 ml-2">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
