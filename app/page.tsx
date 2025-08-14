'use client'

import { useState } from 'react'
import AddressForm from '@/components/AddressForm'
import dynamic from 'next/dynamic'

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), { ssr: false })

export default function Home() {
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddressSubmit = async (address: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${mapboxToken}`
      
      const response = await fetch(geocodeUrl)
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        setCoordinates({ lng, lat })
      } else {
        setError('Address not found. Please try a more specific address.')
      }
    } catch (err) {
      setError('Failed to geocode address. Please check your Mapbox token and try again.')
      console.error('Geocoding error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Homestead Mapping Application
          </h1>
          <p className="text-lg text-gray-600">
            Enter a property address to start mapping your homestead
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-8">
          <AddressForm onSubmit={handleAddressSubmit} />
          
          {loading && (
            <div className="text-center">
              <p className="text-gray-600">Loading map...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <InteractiveMap coordinates={coordinates} />
        </div>
      </div>
    </div>
  )
}