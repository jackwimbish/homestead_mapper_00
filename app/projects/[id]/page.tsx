'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects } from '@/contexts/ProjectContext'
import Link from 'next/link'

export default function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, loading: authLoading } = useAuth()
  const { currentProject, selectProject, projects, loading: projectsLoading } = useProjects()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!projectsLoading && projects.length > 0 && !currentProject) {
      selectProject(resolvedParams.id)
    }
  }, [user, authLoading, router, resolvedParams.id, selectProject, projects, projectsLoading, currentProject])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
              {currentProject.description && (
                <p className="mt-2 text-gray-600">{currentProject.description}</p>
              )}
            </div>
            <Link
              href="/projects"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href={`/projects/${resolvedParams.id}/map`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-8 text-center group"
          >
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition">
              Map Planner
            </h2>
            <p className="text-gray-600">
              Design your homestead layout with interactive drawing tools
            </p>
            {currentProject.address && (
              <p className="text-sm text-gray-500 mt-4">
                📍 {currentProject.address}
              </p>
            )}
          </Link>

          <Link
            href={`/projects/${resolvedParams.id}/questionnaire`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-8 text-center group"
          >
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition">
              Questionnaire
            </h2>
            <p className="text-gray-600">
              Complete the permaculture design questionnaire to plan your homestead
            </p>
          </Link>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(currentProject.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(currentProject.updated_at).toLocaleDateString()}
              </dd>
            </div>
            {currentProject.address && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{currentProject.address}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}