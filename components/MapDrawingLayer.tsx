'use client'

import { useState, useEffect, useRef } from 'react'
import { Source, Layer } from 'react-map-gl'
import type { MapRef, MapMouseEvent } from 'react-map-gl'
import { MapObject, ObjectType, TOOL_CONFIGS } from '@/types/map'
import { getPolygonForObject } from '@/lib/polygonUtils'

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
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ id: string; startLng: number; startLat: number; originalCoords: [number, number] } | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isRotating, setIsRotating] = useState(false)

  // Handle map interactions
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const handleMapClick = (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat

      // Check if we clicked on a polygon feature
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-polygons-fill']
      })

      if (features.length > 0) {
        const feature = features[0]
        const id = feature.properties?.id

        if (activeTool === 'delete') {
          // Delete the object
          setObjects(objects.filter(obj => obj.id !== id))
          setSelectedId(null)
        } else if (activeTool === 'select') {
          // Select the object
          setSelectedId(id)
        }
        return
      }

      // Check if we clicked on a line feature
      const lineFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-lines-layer']
      })

      if (lineFeatures.length > 0 && activeTool === 'delete') {
        const feature = lineFeatures[0]
        const id = feature.properties?.id
        setObjects(objects.filter(obj => obj.id !== id))
        setSelectedId(null)
        return
      }

      // Handle empty space clicks
      if (!activeTool || activeTool === 'select' || activeTool === 'delete') {
        setSelectedId(null)
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
        // Start or continue drawing a line
        if (!isDrawingLine) {
          setIsDrawingLine(true)
          setCurrentLine([[lng, lat]])
        } else {
          setCurrentLine([...currentLine, [lng, lat]])
        }
      }
    }

    const handleMouseMove = (e: MapMouseEvent) => {
      // Handle hover effects
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-polygons-fill', 'drawing-lines-layer']
      })

      if (features.length > 0) {
        const id = features[0].properties?.id
        setHoveredId(id)
        map.getCanvas().style.cursor = 
          activeTool === 'delete' ? 'pointer' : 
          activeTool === 'select' ? 'move' : 
          'pointer'
      } else {
        setHoveredId(null)
        map.getCanvas().style.cursor = 
          activeTool && activeTool !== 'select' && activeTool !== 'delete' 
            ? 'crosshair' 
            : 'default'
      }

      // Handle dragging
      if (isDragging && dragStartRef.current && activeTool === 'select') {
        const { lng, lat } = e.lngLat
        const deltaLng = lng - dragStartRef.current.startLng
        const deltaLat = lat - dragStartRef.current.startLat
        
        setObjects(objects.map(obj => 
          obj.id === dragStartRef.current?.id 
            ? { 
                ...obj, 
                coordinates: [
                  dragStartRef.current.originalCoords[0] + deltaLng,
                  dragStartRef.current.originalCoords[1] + deltaLat
                ] as [number, number]
              }
            : obj
        ))
      }
    }

    const handleMouseDown = (e: MapMouseEvent) => {
      if (activeTool !== 'select') return

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-polygons-fill']
      })

      if (features.length > 0) {
        const feature = features[0]
        const id = feature.properties?.id
        const { lng, lat } = e.lngLat
        
        const obj = objects.find(o => o.id === id)
        if (obj && obj.type === 'point') {
          setIsDragging(true)
          dragStartRef.current = { 
            id, 
            startLng: lng, 
            startLat: lat,
            originalCoords: obj.coordinates as [number, number]
          }
          setSelectedId(id)
          e.preventDefault()
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
    }

    const handleDoubleClick = (e: MapMouseEvent) => {
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
        e.preventDefault()
      }
    }

    map.on('click', handleMapClick)
    map.on('mousemove', handleMouseMove)
    map.on('mousedown', handleMouseDown)
    map.on('mouseup', handleMouseUp)
    map.on('dblclick', handleDoubleClick)

    return () => {
      map.off('click', handleMapClick)
      map.off('mousemove', handleMouseMove)
      map.off('mousedown', handleMouseDown)
      map.off('mouseup', handleMouseUp)
      map.off('dblclick', handleDoubleClick)
    }
  }, [mapRef, activeTool, objects, setObjects, isDrawingLine, currentLine, isDragging, selectedId])

  // Handle keyboard controls for rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || activeTool !== 'select') return
      
      const selectedObj = objects.find(obj => obj.id === selectedId)
      if (!selectedObj || selectedObj.type !== 'point') return
      
      // Check if it's a rotatable object (rectangles and squares)
      const rotatableTypes = ['chicken_coop', 'garden_bed', 'greenhouse', 'compost']
      if (!rotatableTypes.includes(selectedObj.properties.objectType)) return
      
      let rotationDelta = 0
      
      if (e.key === 'r' || e.key === 'R') {
        // R key: rotate 45 degrees clockwise
        rotationDelta = 45
      } else if (e.key === 'e' || e.key === 'E') {
        // E key: rotate 45 degrees counter-clockwise
        rotationDelta = -45
      } else if (e.key === 'ArrowLeft') {
        // Left arrow: rotate 15 degrees counter-clockwise
        rotationDelta = -15
      } else if (e.key === 'ArrowRight') {
        // Right arrow: rotate 15 degrees clockwise
        rotationDelta = 15
      }
      
      if (rotationDelta !== 0) {
        e.preventDefault()
        setObjects(objects.map(obj => 
          obj.id === selectedId
            ? { 
                ...obj, 
                rotation: ((obj.rotation || 0) + rotationDelta + 360) % 360
              }
            : obj
        ))
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, activeTool, objects, setObjects])

  // Convert point objects to polygon features
  const polygonFeatures = objects
    .filter(obj => obj.type === 'point')
    .map(obj => {
      const polygonCoords = getPolygonForObject(
        obj.properties.objectType,
        obj.coordinates as [number, number],
        obj.rotation
      )
      
      return {
        type: 'Feature' as const,
        properties: {
          id: obj.id,
          ...obj.properties
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polygonCoords]
        }
      }
    })

  const polygonGeoJson = {
    type: 'FeatureCollection' as const,
    features: polygonFeatures
  }

  // Label points for emoji display
  const labelFeatures = objects
    .filter(obj => obj.type === 'point')
    .map(obj => ({
      type: 'Feature' as const,
      properties: {
        id: obj.id,
        ...obj.properties
      },
      geometry: {
        type: 'Point' as const,
        coordinates: obj.coordinates as [number, number]
      }
    }))

  const labelGeoJson = {
    type: 'FeatureCollection' as const,
    features: labelFeatures
  }

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

  // Add current drawing line if active
  if (isDrawingLine && currentLine.length > 0) {
    lineFeatures.push({
      type: 'Feature' as const,
      properties: {
        id: 'drawing-line',
        objectType: 'swale',
        color: TOOL_CONFIGS.swale.color,
        icon: TOOL_CONFIGS.swale.icon,
        name: 'Drawing...'
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: currentLine
      }
    })
  }

  const lineGeoJson = {
    type: 'FeatureCollection' as const,
    features: lineFeatures
  }

  return (
    <>
      {/* Polygon fill layer for point objects */}
      <Source id="drawing-polygons" type="geojson" data={polygonGeoJson}>
        <Layer
          id="drawing-polygons-fill"
          type="fill"
          paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': ['case',
              ['==', ['get', 'id'], hoveredId],
              0.7,
              ['==', ['get', 'id'], selectedId],
              0.7,
              0.5
            ]
          }}
        />
        <Layer
          id="drawing-polygons-outline"
          type="line"
          paint={{
            'line-color': ['case',
              ['==', ['get', 'id'], selectedId],
              '#0000FF',
              ['==', ['get', 'id'], hoveredId],
              activeTool === 'delete' ? '#FF0000' : '#4444FF',
              '#FFFFFF'
            ],
            'line-width': ['case',
              ['==', ['get', 'id'], selectedId],
              3,
              ['==', ['get', 'id'], hoveredId],
              2,
              1
            ],
            'line-opacity': ['case',
              ['==', ['get', 'id'], selectedId],
              1,
              ['==', ['get', 'id'], hoveredId],
              1,
              0.5
            ]
          }}
        />
      </Source>

      {/* Labels for polygon objects */}
      <Source id="drawing-labels" type="geojson" data={labelGeoJson}>
        <Layer
          id="drawing-labels-layer"
          type="symbol"
          layout={{
            'text-field': ['get', 'icon'],
            'text-size': [
              'interpolate',
              ['exponential', 1.5],
              ['zoom'],
              10, 12,
              20, 32
            ],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': 'center'
          }}
          paint={{
            'text-color': '#FFFFFF',
            'text-halo-color': '#000000',
            'text-halo-width': 1,
            'text-halo-blur': 1
          }}
        />
      </Source>

      {/* Lines layer (swales) */}
      <Source id="drawing-lines" type="geojson" data={lineGeoJson}>
        <Layer
          id="drawing-lines-layer"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': [
              'interpolate',
              ['exponential', 1.5],
              ['zoom'],
              10, 1,
              20, 6
            ],
            'line-opacity': ['case',
              ['==', ['get', 'id'], 'drawing-line'],
              0.6,
              ['==', ['get', 'id'], hoveredId],
              1,
              ['==', ['get', 'id'], selectedId],
              1,
              0.8
            ]
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round'
          }}
        />
        {/* Selection highlight for lines */}
        <Layer
          id="drawing-lines-selected"
          type="line"
          filter={['==', ['get', 'id'], selectedId || '']}
          paint={{
            'line-color': '#0000FF',
            'line-width': [
              'interpolate',
              ['exponential', 1.5],
              ['zoom'],
              10, 2,
              20, 12
            ],
            'line-opacity': 0.3
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round'
          }}
        />
      </Source>

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
            • Drag the map to pan around<br/>
            {(() => {
              const selectedObj = objects.find(obj => obj.id === selectedId)
              const rotatableTypes = ['chicken_coop', 'garden_bed', 'greenhouse', 'compost']
              if (selectedObj && rotatableTypes.includes(selectedObj.properties.objectType)) {
                return (
                  <>
                    <br/>
                    <span className="text-blue-800 font-semibold">Rotation Controls:</span><br/>
                    • Press R: Rotate 45° clockwise<br/>
                    • Press E: Rotate 45° counter-clockwise<br/>
                    • Arrow keys: Fine rotation (15°)<br/>
                    {selectedObj.rotation && (
                      <span className="text-blue-600">Current: {Math.round(selectedObj.rotation)}°</span>
                    )}
                  </>
                )
              }
              return null
            })()}
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