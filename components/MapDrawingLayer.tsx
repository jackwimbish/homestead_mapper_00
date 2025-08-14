'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Marker, Source, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import { MapObject, ObjectType, TOOL_CONFIGS } from '@/types/map'

interface MapDrawingLayerProps {
  mapRef: React.RefObject<MapRef>
  activeTool: string | null
  objects: MapObject[]
  setObjects: (objects: MapObject[]) => void
}

export default function MapDrawingLayer({ 
  mapRef, 
  activeTool, 
  objects, 
  setObjects 
}: MapDrawingLayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [currentLine, setCurrentLine] = useState<[number, number][]>([])
  const drawingRef = useRef(false)

  // Handle map clicks for placing objects
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    const handleMapClick = (e: any) => {
      const { lng, lat } = e.lngLat

      // Handle different tool modes
      if (!activeTool || activeTool === 'select' || activeTool === 'delete') {
        // Click on empty space deselects
        if (activeTool === 'select') {
          setSelectedId(null)
        }
        return
      }

      const toolConfig = TOOL_CONFIGS[activeTool]
      if (!toolConfig || !toolConfig.drawType) return

      if (toolConfig.drawType === 'point') {
        // Place a point object
        const newObject: MapObject = {
          id: `object_${Date.now()}`,
          type: 'point',
          coordinates: [lng, lat],
          properties: {
            objectType: activeTool as ObjectType,
            color: toolConfig.color,
            icon: toolConfig.icon,
            name: toolConfig.name
          }
        }
        setObjects([...objects, newObject])
      } else if (toolConfig.drawType === 'line' && activeTool === 'swale') {
        // Start drawing a line
        if (!isDrawingLine) {
          setIsDrawingLine(true)
          setCurrentLine([[lng, lat]])
          drawingRef.current = true
        } else {
          // Add point to current line
          setCurrentLine([...currentLine, [lng, lat]])
        }
      }
    }

    const handleMouseMove = (e: any) => {
      if (isDrawingLine && currentLine.length > 0) {
        const { lng, lat } = e.lngLat
        // Update preview line
        const preview = [...currentLine.slice(0, -1), [lng, lat]]
        if (currentLine.length === preview.length) {
          setCurrentLine([...currentLine, [lng, lat]])
        }
      }
    }

    const handleDoubleClick = (e: any) => {
      if (isDrawingLine && currentLine.length > 1) {
        // Finish drawing the line
        const newObject: MapObject = {
          id: `object_${Date.now()}`,
          type: 'line',
          coordinates: currentLine,
          properties: {
            objectType: 'swale',
            color: TOOL_CONFIGS.swale.color,
            icon: TOOL_CONFIGS.swale.icon,
            name: TOOL_CONFIGS.swale.name
          }
        }
        setObjects([...objects, newObject])
        setIsDrawingLine(false)
        setCurrentLine([])
        drawingRef.current = false
        e.preventDefault()
      }
    }

    map.on('click', handleMapClick)
    map.on('mousemove', handleMouseMove)
    map.on('dblclick', handleDoubleClick)

    return () => {
      map.off('click', handleMapClick)
      map.off('mousemove', handleMouseMove)
      map.off('dblclick', handleDoubleClick)
    }
  }, [mapRef, activeTool, objects, setObjects, isDrawingLine, currentLine])

  // Handle marker drag
  const handleMarkerDrag = useCallback((id: string, lng: number, lat: number) => {
    setObjects(objects.map(obj => 
      obj.id === id 
        ? { ...obj, coordinates: [lng, lat] }
        : obj
    ))
  }, [objects, setObjects])

  // Handle object deletion
  const handleDelete = useCallback((id: string) => {
    if (activeTool === 'delete') {
      setObjects(objects.filter(obj => obj.id !== id))
      setSelectedId(null)
    }
  }, [activeTool, objects, setObjects])

  // Handle object selection
  const handleSelect = useCallback((id: string) => {
    if (activeTool === 'select') {
      setSelectedId(id)
    } else if (activeTool === 'delete') {
      handleDelete(id)
    }
  }, [activeTool, handleDelete])

  // Prepare GeoJSON for lines
  const lineFeatures = objects
    .filter(obj => obj.type === 'line')
    .map(obj => ({
      type: 'Feature' as const,
      properties: {
        id: obj.id,
        ...obj.properties
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: obj.coordinates as [number, number][]
      }
    }))

  // Add current drawing line to features if drawing
  if (isDrawingLine && currentLine.length > 0) {
    lineFeatures.push({
      type: 'Feature' as const,
      properties: {
        id: 'drawing-line',
        objectType: 'swale',
        color: TOOL_CONFIGS.swale.color,
        icon: TOOL_CONFIGS.swale.icon
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: currentLine
      }
    })
  }

  const geoJsonData = {
    type: 'FeatureCollection' as const,
    features: lineFeatures
  }

  return (
    <>
      {/* Render GeoJSON lines (swales) */}
      <Source id="drawing-lines" type="geojson" data={geoJsonData}>
        <Layer
          id="drawing-lines-layer"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': ['case',
              ['==', ['get', 'id'], selectedId],
              6,
              ['==', ['get', 'id'], 'drawing-line'],
              3,
              4
            ],
            'line-opacity': ['case',
              ['==', ['get', 'id'], 'drawing-line'],
              0.6,
              1
            ]
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round'
          }}
        />
      </Source>

      {/* Render point markers */}
      {objects
        .filter(obj => obj.type === 'point')
        .map(obj => (
          <Marker
            key={obj.id}
            longitude={obj.coordinates[0] as number}
            latitude={obj.coordinates[1] as number}
            draggable={activeTool === 'select'}
            onDragEnd={(e) => handleMarkerDrag(obj.id, e.lngLat.lng, e.lngLat.lat)}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              handleSelect(obj.id)
            }}
          >
            <div
              className={`
                flex items-center justify-center 
                w-12 h-12 rounded-full cursor-pointer
                transition-all transform hover:scale-110
                ${selectedId === obj.id && activeTool === 'select' 
                  ? 'ring-4 ring-blue-500 ring-opacity-50 scale-110' 
                  : ''
                }
                ${activeTool === 'delete' 
                  ? 'hover:ring-4 hover:ring-red-500 hover:ring-opacity-50' 
                  : ''
                }
              `}
              style={{
                backgroundColor: obj.properties.color,
                opacity: 0.8,
              }}
            >
              <span className="text-2xl select-none">
                {obj.properties.icon}
              </span>
            </div>
          </Marker>
        ))}

      {/* Instructions overlay */}
      {activeTool === 'delete' && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg pointer-events-none z-10">
          <p className="text-sm font-medium">Click on any item to delete it</p>
        </div>
      )}
      {activeTool === 'select' && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg pointer-events-none z-10">
          <p className="text-sm font-medium">
            • Click and drag items to move them<br/>
            • Drag the map to pan around
          </p>
        </div>
      )}
      {activeTool === 'swale' && (
        <div className="absolute top-4 left-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg pointer-events-none z-10">
          <p className="text-sm font-medium">
            {isDrawingLine 
              ? '• Click to add points\n• Double-click to finish' 
              : 'Click to start drawing a swale'
            }
          </p>
        </div>
      )}
    </>
  )
}