'use client'

import { useState, useRef } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva'
import Konva from 'konva'

interface DrawingCanvasProps {
  activeTool: string | null
  width: number
  height: number
  objects: DrawingObject[]
  setObjects: (objects: DrawingObject[]) => void
}

export interface DrawingObject {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  points?: number[]
  color?: string
  text?: string
}

export default function DrawingCanvas({ activeTool, width, height, objects, setObjects }: DrawingCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentLine, setCurrentLine] = useState<number[]>([])
  const stageRef = useRef<Konva.Stage>(null)

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!activeTool || activeTool === 'select') return

    const stage = e.target.getStage()
    if (!stage) return

    const point = stage.getPointerPosition()
    if (!point) return

    const newId = `object_${Date.now()}`

    if (activeTool === 'swale') {
      setIsDrawing(true)
      setCurrentLine([point.x, point.y])
    } else {
      const newObject: DrawingObject = {
        id: newId,
        type: activeTool,
        x: point.x,
        y: point.y,
      }

      switch (activeTool) {
        case 'chicken_coop':
          newObject.width = 60
          newObject.height = 60
          newObject.color = '#8B4513'
          newObject.text = '🐔'
          break
        case 'food_forest':
          newObject.radius = 40
          newObject.color = '#228B22'
          newObject.text = '🌳'
          break
        case 'garden_bed':
          newObject.width = 80
          newObject.height = 40
          newObject.color = '#8FBC8F'
          newObject.text = '🌱'
          break
        case 'pond':
          newObject.radius = 50
          newObject.color = '#4682B4'
          newObject.text = '💧'
          break
        case 'greenhouse':
          newObject.width = 70
          newObject.height = 50
          newObject.color = '#F0E68C'
          newObject.text = '🏡'
          break
        case 'compost':
          newObject.width = 40
          newObject.height = 40
          newObject.color = '#654321'
          newObject.text = '♻️'
          break
      }

      setObjects([...objects, newObject])
    }
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || activeTool !== 'swale') return

    const stage = e.target.getStage()
    if (!stage) return

    const point = stage.getPointerPosition()
    if (!point) return

    setCurrentLine([...currentLine, point.x, point.y])
  }

  const handleMouseUp = () => {
    if (!isDrawing || activeTool !== 'swale') return

    if (currentLine.length > 2) {
      const newObject: DrawingObject = {
        id: `object_${Date.now()}`,
        type: 'swale',
        x: 0,
        y: 0,
        points: currentLine,
        color: '#6495ED',
      }
      setObjects([...objects, newObject])
    }

    setIsDrawing(false)
    setCurrentLine([])
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const updatedObjects = objects.map((obj) => {
      if (obj.id === id) {
        return {
          ...obj,
          x: e.target.x(),
          y: e.target.y(),
        }
      }
      return obj
    })
    setObjects(updatedObjects)
  }

  const renderObject = (obj: DrawingObject) => {
    const isDraggable = activeTool === 'select'

    switch (obj.type) {
      case 'swale':
        return (
          <Line
            key={obj.id}
            points={obj.points}
            stroke={obj.color}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            draggable={isDraggable}
            onDragEnd={(e) => handleDragEnd(e, obj.id)}
          />
        )
      case 'food_forest':
      case 'pond':
        return (
          <Group
            key={obj.id}
            x={obj.x}
            y={obj.y}
            draggable={isDraggable}
            onDragEnd={(e) => handleDragEnd(e, obj.id)}
          >
            <Circle
              radius={obj.radius || 30}
              fill={obj.color}
              opacity={0.6}
            />
            <Text
              text={obj.text}
              fontSize={24}
              offsetX={12}
              offsetY={12}
            />
          </Group>
        )
      default:
        return (
          <Group
            key={obj.id}
            x={obj.x}
            y={obj.y}
            draggable={isDraggable}
            onDragEnd={(e) => handleDragEnd(e, obj.id)}
          >
            <Rect
              width={obj.width || 50}
              height={obj.height || 50}
              fill={obj.color}
              opacity={0.6}
              offsetX={(obj.width || 50) / 2}
              offsetY={(obj.height || 50) / 2}
            />
            <Text
              text={obj.text}
              fontSize={20}
              offsetX={10}
              offsetY={10}
            />
          </Group>
        )
    }
  }

  return (
    <div className="absolute inset-0">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: activeTool === 'select' ? 'move' : 'crosshair' }}
      >
        <Layer>
          {objects.map(renderObject)}
          {isDrawing && currentLine.length > 0 && (
            <Line
              points={currentLine}
              stroke="#6495ED"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}