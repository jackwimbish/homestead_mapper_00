'use client'

import { useState, useRef } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Group, Transformer } from 'react-konva'
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space, deselect
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedId(null)
    }

    if (!activeTool) return

    const stage = e.target.getStage()
    if (!stage) return

    const point = stage.getPointerPosition()
    if (!point) return

    if (activeTool === 'select' || activeTool === 'delete') {
      // Selection/deletion is handled by clicking on objects
      return
    }

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

  const handleObjectClick = (id: string) => {
    if (activeTool === 'delete') {
      // Delete the object
      setObjects(objects.filter(obj => obj.id !== id))
      setSelectedId(null)
    } else if (activeTool === 'select') {
      // Select the object
      setSelectedId(id)
    }
  }

  const renderObject = (obj: DrawingObject) => {
    const isDraggable = activeTool === 'select'
    const isSelected = selectedId === obj.id && activeTool === 'select'
    const cursorStyle = activeTool === 'delete' ? 'pointer' : activeTool === 'select' ? 'move' : 'default'

    switch (obj.type) {
      case 'swale':
        return (
          <Line
            key={obj.id}
            points={obj.points}
            stroke={obj.color}
            strokeWidth={isSelected ? 6 : 4}
            lineCap="round"
            lineJoin="round"
            draggable={isDraggable}
            onDragEnd={(e) => handleDragEnd(e, obj.id)}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            shadowEnabled={isSelected}
            shadowColor="blue"
            shadowBlur={10}
            shadowOpacity={0.5}
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
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
          >
            <Circle
              radius={obj.radius || 30}
              fill={obj.color}
              opacity={0.6}
              stroke={isSelected ? 'blue' : undefined}
              strokeWidth={isSelected ? 3 : 0}
              shadowEnabled={isSelected}
              shadowColor="blue"
              shadowBlur={10}
              shadowOpacity={0.5}
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
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
          >
            <Rect
              width={obj.width || 50}
              height={obj.height || 50}
              fill={obj.color}
              opacity={0.6}
              offsetX={(obj.width || 50) / 2}
              offsetY={(obj.height || 50) / 2}
              stroke={isSelected ? 'blue' : undefined}
              strokeWidth={isSelected ? 3 : 0}
              shadowEnabled={isSelected}
              shadowColor="blue"
              shadowBlur={10}
              shadowOpacity={0.5}
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

  const getCursorStyle = () => {
    if (activeTool === 'select') return 'move'
    if (activeTool === 'delete') return 'crosshair'
    return 'crosshair'
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
        style={{ cursor: getCursorStyle() }}
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
      
      {/* Instructions overlay */}
      {activeTool === 'delete' && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg pointer-events-none">
          <p className="text-sm font-medium">Click on any item to delete it</p>
        </div>
      )}
      {activeTool === 'select' && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg pointer-events-none">
          <p className="text-sm font-medium">Click and drag items to move them</p>
        </div>
      )}
    </div>
  )
}