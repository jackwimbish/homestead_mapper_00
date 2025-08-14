'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Toolbar from './Toolbar'
import AuthForm from './AuthForm'
import { useAuth } from '@/contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DrawingObject } from './DrawingCanvas'

const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), { ssr: false })

interface MapDisplayProps {
  coordinates: {
    lng: number
    lat: number
  } | null
}

export default function MapDisplay({ coordinates }: MapDisplayProps) {
  const { user } = useAuth()
  const [activeTool, setActiveTool] = useState<string | null>('select')
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [objects, setObjects] = useState<DrawingObject[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.offsetWidth,
          height: 600,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [coordinates])

  const handleSave = async () => {
    if (!user || !coordinates) return

    setSaving(true)
    try {
      const designData = {
        objects,
        coordinates,
        updatedAt: new Date().toISOString(),
      }

      await setDoc(doc(db, 'designs', user.uid), designData)
      alert('Design saved successfully!')
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Failed to save design')
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async () => {
    if (!user) return

    setLoading(true)
    try {
      const docRef = doc(db, 'designs', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setObjects(data.objects || [])
        alert('Design loaded successfully!')
      } else {
        alert('No saved design found')
      }
    } catch (error) {
      console.error('Error loading design:', error)
      alert('Failed to load design')
    } finally {
      setLoading(false)
    }
  }

  if (!coordinates) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Enter an address to display the map</p>
      </div>
    )
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const { lng, lat } = coordinates
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},18,0/${canvasSize.width}x${canvasSize.height}?access_token=${mapboxToken}`

  return (
    <div className="w-full max-w-6xl">
      <div className="flex gap-4">
        <div className="flex-shrink-0 space-y-4">
          <Toolbar activeTool={activeTool} onToolSelect={setActiveTool} />
          
          <AuthForm />
          
          {user && (
            <div className="bg-white rounded-lg shadow-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Save & Load</h3>
              <button
                onClick={handleSave}
                disabled={saving || objects.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Design'}
              </button>
              <button
                onClick={handleLoad}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Design'}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <div 
            ref={containerRef}
            className="relative rounded-lg shadow-lg overflow-hidden"
            style={{ height: '600px' }}
          >
            <img
              src={mapUrl}
              alt="Satellite view of property"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {coordinates && (
              <DrawingCanvas
                activeTool={activeTool}
                width={canvasSize.width}
                height={canvasSize.height}
                objects={objects}
                setObjects={setObjects}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}