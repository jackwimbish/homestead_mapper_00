'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Project } from '@/types/project'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  createProject: (name: string, description?: string) => Promise<Project>
  selectProject: (projectId: string) => void
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setProjects(data || [])
      
      // Restore current project from localStorage if available
      const savedProjectId = localStorage.getItem('currentProjectId')
      if (savedProjectId && data) {
        const savedProject = data.find(p => p.id === savedProjectId)
        if (savedProject) {
          setCurrentProject(savedProject)
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshProjects()
  }, [user, refreshProjects])

  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!user) throw new Error('Must be logged in to create a project')

    const { data, error: createError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description
      })
      .select()
      .single()

    if (createError) throw createError

    setProjects(prev => [data, ...prev])
    return data
  }

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      localStorage.setItem('currentProjectId', projectId)
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user) throw new Error('Must be logged in to update a project')

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    ))

    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!user) throw new Error('Must be logged in to delete a project')

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    setProjects(prev => prev.filter(p => p.id !== projectId))
    
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      localStorage.removeItem('currentProjectId')
    }
  }

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      loading,
      error,
      createProject,
      selectProject,
      updateProject,
      deleteProject,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}