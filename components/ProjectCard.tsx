'use client'

import { Project } from '@/types/project'

interface ProjectCardProps {
  project: Project
  onSelect: (project: Project) => void
  onDelete?: (projectId: string) => void
}

export default function ProjectCard({ project, onSelect, onDelete }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(project.id)
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>
      
      {project.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
      )}
      
      {project.address && (
        <p className="text-sm text-gray-500 mb-4">
          📍 {project.address}
        </p>
      )}
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Created {new Date(project.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={() => onSelect(project)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Open Project
        </button>
      </div>
    </div>
  )
}