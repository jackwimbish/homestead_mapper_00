'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { MapObject } from '@/types/map'

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
        id: user.id, // Supabase user ID is 'id', not 'uid'
        objects,
        coordinates,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase.from('designs').upsert(designData)

      if (upsertError) {
        console.error('Error saving design:', upsertError)
        setError(upsertError.message)
        setStatus('error')
        return
      }

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
      const { data, error: selectError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is the code for 'No rows found'
        console.error('Error loading design:', selectError)
        setError(selectError.message)
        setStatus('error')
        return
      }

      if (data) {
        const loadedObjects = data.objects || []
        setObjects(loadedObjects)
        setOriginalObjects(loadedObjects)
        setStatus('success')
        
        // Reset status after showing success
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        // No error, but no data. This means the user has no saved design.
        setObjects([]) // Ensure we start with a clean slate
        setOriginalObjects([])
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