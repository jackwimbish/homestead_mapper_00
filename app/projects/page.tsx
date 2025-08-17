'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects } from '@/contexts/ProjectContext'
import ProjectCard from '@/components/ProjectCard'
import CreateProjectModal from '@/components/CreateProjectModal'

export default function ProjectsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const { projects, loading: projectsLoading, error, createProject, selectProject, deleteProject } = useProjects()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleProjectSelect = (project: any) => {
    selectProject(project.id)
    router.push(`/projects/${project.id}`)
  }

  const handleCreateProject = async (name: string, description?: string) => {
    const newProject = await createProject(name, description)
    selectProject(newProject.id)
    router.push(`/projects/${newProject.id}`)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(projectId)
    }
  }

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="mt-2 text-gray-600">Manage your homestead planning projects</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition font-medium"
            >
              + New Project
            </button>
            <button
              onClick={logout}
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">No projects yet</h2>
            <p className="text-gray-500 mb-6">Create your first homestead planning project to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition font-medium"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={handleProjectSelect}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}