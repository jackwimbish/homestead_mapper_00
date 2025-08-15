'use client'

import { useEffect } from 'react'
import { MapObject } from '@/types/map'

const ROTATABLE_TYPES = ['chicken_coop', 'garden_bed', 'greenhouse', 'compost']

interface UseKeyboardRotationProps {
  selectedId: string | null
  activeTool: string | null
  objects: MapObject[]
  setObjects: (objects: MapObject[]) => void
}

export function useKeyboardRotation({
  selectedId,
  activeTool,
  objects,
  setObjects
}: UseKeyboardRotationProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || activeTool !== 'select') return
      
      const selectedObj = objects.find(obj => obj.id === selectedId)
      if (!selectedObj || selectedObj.type !== 'point') return
      
      // Check if it's a rotatable object
      if (!ROTATABLE_TYPES.includes(selectedObj.properties.objectType)) return
      
      let rotationDelta = 0
      
      switch (e.key) {
        case 'r':
        case 'R':
          rotationDelta = 45  // Rotate 45° clockwise
          break
        case 'e':
        case 'E':
          rotationDelta = -45 // Rotate 45° counter-clockwise
          break
        case 'ArrowLeft':
          rotationDelta = -15 // Fine rotation counter-clockwise
          break
        case 'ArrowRight':
          rotationDelta = 15  // Fine rotation clockwise
          break
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
}