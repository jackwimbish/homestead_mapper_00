'use client'

interface DrawToolbarProps {
  activeTool: string
  onToolSelect: (tool: string) => void
  onPlantSelect: (size: number) => void
  onGroup: () => void
  onUngroup: () => void
  onDrag?: () => void
  onRotate?: () => void
  onStop?: () => void
  canGroup: boolean
  canUngroup: boolean
  canRotate?: boolean
  transformMode?: 'drag' | 'rotate' | null
}

export default function DrawToolbar({
  activeTool,
  onToolSelect,
  onPlantSelect,
  onGroup,
  onUngroup,
  onDrag,
  onRotate,
  onStop,
  canGroup,
  canUngroup,
  canRotate = true,
  transformMode
}: DrawToolbarProps) {
  return (
    <aside className="w-[280px] border-r border-gray-300 p-3 overflow-auto bg-[#faf8f4]">
      <h2 className="text-base font-semibold mb-2">Tools</h2>
      
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          <button
            data-tool="select"
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'select'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onToolSelect('select')}
          >
            Select
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            data-tool="line"
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'line'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onToolSelect('line')}
          >
            Line
          </button>
          <button
            data-tool="polygon"
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'polygon'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onToolSelect('polygon')}
          >
            Polygon
          </button>
          <button
            data-tool="rectangle"
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'rectangle'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onToolSelect('rectangle')}
          >
            Rectangle
          </button>
          <button
            data-tool="circle"
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'circle'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onToolSelect('circle')}
          >
            Circle
          </button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1.5">Plants (circles)</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'plant'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onPlantSelect(2)}
          >
            2 ft
          </button>
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'plant'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onPlantSelect(6)}
          >
            6 ft
          </button>
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              activeTool === 'plant'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => onPlantSelect(20)}
          >
            20 ft
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">Click map to place selected plant size.</p>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1.5">Edit</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              transformMode === 'drag'
                ? 'bg-[#365314] text-white border-[#365314]'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={onDrag}
          >
            Drag
          </button>
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              transformMode === 'rotate'
                ? 'bg-[#365314] text-white border-[#365314]'
                : canRotate
                  ? 'bg-white border-gray-400 hover:bg-gray-50'
                  : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
            }`}
            onClick={onRotate}
            disabled={!canRotate}
          >
            Rotate
          </button>
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              transformMode
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
            onClick={onStop}
            disabled={!transformMode}
          >
            Stop
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">Rotate disabled for a single circle (groups can rotate).</p>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1.5">Selection</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              canGroup
                ? 'bg-white border-gray-400 hover:bg-gray-50'
                : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
            }`}
            onClick={onGroup}
            disabled={!canGroup}
          >
            Group
          </button>
          <button
            className={`px-2.5 py-1.5 border rounded-md text-sm ${
              canUngroup
                ? 'bg-white border-gray-400 hover:bg-gray-50'
                : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
            }`}
            onClick={onUngroup}
            disabled={!canUngroup}
          >
            Ungroup
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Shift-click or box-drag to multi-select. Cmd/Ctrl+C / Cmd/Ctrl+V to copy/paste. Delete to remove.
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Cmd/Ctrl+drag to fill a rectangle area with selected shapes (grid, north-aligned).
        </p>
      </div>
    </aside>
  )
}