export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  address?: string
  coordinates?: { lng: number; lat: number }
  created_at: string
  updated_at: string
}

export interface QuestionnaireResponse {
  id: string
  project_id: string
  responses: Record<string, any>
  created_at: string
  updated_at: string
}