import { useState, useCallback, useRef, useEffect } from "react"
import { DrawingStroke, DrawingPoint } from "@/types/drawing"
import { redrawAllStrokes, getPointFromEvent, drawStroke as drawStrokeUtil } from "@/lib/drawing-utils"

interface UseDrawingProps {
  drawings: DrawingStroke[]
  onDrawingsChange: (drawings: DrawingStroke[]) => void
  editorRef: React.RefObject<HTMLDivElement | null>
}

export function useDrawing({ drawings, onDrawingsChange, editorRef }: UseDrawingProps) {
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingTool, setDrawingTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen')
  const [drawingColor, setDrawingColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Redraw canvas when page changes or drawings update
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const rect = editorRef.current?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    // Redraw all strokes
    redrawAllStrokes(canvas, drawings)
  }, [drawings, editorRef])

  const startDrawing = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingMode) return

    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const point = getPointFromEvent(e, canvas)
    setCurrentStroke([point])
  }, [isDrawingMode])

  const draw = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !isDrawingMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const point = getPointFromEvent(e, canvas)
    setCurrentStroke((prev) => [...prev, point])

    // Draw current stroke in real-time
    const ctx = canvas.getContext('2d')
    if (!ctx || currentStroke.length === 0) return

    ctx.strokeStyle = drawingColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (drawingTool === 'highlighter') {
      ctx.globalAlpha = 0.3
    } else if (drawingTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    ctx.beginPath()
    const lastPoint = currentStroke[currentStroke.length - 1]
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }, [isDrawing, isDrawingMode, currentStroke, drawingColor, strokeWidth, drawingTool])

  const endDrawing = useCallback(() => {
    if (!isDrawing || currentStroke.length === 0) {
      setIsDrawing(false)
      setCurrentStroke([])
      return
    }

    // Save the stroke
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}`,
      points: currentStroke,
      color: drawingColor,
      width: strokeWidth,
      tool: drawingTool,
    }

    onDrawingsChange([...drawings, newStroke])

    setIsDrawing(false)
    setCurrentStroke([])
  }, [isDrawing, currentStroke, drawingColor, strokeWidth, drawingTool, drawings, onDrawingsChange])

  const clearDrawings = useCallback(() => {
    onDrawingsChange([])
  }, [onDrawingsChange])

  return {
    isDrawingMode,
    setIsDrawingMode,
    drawingTool,
    setDrawingTool,
    drawingColor,
    setDrawingColor,
    strokeWidth,
    setStrokeWidth,
    canvasRef,
    startDrawing,
    draw,
    endDrawing,
    clearDrawings,
  }
}
