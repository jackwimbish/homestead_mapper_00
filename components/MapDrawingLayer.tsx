'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Source, Layer } from 'react-map-gl'
import type { MapRef, MapMouseEvent } from 'react-map-gl'
import { MapObject, ObjectType, TOOL_CONFIGS } from '@/types/map'
import { generateIcon, ICON_CONFIG } from '@/lib/mapIcons'

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
  const dragStartRef = useRef<{ id: string; startLng: number; startLat: number } | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Load icons into the map
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const loadIcons = () => {
      Object.entries(ICON_CONFIG).forEach(([type, config]) => {
        if (!map.hasImage(type)) {
          try {
            const canvas = generateIcon(config.emoji, config.color)
            const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
            map.addImage(type, imageData)
          } catch (error) {
            console.error(`Failed to create icon ${type}:`, error)
          }
        }
      })
    }

    if (map.loaded()) {
      loadIcons()
    } else {
      map.on('load', loadIcons)
    }
  }, [mapRef])

  // Handle map interactions
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const handleMapClick = (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat

      // Check if we clicked on a point feature
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-points-layer']
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
        layers: ['drawing-points-layer', 'drawing-lines-layer']
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
        const draggedObject = objects.find(obj => obj.id === dragStartRef.current?.id)
        
        if (draggedObject && draggedObject.type === 'point') {
          setObjects(objects.map(obj => 
            obj.id === dragStartRef.current?.id 
              ? { ...obj, coordinates: [lng, lat] }
              : obj
          ))
        }
      }
    }

    const handleMouseDown = (e: MapMouseEvent) => {
      if (activeTool !== 'select') return

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-points-layer']
      })

      if (features.length > 0) {
        const feature = features[0]
        const id = feature.properties?.id
        const { lng, lat } = e.lngLat
        
        setIsDragging(true)
        dragStartRef.current = { id, startLng: lng, startLat: lat }
        setSelectedId(id)
        e.preventDefault()
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

  // Prepare GeoJSON for points
  const pointFeatures = objects
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

  const pointGeoJson = {
    type: 'FeatureCollection' as const,
    features: pointFeatures
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
      {/* Lines layer (swales) */}
      <Source id="drawing-lines" type="geojson" data={lineGeoJson}>
        <Layer
          id="drawing-lines-layer"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              12, 2,
              16, 4,
              20, 8
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
              ['exponential', 2],
              ['zoom'],
              12, 4,
              16, 8,
              20, 16
            ],
            'line-opacity': 0.3
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round'
          }}
        />
      </Source>

      {/* Points layer */}
      <Source id="drawing-points" type="geojson" data={pointGeoJson}>
        <Layer
          id="drawing-points-layer"
          type="symbol"
          layout={{
            'icon-image': ['get', 'objectType'],
            'icon-size': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              12, 0.3,
              16, 0.6,
              18, 1,
              20, 1.5
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-anchor': 'center'
          }}
          paint={{
            'icon-opacity': ['case',
              ['==', ['get', 'id'], hoveredId],
              1,
              ['==', ['get', 'id'], selectedId],
              1,
              0.9
            ],
            'icon-halo-color': ['case',
              ['==', ['get', 'id'], selectedId],
              '#0000FF',
              ['==', ['get', 'id'], hoveredId],
              activeTool === 'delete' ? '#FF0000' : '#4444FF',
              '#FFFFFF'
            ],
            'icon-halo-width': ['case',
              ['==', ['get', 'id'], selectedId],
              3,
              ['==', ['get', 'id'], hoveredId],
              2,
              0
            ],
            'icon-halo-blur': 1
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