'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects } from '@/contexts/ProjectContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import questionnaireData from '@/_docs/permaculture_questionnaire.json'

export default function QuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, loading: authLoading } = useAuth()
  const { currentProject, selectProject, projects, loading: projectsLoading } = useProjects()
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const questions = questionnaireData.permaculture_questionnaire

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
    if (currentProject) {
      loadResponses()
    }
  }, [currentProject])

  const loadResponses = async () => {
    if (!currentProject) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('project_id', currentProject.id)
        .single()

      if (data && !error) {
        setResponses(data.responses || {})
      }
    } catch (err) {
      console.error('Error loading responses:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveResponses = async () => {
    if (!currentProject) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('questionnaire_responses')
        .upsert({
          project_id: currentProject.id,
          responses,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error saving responses:', err)
      setError('Failed to save responses')
    } finally {
      setSaving(false)
    }
  }

  const handleResponseChange = (question: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }))
  }

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      await saveResponses()
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleFinish = async () => {
    await saveResponses()
    router.push(`/projects/${resolvedParams.id}`)
  }

  if (authLoading || projectsLoading || loading) {
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

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permaculture Design Questionnaire</h1>
              <p className="mt-1 text-gray-600">{currentProject.name}</p>
            </div>
            <Link
              href={`/projects/${resolvedParams.id}`}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Project
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
            <p className="text-gray-600 mb-6">
              {currentQuestion.prompt}
            </p>
            <textarea
              value={responses[currentQuestion.question] || ''}
              onChange={(e) => handleResponseChange(currentQuestion.question, e.target.value)}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Enter your response here..."
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={saveResponses}
              disabled={saving}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleFinish}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}