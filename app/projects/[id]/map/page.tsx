'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects } from '@/contexts/ProjectContext'
import AddressForm from '@/components/AddressForm'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const InteractiveMapDraw = dynamic(() => import('@/components/InteractiveMapDraw'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading map...</div>
})

export default function ProjectMapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, loading: authLoading } = useAuth()
  const { currentProject, selectProject, updateProject, projects, loading: projectsLoading } = useProjects()
  const router = useRouter()
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!projectsLoading && projects.length > 0 && !currentProject) {
      selectProject(resolvedParams.id)
    }
  }, [user, authLoading, router, resolvedParams.id, selectProject, projects, projectsLoading, currentProject])

  useEffect(() => {
    if (currentProject?.coordinates) {
      setCoordinates(currentProject.coordinates)
    }
  }, [currentProject])

  const handleAddressSubmit = async (address: string) => {
    setIsLoading(true)
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
        const newCoordinates = { lng, lat }
        setCoordinates(newCoordinates)
        
        // Save the address and coordinates to the project
        if (currentProject) {
          await updateProject(currentProject.id, {
            address,
            coordinates: newCoordinates
          })
        }
      } else {
        setError('Address not found. Please try a more specific address.')
      }
    } catch (err) {
      setError('Failed to geocode address. Please check your Mapbox token and try again.')
      console.error('Geocoding error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">Project not found</p>
        <Link href="/projects" className="text-green-600 hover:text-green-700">
          Back to Projects
        </Link>
      </div>
    )
  }

  if (!coordinates) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Map Planner
              </h1>
              <p className="text-lg text-gray-600 mb-1">
                {currentProject.name}
              </p>
              <p className="text-gray-600">
                Enter a property address to start mapping your homestead
              </p>
            </div>
            <Link
              href={`/projects/${resolvedParams.id}`}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Project
            </Link>
          </div>
          
          <div className="flex flex-col items-center gap-8">
            <AddressForm 
              onSubmit={handleAddressSubmit} 
              initialAddress={currentProject.address}
            />
            
            {isLoading && (
              <div className="text-center">
                <p className="text-gray-600">Loading map...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white shadow-md border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${resolvedParams.id}`}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
          >
            ← Back to Project
          </Link>
          <div className="border-l border-gray-300 h-6"></div>
          <h2 className="font-semibold text-lg text-gray-900">{currentProject.name} - Map Planner</h2>
        </div>
      </div>
      <div className="flex-1 relative">
        <InteractiveMapDraw coordinates={coordinates} projectId={resolvedParams.id} />
      </div>
    </div>
  )
}