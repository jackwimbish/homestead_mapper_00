// Generate icon images programmatically
export const generateIcon = (emoji: string, bgColor: string, size: number = 64): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Draw background circle
  ctx.fillStyle = bgColor
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
  ctx.fill()

  // Draw emoji
  ctx.globalAlpha = 1
  ctx.font = `${size * 0.5}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'white'
  ctx.fillText(emoji, size / 2, size / 2 + 2)

  return canvas
}

export const ICON_CONFIG = {
  chicken_coop: { emoji: '🐔', color: '#8B4513' },
  food_forest: { emoji: '🌳', color: '#228B22' },
  garden_bed: { emoji: '🌱', color: '#8FBC8F' },
  pond: { emoji: '💧', color: '#4682B4' },
  greenhouse: { emoji: '🏡', color: '#F0E68C' },
  compost: { emoji: '♻️', color: '#654321' }
}