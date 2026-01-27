export interface DrawingPoint {
  x: number
  y: number
}

export interface DrawingStroke {
  id: string
  points: DrawingPoint[]
  color: string
  width: number
  tool: 'pen' | 'highlighter' | 'eraser'
}