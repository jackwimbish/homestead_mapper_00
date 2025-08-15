'use client'

import { useReducer } from 'react'

// Interaction modes
export type InteractionMode = 'idle' | 'drawing_line' | 'dragging' | 'rotating'

// State shape
export interface InteractionState {
  mode: InteractionMode
  selectedId: string | null
  hoveredId: string | null
  drawingData?: {
    currentLine: [number, number][]
  }
  dragData?: {
    objectId: string
    startLng: number
    startLat: number
    originalCoords: [number, number]
  }
  mousePosition: { x: number; y: number } | null
}

// Action types
export type InteractionAction =
  | { type: 'START_DRAWING' }
  | { type: 'UPDATE_DRAWING'; payload: [number, number][] }
  | { type: 'FINISH_DRAWING' }
  | { type: 'START_DRAG'; payload: { objectId: string; startLng: number; startLat: number; originalCoords: [number, number] } }
  | { type: 'STOP_DRAG' }
  | { type: 'SET_SELECTED'; payload: string | null }
  | { type: 'SET_HOVERED'; payload: string | null }
  | { type: 'SET_MOUSE_POSITION'; payload: { x: number; y: number } | null }
  | { type: 'RESET' }

// Initial state
const initialState: InteractionState = {
  mode: 'idle',
  selectedId: null,
  hoveredId: null,
  mousePosition: null
}

// Reducer function
function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  switch (action.type) {
    case 'START_DRAWING':
      return {
        ...state,
        mode: 'drawing_line',
        drawingData: { currentLine: [] }
      }
    
    case 'UPDATE_DRAWING':
      return {
        ...state,
        drawingData: {
          currentLine: action.payload
        }
      }
    
    case 'FINISH_DRAWING':
      return {
        ...state,
        mode: 'idle',
        drawingData: undefined
      }
    
    case 'START_DRAG':
      return {
        ...state,
        mode: 'dragging',
        dragData: action.payload,
        selectedId: action.payload.objectId
      }
    
    case 'STOP_DRAG':
      return {
        ...state,
        mode: 'idle',
        dragData: undefined
      }
    
    case 'SET_SELECTED':
      return {
        ...state,
        selectedId: action.payload
      }
    
    case 'SET_HOVERED':
      return {
        ...state,
        hoveredId: action.payload
      }
    
    case 'SET_MOUSE_POSITION':
      return {
        ...state,
        mousePosition: action.payload
      }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

// Custom hook
export function useInteractionState() {
  const [state, dispatch] = useReducer(interactionReducer, initialState)
  
  return {
    state,
    dispatch,
    // Helper methods for common operations
    startDrawing: () => dispatch({ type: 'START_DRAWING' }),
    updateDrawing: (line: [number, number][]) => dispatch({ type: 'UPDATE_DRAWING', payload: line }),
    finishDrawing: () => dispatch({ type: 'FINISH_DRAWING' }),
    startDrag: (data: { objectId: string; startLng: number; startLat: number; originalCoords: [number, number] }) => 
      dispatch({ type: 'START_DRAG', payload: data }),
    stopDrag: () => dispatch({ type: 'STOP_DRAG' }),
    setSelected: (id: string | null) => dispatch({ type: 'SET_SELECTED', payload: id }),
    setHovered: (id: string | null) => dispatch({ type: 'SET_HOVERED', payload: id }),
    setMousePosition: (pos: { x: number; y: number } | null) => dispatch({ type: 'SET_MOUSE_POSITION', payload: pos }),
    reset: () => dispatch({ type: 'RESET' })
  }
}