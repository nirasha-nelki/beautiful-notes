import { DrawingStroke, DrawingPoint } from "@/types/drawing"

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke
) {
  if (stroke.points.length < 2) return

  ctx.beginPath()
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = 0.3
  } else if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  } else {
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
  }
  ctx.stroke()

  // Reset composite operation
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function redrawAllStrokes(
  canvas: HTMLCanvasElement,
  strokes: DrawingStroke[]
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  clearCanvas(canvas)
  strokes.forEach((stroke) => drawStroke(ctx, stroke))
}

export function getPointFromEvent(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): DrawingPoint {
  const rect = canvas.getBoundingClientRect()
  
  if ('touches' in e) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    }
  }
  
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}
