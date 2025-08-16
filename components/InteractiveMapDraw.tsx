'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Map as MapGL } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import DrawToolbar from './DrawToolbar'
import Inspector from './Inspector'

const FEET_PER_METER = 3.28084
const METERS_PER_FOOT = 0.3048

interface InteractiveMapDrawProps {
  coordinates: {
    lng: number
    lat: number
  }
}

interface TransformState {
  mode: 'drag' | 'rotate' | null
  startLngLat: any | null
  original: any | null
}

export default function InteractiveMapDraw({ coordinates }: InteractiveMapDrawProps) {
  const mapRef = useRef<MapRef>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([])
  const [plantSize, setPlantSize] = useState<number | null>(null)
  const [drawPhase, setDrawPhase] = useState<any>(null)
  const [groups, setGroups] = useState<any>(new Map())
  const [featureToGroup, setFeatureToGroup] = useState<any>(new Map())
  const [clipboard, setClipboard] = useState<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [transform, setTransform] = useState<TransformState>({ mode: null, startLngLat: null, original: null })
  const [dragSelect, setDragSelect] = useState<{
    active: boolean
    start: { x: number; y: number } | null
    rectEl: HTMLDivElement | null
  }>({ active: false, start: null, rectEl: null })
  const [mapHasFocus, setMapHasFocus] = useState(false)
  
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Street map style similar to editing-ui
  const mapStyle = {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxzoom: 20
      }
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#e6e6e6' } },
      { id: 'osm-tiles', type: 'raster', source: 'osm-tiles', minzoom: 0, maxzoom: 22 }
    ]
  }

  // Draw styles
  const drawStyles = [
    {
      id: 'gl-draw-polygon-fill',
      type: 'fill',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: { 'fill-color': '#63b3a9', 'fill-opacity': 0.1 }
    },
    {
      id: 'gl-draw-polygon-stroke',
      type: 'line',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: { 'line-color': '#0e6e66', 'line-width': 2 }
    },
    {
      id: 'gl-draw-line',
      type: 'line',
      filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
      paint: { 'line-color': '#4a5568', 'line-width': 2 }
    },
    {
      id: 'gl-draw-point',
      type: 'circle',
      filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['!=', 'mode', 'static']],
      paint: { 'circle-radius': 4, 'circle-color': '#ff6b6b' }
    },
    {
      id: 'gl-draw-vertex',
      type: 'circle',
      filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex'], ['!=', 'mode', 'static']],
      paint: { 'circle-radius': 4, 'circle-color': '#0ea5e9' }
    }
  ]

  const updateSelectedFeatures = useCallback(() => {
    if (!drawRef.current) return
    const selected = drawRef.current.getSelected()
    setSelectedFeatures(selected.features || [])
  }, [])

  // Initialize Draw control after map loads
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return
    
    const map = mapRef.current.getMap()
    
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      boxSelect: true,
      defaultMode: 'simple_select',
      styles: drawStyles as any,
    })
    
    map.addControl(draw as any)
    drawRef.current = draw

    // Event listeners
    const handleCreate = () => updateSelectedFeatures()
    const handleUpdate = () => updateSelectedFeatures()
    const handleDelete = () => updateSelectedFeatures()
    const handleSelection = () => updateSelectedFeatures()

    map.on('draw.create', handleCreate)
    map.on('draw.update', handleUpdate)
    map.on('draw.delete', handleDelete)
    map.on('draw.selectionchange', handleSelection)
    
    return () => {
      map.off('draw.create', handleCreate)
      map.off('draw.update', handleUpdate)
      map.off('draw.delete', handleDelete)
      map.off('draw.selectionchange', handleSelection)
      if (drawRef.current) {
        map.removeControl(draw as any)
      }
    }
  }, [isMapReady, updateSelectedFeatures])

  // Handle tool changes
  const handleToolSelect = useCallback((tool: string) => {
    if (!drawRef.current) return
    
    setActiveTool(tool)
    setDrawPhase(null)
    setTransform({ mode: null, startLngLat: null, original: null })
    
    switch (tool) {
      case 'select':
        drawRef.current.changeMode('simple_select')
        break
      case 'line':
        drawRef.current.changeMode('draw_line_string')
        break
      case 'polygon':
        drawRef.current.changeMode('draw_polygon')
        break
      case 'rectangle':
      case 'circle':
        drawRef.current.changeMode('simple_select')
        break
    }
  }, [])

  // Handle plant placement
  const handlePlantSelect = useCallback((size: number) => {
    setActiveTool('plant')
    setPlantSize(size)
    if (drawRef.current) {
      drawRef.current.changeMode('simple_select')
    }
  }, [])

  // Handle map clicks for custom tools
  const handleMapClick = useCallback((e: any) => {
    if (!drawRef.current || !mapRef.current) return
    
    const lngLat = e.lngLat
    
    // Plant placement
    if (activeTool === 'plant' && plantSize) {
      const radiusM = (plantSize * METERS_PER_FOOT) / 2
      const center = [lngLat.lng, lngLat.lat]
      const circlePoly = turf.circle(center, radiusM, { steps: 32, units: 'meters' })
      
      drawRef.current.add({
        type: 'Feature',
        properties: {
          name: `plant-${plantSize}ft`,
          eeType: 'plant',
          eeShape: 'circle',
          eeDiameterFt: plantSize
        },
        geometry: circlePoly.geometry
      })
      return
    }
    
    // Rectangle tool
    if (activeTool === 'rectangle') {
      if (!drawPhase) {
        setDrawPhase({ type: 'rectangle', step: 1, start: lngLat })
      } else if (drawPhase.type === 'rectangle') {
        const start = drawPhase.start
        const end = lngLat
        
        const minLng = Math.min(start.lng, end.lng)
        const maxLng = Math.max(start.lng, end.lng)
        const minLat = Math.min(start.lat, end.lat)
        const maxLat = Math.max(start.lat, end.lat)
        
        const rectangle = {
          type: 'Feature',
          properties: { name: 'rectangle', eeShape: 'rectangle' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat]
            ]]
          }
        }
        
        drawRef.current.add(rectangle)
        setDrawPhase(null)
      }
      return
    }
    
    // Circle tool
    if (activeTool === 'circle') {
      if (!drawPhase) {
        setDrawPhase({ type: 'circle', step: 1, start: lngLat })
      } else if (drawPhase.type === 'circle') {
        const center = drawPhase.start
        const edge = lngLat
        
        const distance = turf.distance(
          turf.point([center.lng, center.lat]),
          turf.point([edge.lng, edge.lat]),
          { units: 'meters' }
        )
        
        const circlePoly = turf.circle([center.lng, center.lat], distance, { steps: 32, units: 'meters' })
        const diameterFt = (distance * 2) * FEET_PER_METER
        
        drawRef.current.add({
          type: 'Feature',
          properties: {
            name: 'circle',
            eeShape: 'circle',
            eeDiameterFt: diameterFt
          },
          geometry: circlePoly.geometry
        })
        
        setDrawPhase(null)
      }
    }
  }, [activeTool, plantSize, drawPhase])

  // Capture original features for transform
  const captureOriginalFeatures = useCallback(() => {
    if (!drawRef.current || selectedFeatures.length === 0) return null
    
    const originals = new Map()
    selectedFeatures.forEach(f => {
      if (f.id && f.geometry) {
        originals.set(f.id, JSON.parse(JSON.stringify(f.geometry)))
      }
    })
    return originals
  }, [selectedFeatures])

  // Apply drag transform
  const applyDragTransform = useCallback((currentLngLat: any) => {
    if (!transform.original || !transform.startLngLat || !drawRef.current) return
    
    const start = transform.startLngLat
    const dist = turf.distance(
      turf.point([start.lng, start.lat]),
      turf.point([currentLngLat.lng, currentLngLat.lat]),
      { units: 'meters' }
    )
    const bearing = turf.bearing(
      turf.point([start.lng, start.lat]),
      turf.point([currentLngLat.lng, currentLngLat.lat])
    )
    
    const all = drawRef.current.getAll()
    const updatedFeatures = all.features.map((f: any) => {
      const originalGeom = transform.original?.get(f.id)
      if (originalGeom) {
        const moved = turf.transformTranslate(
          { type: 'Feature', geometry: originalGeom, properties: {} },
          dist,
          bearing,
          { units: 'meters' }
        )
        return { ...f, geometry: moved.geometry }
      }
      return f
    })
    
    drawRef.current.set({ type: 'FeatureCollection', features: updatedFeatures })
    drawRef.current.changeMode('simple_select', { featureIds: selectedFeatures.map(f => f.id) })
  }, [transform, selectedFeatures])

  // Apply rotate transform
  const applyRotateTransform = useCallback((currentLngLat: any) => {
    if (!transform.original || !transform.startLngLat || !drawRef.current) return
    
    // Calculate center of mass for rotation pivot
    const features = selectedFeatures.filter(f => transform.original?.has(f.id))
    if (features.length === 0) return
    
    const fc = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: transform.original?.get(f.id) || f.geometry,
        properties: {}
      }))
    }
    
    const center = turf.centerOfMass(fc as any).geometry.coordinates
    
    // Calculate rotation angle
    const start = transform.startLngLat
    const angle1 = turf.bearing(turf.point(center), turf.point([start.lng, start.lat]))
    const angle2 = turf.bearing(turf.point(center), turf.point([currentLngLat.lng, currentLngLat.lat]))
    const rotationAngle = angle2 - angle1
    
    const all = drawRef.current.getAll()
    const updatedFeatures = all.features.map((f: any) => {
      const originalGeom = transform.original?.get(f.id)
      if (originalGeom) {
        const rotated = turf.transformRotate(
          { type: 'Feature', geometry: originalGeom, properties: {} },
          rotationAngle,
          { pivot: center }
        )
        return { ...f, geometry: rotated.geometry }
      }
      return f
    })
    
    drawRef.current.set({ type: 'FeatureCollection', features: updatedFeatures })
    drawRef.current.changeMode('simple_select', { featureIds: selectedFeatures.map(f => f.id) })
  }, [transform, selectedFeatures])

  // Start drag mode
  const handleStartDrag = useCallback(() => {
    if (selectedFeatures.length === 0) return
    
    const originals = captureOriginalFeatures()
    setTransform({
      mode: 'drag',
      startLngLat: null,
      original: originals
    })
    
    if (mapRef.current) {
      mapRef.current.getMap().getCanvas().style.cursor = 'move'
      mapRef.current.getMap().dragPan.disable()
    }
  }, [selectedFeatures, captureOriginalFeatures])

  // Start rotate mode
  const handleStartRotate = useCallback(() => {
    if (selectedFeatures.length === 0) return
    
    // Don't allow rotation for a single circle
    const isSingleCircle = selectedFeatures.length === 1 && 
                          selectedFeatures[0].properties?.eeShape === 'circle'
    if (isSingleCircle) return
    
    const originals = captureOriginalFeatures()
    setTransform({
      mode: 'rotate',
      startLngLat: null,
      original: originals
    })
    
    if (mapRef.current) {
      mapRef.current.getMap().getCanvas().style.cursor = 'alias'
      mapRef.current.getMap().dragPan.disable()
    }
  }, [selectedFeatures, captureOriginalFeatures])

  // Stop transform modes
  const handleStopTransform = useCallback(() => {
    setTransform({ mode: null, startLngLat: null, original: null })
    
    if (mapRef.current) {
      mapRef.current.getMap().getCanvas().style.cursor = ''
      mapRef.current.getMap().dragPan.enable()
    }
  }, [])

  // Handle mouse events for transform
  useEffect(() => {
    if (!mapRef.current) return
    
    const map = mapRef.current.getMap()
    
    const handleMouseDown = (e: any) => {
      if (transform.mode) {
        setTransform(prev => ({ ...prev, startLngLat: e.lngLat }))
        e.preventDefault()
      }
    }
    
    const handleMouseMove = (e: any) => {
      if (transform.mode === 'drag' && transform.startLngLat) {
        applyDragTransform(e.lngLat)
      } else if (transform.mode === 'rotate' && transform.startLngLat) {
        applyRotateTransform(e.lngLat)
      }
    }
    
    const handleMouseUp = () => {
      if (transform.mode) {
        handleStopTransform()
      }
    }
    
    map.on('mousedown', handleMouseDown)
    map.on('mousemove', handleMouseMove)
    map.on('mouseup', handleMouseUp)
    
    return () => {
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
      map.off('mouseup', handleMouseUp)
    }
  }, [transform, applyDragTransform, applyRotateTransform, handleStopTransform])

  // Grid fill functionality
  const performGridFill = useCallback((sw: any, ne: any) => {
    if (!drawRef.current || selectedFeatures.length === 0) return
    
    const templateFeature = selectedFeatures[0]
    const origin = [sw.lng, sw.lat]
    
    // Determine spacing based on feature type
    let spacingM = 1
    if (templateFeature.properties?.eeShape === 'circle' && templateFeature.properties?.eeDiameterFt) {
      spacingM = templateFeature.properties.eeDiameterFt * METERS_PER_FOOT
    } else if (templateFeature.geometry?.type === 'Polygon') {
      const bbox = turf.bbox(templateFeature)
      const width = turf.distance(
        turf.point([bbox[0], bbox[1]]),
        turf.point([bbox[2], bbox[1]]),
        { units: 'meters' }
      )
      const height = turf.distance(
        turf.point([bbox[0], bbox[1]]),
        turf.point([bbox[0], bbox[3]]),
        { units: 'meters' }
      )
      spacingM = Math.max(width, height)
    }
    spacingM *= 2 // Double spacing for gaps
    
    const cols = Math.max(1, Math.floor(
      turf.distance(turf.point([sw.lng, sw.lat]), turf.point([ne.lng, sw.lat]), { units: 'meters' }) / spacingM
    ))
    const rows = Math.max(1, Math.floor(
      turf.distance(turf.point([sw.lng, sw.lat]), turf.point([sw.lng, ne.lat]), { units: 'meters' }) / spacingM
    ))
    
    const newFeatures = []
    for (let iy = 0; iy < rows; iy++) {
      const rowOrigin = turf.transformTranslate(turf.point(origin), iy * spacingM, 0, { units: 'meters' })
      for (let ix = 0; ix < cols; ix++) {
        const cellCenter = turf.transformTranslate(rowOrigin, ix * spacingM, 90, { units: 'meters' })
        
        // Create a deep copy of the template feature
        const featureCopy = JSON.parse(JSON.stringify(templateFeature))
        const templateCentroid = turf.centerOfMass(featureCopy)
        const bearing = turf.bearing(templateCentroid, cellCenter)
        const distance = turf.distance(templateCentroid, cellCenter, { units: 'meters' })
        
        const moved = turf.transformTranslate(featureCopy, distance, bearing, { units: 'meters' })
        // Generate unique ID for each grid item
        const newId = `grid-${Date.now()}-${ix}-${iy}`
        moved.id = newId
        moved.properties = { ...(templateFeature.properties || {}), name: `${templateFeature.properties?.name || 'feature'}-grid` }
        newFeatures.push(moved)
      }
    }
    
    newFeatures.forEach(f => drawRef.current?.add(f))
  }, [selectedFeatures])

  // Handle drag select for grid fill
  useEffect(() => {
    if (!mapRef.current) return
    
    const mapContainer = mapRef.current.getMap().getContainer()
    
    const handleMouseDown = (e: MouseEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      
      if (activeTool === 'select' && ctrlOrCmd && selectedFeatures.length >= 1) {
        const rectEl = document.createElement('div')
        rectEl.style.position = 'absolute'
        rectEl.style.border = '1px dashed #444'
        rectEl.style.background = 'rgba(54, 83, 20, 0.08)'
        rectEl.style.pointerEvents = 'none'
        rectEl.style.zIndex = '1000'
        mapContainer.appendChild(rectEl)
        
        setDragSelect({
          active: true,
          start: { x: e.clientX, y: e.clientY },
          rectEl
        })
        
        e.preventDefault()
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragSelect.active || !dragSelect.rectEl || !dragSelect.start) return
      
      const rect = mapContainer.getBoundingClientRect()
      const x1 = dragSelect.start.x
      const y1 = dragSelect.start.y
      const x2 = e.clientX
      const y2 = e.clientY
      
      const left = Math.min(x1, x2) - rect.left
      const top = Math.min(y1, y2) - rect.top
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)
      
      Object.assign(dragSelect.rectEl.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      })
      
      e.preventDefault()
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!dragSelect.active || !mapRef.current) return
      
      if (dragSelect.rectEl) {
        const rect = dragSelect.rectEl.getBoundingClientRect()
        const mapRect = mapContainer.getBoundingClientRect()
        
        const p1 = [rect.left - mapRect.left, rect.top - mapRect.top]
        const p2 = [rect.right - mapRect.left, rect.bottom - mapRect.top]
        
        const sw = mapRef.current.getMap().unproject([p1[0], p2[1]])
        const ne = mapRef.current.getMap().unproject([p2[0], p1[1]])
        
        performGridFill(sw, ne)
        
        dragSelect.rectEl.remove()
      }
      
      setDragSelect({ active: false, start: null, rectEl: null })
      e.preventDefault()
    }
    
    mapContainer.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      mapContainer.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [activeTool, selectedFeatures, dragSelect, performGridFill])

  // Copy/paste functionality
  const handleCopy = useCallback(() => {
    if (selectedFeatures.length === 0) return
    // Deep clone the features to avoid reference issues
    setClipboard({
      type: 'features',
      features: selectedFeatures.map(f => JSON.parse(JSON.stringify(f)))
    })
  }, [selectedFeatures])

  const handlePaste = useCallback(() => {
    if (!clipboard || !drawRef.current) return
    
    const offsetMeters = 3 * METERS_PER_FOOT
    
    clipboard.features.forEach((feature: any) => {
      // Create a deep copy of the feature before transforming
      const featureCopy = JSON.parse(JSON.stringify(feature))
      const moved = turf.transformTranslate(featureCopy, offsetMeters, 90, { units: 'meters' })
      
      // Generate a new unique ID for the pasted feature
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      moved.id = newId
      moved.properties = { 
        ...(feature.properties || {}), 
        name: `${feature.properties?.name || 'feature'}-copy` 
      }
      
      drawRef.current?.add(moved)
    })
  }, [clipboard])

  const handleDelete = useCallback(() => {
    if (!drawRef.current || selectedFeatures.length === 0) return
    
    const ids = selectedFeatures.map(f => f.id).filter(id => id)
    if (ids.length > 0) {
      drawRef.current.delete(ids)
    }
  }, [selectedFeatures])

  // Group/ungroup functionality
  const handleGroup = useCallback(() => {
    if (selectedFeatures.length < 2) return
    
    const groupId = `group-${Date.now()}`
    const groupName = `Group ${groups.size + 1}`
    
    const newGroup = {
      id: groupId,
      name: groupName,
      featureIds: new Set(selectedFeatures.map(f => f.id))
    }
    
    const newGroups = new Map(groups)
    newGroups.set(groupId, newGroup)
    setGroups(newGroups)
    
    const newFeatureToGroup = new Map(featureToGroup)
    selectedFeatures.forEach(f => {
      if (f.id) {
        newFeatureToGroup.set(f.id, groupId)
      }
    })
    setFeatureToGroup(newFeatureToGroup)
  }, [selectedFeatures, groups, featureToGroup])

  const handleUngroup = useCallback(() => {
    const newFeatureToGroup = new Map(featureToGroup)
    const newGroups = new Map(groups)
    
    selectedFeatures.forEach(f => {
      if (f.id && newFeatureToGroup.has(f.id)) {
        const groupId = newFeatureToGroup.get(f.id)
        newFeatureToGroup.delete(f.id)
        
        if (groupId && newGroups.has(groupId)) {
          const group = newGroups.get(groupId)
          group.featureIds.delete(f.id)
          
          if (group.featureIds.size === 0) {
            newGroups.delete(groupId)
          }
        }
      }
    })
    
    setFeatureToGroup(newFeatureToGroup)
    setGroups(newGroups)
  }, [selectedFeatures, groups, featureToGroup])

  // Focus tracking for keyboard shortcuts
  useEffect(() => {
    if (!mapRef.current) return
    
    const mapContainer = mapRef.current.getMap().getContainer()
    
    const handleMapMouseDown = () => setMapHasFocus(true)
    const handleOtherMouseDown = () => setMapHasFocus(false)
    
    mapContainer.addEventListener('mousedown', handleMapMouseDown)
    
    return () => {
      mapContainer.removeEventListener('mousedown', handleMapMouseDown)
    }
  }, [isMapReady])
  
  // Helper to check if we should handle hotkeys
  const shouldHandleMapHotkeys = (e: KeyboardEvent): boolean => {
    const target = e.target as HTMLElement
    if (!target) return false
    
    const tag = target.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return false
    if (target.isContentEditable) return false
    
    return mapHasFocus
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shouldHandleMapHotkeys(e)) return
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      
      if (ctrlOrCmd && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handleCopy()
      } else if (ctrlOrCmd && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        handlePaste()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFeatures.length > 0) {
          e.preventDefault()
          handleDelete()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCopy, handlePaste, handleDelete, selectedFeatures, mapHasFocus])

  return (
    <div className="h-screen flex">
      <div onMouseDown={() => setMapHasFocus(false)}>
        <DrawToolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onPlantSelect={handlePlantSelect}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
          onDrag={handleStartDrag}
          onRotate={handleStartRotate}
          onStop={handleStopTransform}
          canGroup={selectedFeatures.length > 1}
          canUngroup={selectedFeatures.some(f => f.id && featureToGroup.has(f.id))}
          canRotate={!(selectedFeatures.length === 1 && selectedFeatures[0]?.properties?.eeShape === 'circle')}
          transformMode={transform.mode}
        />
      </div>
      
      <div className="flex-1 relative">
        <MapGL
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: coordinates.lng,
            latitude: coordinates.lat,
            zoom: 20,
            pitch: 0,
            bearing: 0
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle as any}
          maxZoom={22}
          onClick={handleMapClick}
          onLoad={() => {
            setIsMapReady(true)
            console.log('Map loaded and ready')
          }}
        />
      </div>
      
      <div onMouseDown={() => setMapHasFocus(false)}>
        <Inspector
          selectedFeatures={selectedFeatures}
          groups={groups}
          featureToGroup={featureToGroup}
          drawRef={drawRef}
        />
      </div>
    </div>
  )
}