import { MapObject } from '@/types/map'

interface HoverTooltipProps {
  hoveredObject: MapObject | undefined
  mousePosition: { x: number; y: number } | null
  isDragging: boolean
}

export default function HoverTooltip({ 
  hoveredObject, 
  mousePosition, 
  isDragging 
}: HoverTooltipProps) {
  
  if (!hoveredObject || !mousePosition || isDragging) {
    return null
  }
  
  const displayName = hoveredObject.properties.name || 
    hoveredObject.properties.objectType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  
  return (
    <div
      className="absolute bg-gray-900 text-white px-2 py-1 rounded-md shadow-lg pointer-events-none z-50 text-sm font-medium whitespace-nowrap"
      style={{
        left: `${mousePosition.x + 15}px`,
        top: `${mousePosition.y - 30}px`,
        animation: 'fadeIn 0.2s ease-in'
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-lg">{hoveredObject.properties.icon}</span>
        <span>{displayName}</span>
      </div>
      {hoveredObject.rotation !== undefined && hoveredObject.rotation !== 0 && (
        <div className="text-xs text-gray-300 mt-0.5">
          Rotation: {Math.round(hoveredObject.rotation)}°
        </div>
      )}
    </div>
  )
}