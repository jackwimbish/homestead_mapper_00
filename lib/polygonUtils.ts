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

// Get polygon coordinates based on object type
export const getPolygonForObject = (
  objectType: string,
  center: [number, number]
): [number, number][] => {
  // Sizes are in meters - adjust these to match your desired real-world scale
  switch (objectType) {
    case 'chicken_coop':
      // Square shape, ~10m x 10m
      return createSquarePolygon(center, 10)
    
    case 'food_forest':
      // Circle shape, ~15m radius
      return createCirclePolygon(center, 15)
    
    case 'garden_bed':
      // Rectangle shape, ~12m x 6m
      return createRectanglePolygon(center, 12, 6)
    
    case 'pond':
      // Circle shape, ~12m radius
      return createCirclePolygon(center, 12)
    
    case 'greenhouse':
      // Rectangle shape, ~15m x 10m
      return createRectanglePolygon(center, 15, 10)
    
    case 'compost':
      // Small square, ~5m x 5m
      return createSquarePolygon(center, 5)
    
    default:
      // Default to small circle
      return createCirclePolygon(center, 8)
  }
}