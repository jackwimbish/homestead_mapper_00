export type ObjectType = 
  | 'chicken_coop' 
  | 'food_forest' 
  | 'garden_bed' 
  | 'pond' 
  | 'greenhouse' 
  | 'compost' 
  | 'swale'

export interface MapObject {
  id: string
  type: 'point' | 'line'
  coordinates: [number, number] | [number, number][]
  rotation?: number  // Rotation in degrees (0-360)
  properties: {
    objectType: ObjectType
    color: string
    icon: string
    name?: string
  }
}

export interface ToolConfig {
  id: ObjectType | 'select' | 'delete'
  name: string
  icon: string
  color: string
  drawType?: 'point' | 'line'
}

export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  select: { id: 'select', name: 'Select', icon: '👆', color: '#000000' },
  delete: { id: 'delete', name: 'Delete', icon: '🗑️', color: '#FF0000' },
  chicken_coop: { 
    id: 'chicken_coop', 
    name: 'Chicken Coop', 
    icon: '🐔', 
    color: '#8B4513',
    drawType: 'point'
  },
  food_forest: { 
    id: 'food_forest', 
    name: 'Food Forest', 
    icon: '🌳', 
    color: '#228B22',
    drawType: 'point'
  },
  garden_bed: { 
    id: 'garden_bed', 
    name: 'Garden Bed', 
    icon: '🌱', 
    color: '#8FBC8F',
    drawType: 'point'
  },
  pond: { 
    id: 'pond', 
    name: 'Pond', 
    icon: '💧', 
    color: '#4682B4',
    drawType: 'point'
  },
  greenhouse: { 
    id: 'greenhouse', 
    name: 'Greenhouse', 
    icon: '🏡', 
    color: '#F0E68C',
    drawType: 'point'
  },
  compost: { 
    id: 'compost', 
    name: 'Compost', 
    icon: '♻️', 
    color: '#654321',
    drawType: 'point'
  },
  swale: { 
    id: 'swale', 
    name: 'Swale', 
    icon: '〰️', 
    color: '#6495ED',
    drawType: 'line'
  }
}