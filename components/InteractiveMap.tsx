'use client'

import { useState, useRef, useEffect } from 'react'
import Map, { Source, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Toolbar from './Toolbar'
import AuthForm from './AuthForm'
import MapDrawingLayer from './MapDrawingLayer'
import { useAuth } from '@/contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MapObject } from '@/types/map'

interface InteractiveMapProps {
  coordinates: {
    lng: number
    lat: number
  } | null
}

export default function InteractiveMap({ coordinates }: InteractiveMapProps) {
  const { user } = useAuth()
  const mapRef = useRef<MapRef>(null)
  const [activeTool, setActiveTool] = useState<string | null>('select')
  const [objects, setObjects] = useState<MapObject[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showContours, setShowContours] = useState(false)

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

  const contourLayer = {
    id: 'contours',
    type: 'line' as const,
    source: 'mapbox-terrain',
    'source-layer': 'contour',
    paint: {
      'line-color': '#ff9900',
      'line-width': 1.5,
      'line-opacity': showContours ? 0.7 : 0,
    },
  }

  const contourLabelLayer = {
    id: 'contour-labels',
    type: 'symbol' as const,
    source: 'mapbox-terrain',
    'source-layer': 'contour',
    filter: ['in', ['get', 'index'], ['literal', [5, 10]]],
    paint: {
      'text-color': '#ff9900',
      'text-halo-color': 'white',
      'text-halo-width': 2,
      'text-opacity': showContours ? 1 : 0,
    },
    layout: {
      'text-field': ['concat', ['to-string', ['get', 'ele']], 'm'],
      'text-size': 12,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'symbol-placement': 'line',
      'text-rotation-alignment': 'map',
    },
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="flex gap-4">
        <div className="flex-shrink-0 space-y-4">
          <Toolbar activeTool={activeTool} onToolSelect={setActiveTool} />
          
          <AuthForm />
          
          {user && (
            <div className="bg-white rounded-lg shadow-lg p-4 space-y-2 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Save & Load</h3>
              <button
                onClick={handleSave}
                disabled={saving || objects.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Design'}
              </button>
              <button
                onClick={handleLoad}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Design'}
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Map Layers</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => setShowContours(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 accent-blue-600"
              />
              <span className="text-sm text-gray-800 font-medium">Show Contours</span>
            </label>
          </div>
        </div>
        
        <div className="flex-grow">
          <div 
            className="relative rounded-lg shadow-lg overflow-hidden"
            style={{ height: '600px' }}
          >
            <Map
              ref={mapRef}
              mapboxAccessToken={mapboxToken}
              initialViewState={{
                longitude: coordinates.lng,
                latitude: coordinates.lat,
                zoom: 18,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/satellite-v9"
              terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
              dragPan={true}
              scrollZoom={true}
              doubleClickZoom={false}
              cursor={
                activeTool && activeTool !== 'select' && activeTool !== 'delete' 
                  ? 'crosshair' 
                  : 'default'
              }
            >
              <Source
                id="mapbox-terrain"
                type="vector"
                url="mapbox://mapbox.mapbox-terrain-v2"
              />
              <Source
                id="mapbox-dem"
                type="raster-dem"
                url="mapbox://mapbox.mapbox-terrain-dem-v1"
                tileSize={512}
                maxzoom={14}
              />
              <Layer {...contourLayer} />
              <Layer {...contourLabelLayer} />

              {/* Drawing layer for objects */}
              <MapDrawingLayer 
                mapRef={mapRef}
                activeTool={activeTool}
                objects={objects}
                setObjects={setObjects}
              />
            </Map>
          </div>
        </div>
      </div>
    </div>
  )
}