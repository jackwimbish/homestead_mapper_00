'use client'

import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MapObject } from '@/types/map'
import { User } from 'firebase/auth'

type Status = 'idle' | 'loading' | 'saving' | 'error' | 'success'

interface UseHomesteadDesignReturn {
  objects: MapObject[]
  setObjects: (objects: MapObject[]) => void
  saveDesign: () => Promise<void>
  loadDesign: () => Promise<void>
  status: Status
  error: string | null
  hasUnsavedChanges: boolean
}

export function useHomesteadDesign(
  user: User | null, 
  coordinates: { lng: number; lat: number } | null
): UseHomesteadDesignReturn {
  const [objects, setObjects] = useState<MapObject[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [originalObjects, setOriginalObjects] = useState<MapObject[]>([])
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(objects) !== JSON.stringify(originalObjects)

  const saveDesign = useCallback(async () => {
    if (!user || !coordinates) {
      setError('Must be logged in with a location to save')
      return
    }

    setStatus('saving')
    setError(null)
    
    try {
      const designData = {
        objects,
        coordinates,
        updatedAt: new Date().toISOString(),
      }

      await setDoc(doc(db, 'designs', user.uid), designData)
      setOriginalObjects(objects) // Update the baseline after successful save
      setStatus('success')
      
      // Reset status after showing success
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving design:', err)
      setError(err instanceof Error ? err.message : 'Failed to save design')
      setStatus('error')
    }
  }, [user, coordinates, objects])

  const loadDesign = useCallback(async () => {
    if (!user) {
      setError('Must be logged in to load designs')
      return
    }

    setStatus('loading')
    setError(null)
    
    try {
      const docRef = doc(db, 'designs', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const loadedObjects = data.objects || []
        setObjects(loadedObjects)
        setOriginalObjects(loadedObjects)
        setStatus('success')
        
        // Reset status after showing success
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setError('No saved design found')
        setStatus('idle')
      }
    } catch (err) {
      console.error('Error loading design:', err)
      setError(err instanceof Error ? err.message : 'Failed to load design')
      setStatus('error')
    }
  }, [user])

  // Auto-load design when user logs in
  useEffect(() => {
    if (user && objects.length === 0) {
      loadDesign()
    }
  }, [user]) // Intentionally not including loadDesign to avoid infinite loops

  return {
    objects,
    setObjects,
    saveDesign,
    loadDesign,
    status,
    error,
    hasUnsavedChanges
  }
}