'use client'

import { useEffect } from 'react'
import type { MapRef, MapMouseEvent } from 'react-map-gl'
import { MapObject, ObjectType, TOOL_CONFIGS } from '@/types/map'
import { InteractionState } from './useInteractionState'

interface UseMapInteractionsProps {
  mapRef: React.RefObject<MapRef>
  activeTool: string | null
  objects: MapObject[]
  setObjects: (objects: MapObject[]) => void
  interactionState: InteractionState
  startDrawing: () => void
  updateDrawing: (line: [number, number][]) => void
  finishDrawing: () => void
  startDrag: (data: any) => void
  stopDrag: () => void
  setSelected: (id: string | null) => void
  setHovered: (id: string | null) => void
  setMousePosition: (pos: { x: number; y: number } | null) => void
}

export function useMapInteractions({
  mapRef,
  activeTool,
  objects,
  setObjects,
  interactionState,
  startDrawing,
  updateDrawing,
  finishDrawing,
  startDrag,
  stopDrag,
  setSelected,
  setHovered,
  setMousePosition
}: UseMapInteractionsProps) {
  
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
          setObjects(objects.filter(obj => obj.id !== id))
          setSelected(null)
        } else if (activeTool === 'select') {
          setSelected(id)
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
        setSelected(null)
        return
      }

      // Handle empty space clicks
      if (!activeTool || activeTool === 'select' || activeTool === 'delete') {
        setSelected(null)
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
        if (interactionState.mode !== 'drawing_line') {
          startDrawing()
          updateDrawing([[lng, lat]])
        } else {
          const currentLine = interactionState.drawingData?.currentLine || []
          updateDrawing([...currentLine, [lng, lat]])
        }
      }
    }

    const handleMouseMove = (e: MapMouseEvent) => {
      setMousePosition({ x: e.point.x, y: e.point.y })
      
      // Handle hover effects
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['drawing-polygons-fill', 'drawing-lines-layer']
      })

      if (features.length > 0) {
        const id = features[0].properties?.id
        setHovered(id)
        map.getCanvas().style.cursor = 
          activeTool === 'delete' ? 'pointer' : 
          activeTool === 'select' ? 'move' : 
          'pointer'
      } else {
        setHovered(null)
        setMousePosition(null)
        map.getCanvas().style.cursor = 
          activeTool && activeTool !== 'select' && activeTool !== 'delete' 
            ? 'crosshair' 
            : 'default'
      }

      // Handle dragging
      if (interactionState.mode === 'dragging' && interactionState.dragData && activeTool === 'select') {
        const { lng, lat } = e.lngLat
        const { originalCoords, startLng, startLat, objectId } = interactionState.dragData
        const deltaLng = lng - startLng
        const deltaLat = lat - startLat
        
        setObjects(objects.map(obj => 
          obj.id === objectId 
            ? { 
                ...obj, 
                coordinates: [
                  originalCoords[0] + deltaLng,
                  originalCoords[1] + deltaLat
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
          startDrag({
            objectId: id,
            startLng: lng,
            startLat: lat,
            originalCoords: obj.coordinates as [number, number]
          })
          e.preventDefault()
        }
      }
    }

    const handleMouseUp = () => {
      if (interactionState.mode === 'dragging') {
        stopDrag()
      }
    }

    const handleDoubleClick = (e: MapMouseEvent) => {
      if (interactionState.mode === 'drawing_line' && interactionState.drawingData) {
        const currentLine = interactionState.drawingData.currentLine
        if (currentLine.length > 1) {
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
          finishDrawing()
          e.preventDefault()
        }
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
  }, [
    mapRef, 
    activeTool, 
    objects, 
    setObjects, 
    interactionState,
    startDrawing,
    updateDrawing,
    finishDrawing,
    startDrag,
    stopDrag,
    setSelected,
    setHovered,
    setMousePosition
  ])
}