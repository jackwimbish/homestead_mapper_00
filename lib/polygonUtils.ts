// Utility functions for generating polygon geometries

// Convert a point to a circle polygon
export const createCirclePolygon = (
  center: [number, number], 
  radiusInMeters: number, 
  steps: number = 32
): [number, number][] => {
  const coords: [number, number][] = []
  const distanceX = radiusInMeters / (111320 * Math.cos(center[1] * Math.PI / 180))
  const distanceY = radiusInMeters / 110574

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * (2 * Math.PI)
    const x = center[0] + distanceX * Math.cos(theta)
    const y = center[1] + distanceY * Math.sin(theta)
    coords.push([x, y])
  }

  return coords
}

// Convert a point to a rectangle polygon
export const createRectanglePolygon = (
  center: [number, number],
  widthInMeters: number,
  heightInMeters: number
): [number, number][] => {
  const distanceX = widthInMeters / (111320 * Math.cos(center[1] * Math.PI / 180))
  const distanceY = heightInMeters / 110574
  
  const halfWidth = distanceX / 2
  const halfHeight = distanceY / 2
  
  return [
    [center[0] - halfWidth, center[1] - halfHeight],
    [center[0] + halfWidth, center[1] - halfHeight],
    [center[0] + halfWidth, center[1] + halfHeight],
    [center[0] - halfWidth, center[1] + halfHeight],
    [center[0] - halfWidth, center[1] - halfHeight]
  ]
}

// Convert a point to a square polygon
export const createSquarePolygon = (
  center: [number, number],
  sizeInMeters: number
): [number, number][] => {
  return createRectanglePolygon(center, sizeInMeters, sizeInMeters)
}

// Rotate a point around a center
export const rotatePoint = (
  point: [number, number],
  center: [number, number],
  angleDegrees: number
): [number, number] => {
  const angleRad = (angleDegrees * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  
  const dx = point[0] - center[0]
  const dy = point[1] - center[1]
  
  return [
    center[0] + dx * cos - dy * sin,
    center[1] + dx * sin + dy * cos
  ]
}

// Apply rotation to polygon coordinates
export const rotatePolygon = (
  coords: [number, number][],
  center: [number, number],
  rotation: number
): [number, number][] => {
  if (!rotation || rotation === 0) return coords
  return coords.map(point => rotatePoint(point, center, rotation))
}

// Get polygon coordinates based on object type
export const getPolygonForObject = (
  objectType: string,
  center: [number, number],
  rotation?: number
): [number, number][] => {
  // Sizes are in meters - adjust these to match your desired real-world scale
  let coords: [number, number][]
  
  switch (objectType) {
    case 'chicken_coop':
      // Square shape, ~10m x 10m
      coords = createSquarePolygon(center, 10)
      return rotatePolygon(coords, center, rotation || 0)
    
    case 'food_forest':
      // Circle shape, ~15m radius (no rotation needed for circles)
      return createCirclePolygon(center, 15)
    
    case 'garden_bed':
      // Rectangle shape, ~12m x 6m
      coords = createRectanglePolygon(center, 12, 6)
      return rotatePolygon(coords, center, rotation || 0)
    
    case 'pond':
      // Circle shape, ~12m radius (no rotation needed for circles)
      return createCirclePolygon(center, 12)
    
    case 'greenhouse':
      // Rectangle shape, ~15m x 10m
      coords = createRectanglePolygon(center, 15, 10)
      return rotatePolygon(coords, center, rotation || 0)
    
    case 'compost':
      // Small square, ~5m x 5m
      coords = createSquarePolygon(center, 5)
      return rotatePolygon(coords, center, rotation || 0)
    
    default:
      // Default to small circle
      return createCirclePolygon(center, 8)
  }
}