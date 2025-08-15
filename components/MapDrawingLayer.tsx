'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import { MapObject, TOOL_CONFIGS } from '@/types/map'
import { getPolygonForObject } from '@/lib/polygonUtils'
import { useInteractionState } from '@/hooks/useInteractionState'
import { useMapInteractions } from '@/hooks/useMapInteractions'
import { useKeyboardRotation } from '@/hooks/useKeyboardRotation'
import InstructionOverlay from './InstructionOverlay'
import HoverTooltip from './HoverTooltip'

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
  
  // Use the interaction state machine
  const {
    state: interactionState,
    startDrawing,
    updateDrawing,
    finishDrawing,
    startDrag,
    stopDrag,
    setSelected,
    setHovered,
    setMousePosition
  } = useInteractionState()
  
  // Set up map interactions
  useMapInteractions({
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
  })
  
  // Set up keyboard rotation controls
  useKeyboardRotation({
    selectedId: interactionState.selectedId,
    activeTool,
    objects,
    setObjects
  })
  
  // Memoize polygon GeoJSON conversion
  const polygonGeoJson = useMemo(() => {
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
    
    return {
      type: 'FeatureCollection' as const,
      features: polygonFeatures
    }
  }, [objects])
  
  // Memoize label GeoJSON
  const labelGeoJson = useMemo(() => {
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
    
    return {
      type: 'FeatureCollection' as const,
      features: labelFeatures
    }
  }, [objects])
  
  // Memoize line GeoJSON (including drawing line)
  const lineGeoJson = useMemo(() => {
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
    if (interactionState.mode === 'drawing_line' && 
        interactionState.drawingData?.currentLine && 
        interactionState.drawingData.currentLine.length > 0) {
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
          coordinates: interactionState.drawingData.currentLine
        }
      })
    }
    
    return {
      type: 'FeatureCollection' as const,
      features: lineFeatures
    }
  }, [objects, interactionState.mode, interactionState.drawingData])
  
  // Find hovered object for tooltip
  const hoveredObject = useMemo(() => 
    objects.find(obj => obj.id === interactionState.hoveredId),
    [objects, interactionState.hoveredId]
  )

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
              ['==', ['get', 'id'], interactionState.hoveredId],
              0.7,
              ['==', ['get', 'id'], interactionState.selectedId],
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
              ['==', ['get', 'id'], interactionState.selectedId],
              '#0000FF',
              ['==', ['get', 'id'], interactionState.hoveredId],
              activeTool === 'delete' ? '#FF0000' : '#4444FF',
              '#FFFFFF'
            ],
            'line-width': ['case',
              ['==', ['get', 'id'], interactionState.selectedId],
              3,
              ['==', ['get', 'id'], interactionState.hoveredId],
              2,
              1
            ],
            'line-opacity': ['case',
              ['==', ['get', 'id'], interactionState.selectedId],
              1,
              ['==', ['get', 'id'], interactionState.hoveredId],
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
              ['==', ['get', 'id'], interactionState.hoveredId],
              1,
              ['==', ['get', 'id'], interactionState.selectedId],
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
          filter={['==', ['get', 'id'], interactionState.selectedId || '']}
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

      {/* UI Overlays */}
      <InstructionOverlay 
        activeTool={activeTool}
        isDrawingLine={interactionState.mode === 'drawing_line'}
        selectedId={interactionState.selectedId}
        objects={objects}
      />
      
      <HoverTooltip
        hoveredObject={hoveredObject}
        mousePosition={interactionState.mousePosition}
        isDragging={interactionState.mode === 'dragging'}
      />
    </>
  )
}