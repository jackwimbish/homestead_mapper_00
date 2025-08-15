import { MapObject } from '@/types/map'

interface InstructionOverlayProps {
  activeTool: string | null
  isDrawingLine: boolean
  selectedId: string | null
  objects: MapObject[]
}

const ROTATABLE_TYPES = ['chicken_coop', 'garden_bed', 'greenhouse', 'compost']

export default function InstructionOverlay({ 
  activeTool, 
  isDrawingLine, 
  selectedId,
  objects 
}: InstructionOverlayProps) {
  
  if (activeTool === 'delete') {
    return (
      <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg pointer-events-none z-10">
        <p className="text-sm font-medium">Click on any item to delete it</p>
      </div>
    )
  }
  
  if (activeTool === 'select') {
    const selectedObj = objects.find(obj => obj.id === selectedId)
    const isRotatable = selectedObj && ROTATABLE_TYPES.includes(selectedObj.properties.objectType)
    
    return (
      <div className="absolute top-4 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg pointer-events-none z-10">
        <p className="text-sm font-medium">
          • Click and drag items to move them<br/>
          • Drag the map to pan around
          {isRotatable && (
            <>
              <br/><br/>
              <span className="text-blue-800 font-semibold">Rotation Controls:</span><br/>
              • Press R: Rotate 45° clockwise<br/>
              • Press E: Rotate 45° counter-clockwise<br/>
              • Arrow keys: Fine rotation (15°)
              {selectedObj.rotation && (
                <><br/>
                <span className="text-blue-600">Current: {Math.round(selectedObj.rotation)}°</span>
                </>
              )}
            </>
          )}
        </p>
      </div>
    )
  }
  
  if (activeTool === 'swale') {
    return (
      <div className="absolute top-4 left-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg pointer-events-none z-10">
        <p className="text-sm font-medium">
          {isDrawingLine 
            ? '• Click to add points\n• Double-click to finish' 
            : 'Click to start drawing a swale'
          }
        </p>
      </div>
    )
  }
  
  return null
}