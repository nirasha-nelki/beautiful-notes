"use client"

import type React from "react"
import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useCallback } from "react"
import { X, GripVertical, Plus, ImagePlus, Pen, Highlighter, Eraser, Slash, Dot, PenTool } from "lucide-react"
import { cn } from "@/lib/utils"
import { FONT_CLASS_BY_STYLE, LINE_BACKGROUND_BY_STYLE } from "@/lib/note-styles"
import { redrawAllStrokes, getPointFromEvent } from "@/lib/drawing-utils"
import { ImageBlock } from "@/types/image"
import { PageContent } from "@/types/page"
import type { DrawingPoint, DrawingStroke } from "@/types/drawing"
import { NoteEditorProps } from "@/types/noteeditor"
import { useNoteEditor } from "@/hooks/useNoteEditor"
import { useImageManager } from "@/hooks/useImageManager"
import { useDrawing } from "@/hooks/useDrawing"

type EditorTemplate = NonNullable<NoteEditorProps["template"]>

interface PageSectionProps {
  page: PageContent
  pageIndex: number
  template: EditorTemplate
  fontStyle: NoteEditorProps["fontStyle"]
  textColor: string
  isDrawingMode: boolean
  drawingTool: "pen" | "highlighter" | "eraser"
  drawingColor: string
  strokeWidth: number
  onUpdatePage: (pageIndex: number, updates: Partial<PageContent>) => void
  onSetActive: (pageIndex: number) => void
  onRegisterFileInput: (pageIndex: number, element: HTMLInputElement | null) => void
}

function PageSection({
  page,
  pageIndex,
  template,
  fontStyle,
  textColor,
  isDrawingMode,
  drawingTool,
  drawingColor,
  strokeWidth,
  onUpdatePage,
  onSetActive,
  onRegisterFileInput,
}: PageSectionProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const currentStrokeRef = useRef<DrawingPoint[]>([])

  const updatePage = useCallback((updates: Partial<PageContent>) => {
    onUpdatePage(pageIndex, updates)
  }, [onUpdatePage, pageIndex])

  const setImages = useCallback((
    updater: ImageBlock[] | ((prev: ImageBlock[]) => ImageBlock[])
  ) => {
    const nextImages = typeof updater === "function" ? updater(page.images) : updater
    updatePage({ images: nextImages })
  }, [page.images, updatePage])

  const {
    isDragOver,
    fileInputRef,
    handleDrop: handleImageDrop,
    handleDragOver,
    handleDragLeave,
    handleImageDragStart,
    removeImage,
    handleFileSelect,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useImageManager({ onImagesChange: setImages, images: page.images || [] })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = editorRef.current?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    redrawAllStrokes(canvas, page.drawings ?? [])
  }, [page.drawings])

  const startDrawing = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingMode) return

    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const point = getPointFromEvent(e, canvas)
    currentStrokeRef.current = [point]
  }, [isDrawingMode])

  const draw = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !isDrawingMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const points = currentStrokeRef.current
    if (points.length === 0) return

    const point = getPointFromEvent(e, canvas)

    ctx.strokeStyle = drawingColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (drawingTool === "highlighter") {
      ctx.globalAlpha = 0.3
      ctx.globalCompositeOperation = "source-over"
    } else if (drawingTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
    } else {
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
    }

    ctx.beginPath()
    const lastPoint = points[points.length - 1]
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"

    currentStrokeRef.current = [...points, point]
  }, [isDrawing, isDrawingMode, drawingColor, strokeWidth, drawingTool])

  const endDrawing = useCallback(() => {
    if (!isDrawing) {
      currentStrokeRef.current = []
      return
    }

    const points = currentStrokeRef.current
    if (points.length === 0) {
      setIsDrawing(false)
      return
    }

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}`,
      points,
      color: drawingColor,
      width: strokeWidth,
      tool: drawingTool,
    }

    updatePage({ drawings: [...(page.drawings ?? []), newStroke] })
    setIsDrawing(false)
    currentStrokeRef.current = []
  }, [isDrawing, drawingColor, strokeWidth, drawingTool, page.drawings, updatePage])

  const handleDrop = (e: React.DragEvent) => {
    const rect = editorRef.current?.getBoundingClientRect()
    handleImageDrop(e, rect)
  }

  const handleImageTouchMove = (e: React.TouchEvent) => {
    const rect = editorRef.current?.getBoundingClientRect()
    handleTouchMove(e, rect)
  }

  const fontClass = FONT_CLASS_BY_STYLE[fontStyle] ?? FONT_CLASS_BY_STYLE.sans

  return (
    <div
      ref={editorRef}
      className={cn(
        "relative w-full max-w-[880px] mx-auto min-h-[720px] overflow-visible rounded-3xl border border-border/70 shadow-sm bg-card",
        template.isCustom && "bg-transparent"
      )}
      onMouseDown={() => onSetActive(pageIndex)}
      onTouchStart={() => onSetActive(pageIndex)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {template.customImageUrl && (
        <img
          src={template.customImageUrl || "/placeholder.svg"}
          alt="Custom template background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-primary/20">
            <p className="text-primary font-medium">Drop image here</p>
          </div>
        </div>
      )}

      <input
        ref={(el) => {
          fileInputRef.current = el
          onRegisterFileInput(pageIndex, el)
        }}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 z-[2]",
          isDrawingMode ? "cursor-crosshair" : "pointer-events-none"
        )}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />

      <div
        className={cn(
          "p-6 h-full max-w-[880px] mx-auto flex flex-col relative z-[1]",
          template.isCustom && "pt-20 pb-24 px-12",
          isDrawingMode && "pointer-events-none"
        )}
      >
        <input
          type="text"
          value={page.title}
          onChange={(e) => updatePage({ title: e.target.value })}
          onFocus={() => onSetActive(pageIndex)}
          placeholder={template.isCustom ? "" : "Untitled Note..."}
          className={cn(
            "w-full bg-transparent border-none outline-none mb-4",
            template.isCustom ? "placeholder:text-transparent" : "placeholder:text-muted-foreground/50",
            fontClass,
            fontStyle === "handwriting" ? "text-3xl" : "text-2xl font-semibold",
            template.isCustom && "text-foreground/80"
          )}
          style={{ color: textColor }}
        />
        <textarea
          value={page.content}
          onChange={(e) => updatePage({ content: e.target.value })}
          onFocus={() => onSetActive(pageIndex)}
          placeholder={template.isCustom ? "" : "Start writing your thoughts..."}
          className={cn(
            "w-full flex-1 min-h-[100vh] bg-transparent border-none outline-none resize-none",
            template.isCustom ? "placeholder:text-transparent" : "placeholder:text-muted-foreground/40",
            fontClass,
            template.isCustom && "text-foreground/80"
          )}
          style={{ color: textColor }}
        />
      </div>

      {page.images && page.images.length > 0 && page.images.map((img) => (
        <div
          key={img.id}
          draggable
          onDragStart={() => handleImageDragStart(img.id)}
          onTouchStart={(e) => handleTouchStart(e, img.id)}
          onTouchMove={handleImageTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            left: img.position?.x || 50,
            top: img.position?.y || 50,
          }}
          className="absolute group cursor-move z-[2] touch-none"
        >
          <div className="relative">
            <img
              src={img.url || "/placeholder.svg"}
              alt="Note attachment"
              className="w-full h-full rounded-xl shadow-lg border-4 border-white object-contain"
            />
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="p-1.5 bg-destructive text-white rounded-full shadow-md hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
              <GripVertical className="w-8 h-8 text-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


export const NoteEditor = forwardRef<{ getPages: () => PageContent[] }, NoteEditorProps>(
  function NoteEditor({ template: templateProp, fontStyle, initialPages, onPagesChange }, ref) {
  const editorRef = useRef<HTMLDivElement>(null)
  const textColorInputRef = useRef<HTMLInputElement>(null)
  const [expandLineWidth, setExpandLineWidth] = useState(false)
  const [textColor, setTextColor] = useState("#2b2b2b")
  
  // Use default template if null
  const template = templateProp || {
    id: 1,
    name: "Default",
    bgClass: "bg-[#faf8f3]",
    lineStyle: "plain" as const,
    accentColor: "#8b7355",
  }
  
  // Page management
  const {
    pages,
    setPages,
    currentPage,
    setCurrentPage,
    currentPageData,
    setTitle,
    setContent,
    addNewPage,
    getPages,
    updateCurrentPage,
  } = useNoteEditor({ initialPages, onChange: onPagesChange })

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const registerFileInput = useCallback((pageIndex: number, element: HTMLInputElement | null) => {
    fileInputRefs.current[pageIndex] = element
  }, [])

  const updatePage = useCallback((pageIndex: number, updates: Partial<PageContent>) => {
    setPages((prev) => prev.map((page, i) => (i === pageIndex ? { ...page, ...updates } : page)))
  }, [setPages])

  // Expose getPages method via ref
  useImperativeHandle(ref, () => ({
    getPages
  }))

  // Get current page data - with safety check
  const { title = "", content = "", images = [], drawings = [] } = currentPageData || {}

  // Image state updater function
  const setImages = (
    updater: ImageBlock[] | ((prev: ImageBlock[]) => ImageBlock[])
  ) => {
    setPages((prev) =>
      prev.map((page, i) => {
        if (i !== currentPage) return page
        const newImages =
          typeof updater === "function" ? updater(page.images) : updater
        return { ...page, images: newImages }
      })
    )
  }

  // Image management
  const {
    isDragOver,
    fileInputRef,
    handleDrop: handleImageDrop,
    handleDragOver,
    handleDragLeave,
    handleImageDragStart,
    removeImage,
    handleFileSelect,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useImageManager({ onImagesChange: setImages, images })

  // Drawing management
  const {
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
  } = useDrawing({
    drawings,
    onDrawingsChange: (newDrawings) => updateCurrentPage({ drawings: newDrawings }),
    editorRef,
  })

  // Wrapper for handleDrop to pass editor rect
  const handleDrop = (e: React.DragEvent) => {
    const rect = editorRef.current?.getBoundingClientRect()
    handleImageDrop(e, rect)
  }

  // Wrapper for touch handlers to pass editor rect
  const handleImageTouchMove = (e: React.TouchEvent) => {
    const rect = editorRef.current?.getBoundingClientRect()
    handleTouchMove(e, rect)
  }

  const getFontClass = () => {
    return FONT_CLASS_BY_STYLE[fontStyle] ?? FONT_CLASS_BY_STYLE.sans
  }

  const getLineBackground = () => {
    return LINE_BACKGROUND_BY_STYLE[template.lineStyle] ?? ""
  }

  const drawingColorPresets = [
    "#2b2b2b",
    "#6b4b3a",
    "#8b7355",
    "#b67d5a",
    "#c89f6d",
    "#7a8f7a",
    "#7a8da6",
  ]

  useEffect(() => {
    // Disable hand gesture to refresh the page on mobile when in drawing mode
    const touchMoveHandler = (e: TouchEvent) => {
      if (isDrawingMode) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchmove", touchMoveHandler, { passive: false })

    return () => {
      document.removeEventListener("touchmove", touchMoveHandler)
    }
  }, [isDrawingMode])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2748%27%20height=%2748%27%20viewBox=%270%200%2048%2048%27%3E%3Ccircle%20cx=%271%27%20cy=%271%27%20r=%271%27%20fill=%27rgba(0,0,0,0.06)%27/%3E%3C/svg%3E')] bg-repeat bg-[length:48px_48px] border-b border-border">
        <div className="flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-[#f2e9ff] via-[#e8dcff] to-[#e2d1ff] px-2.5 py-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              if (template.isCustom) {
                const targetInput = fileInputRefs.current[currentPage] ?? fileInputRefs.current[0]
                targetInput?.click()
                return
              }
              fileInputRef.current?.click()
            }}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Add image"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="w-px h-6 bg-border/70" />
          
          {/* Drawing Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={cn(
              "flex items-center gap-2 h-8 px-3 rounded-full border border-border transition-colors",
              isDrawingMode 
                ? "bg-primary text-primary-foreground" 
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <PenTool className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border/70" />

          <div className="relative">
            <button
              type="button"
              onClick={() => textColorInputRef.current?.click()}
              className="flex items-center gap-2 h-8 px-3 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Change text color"
            >
              <span
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: textColor }}
              />
              {/* <span className="text-sm hidden sm:inline">Text color</span> */}
            </button>
            <input
              ref={textColorInputRef}
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="absolute left-0 top-1 mt-1 h-8 w-8 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* Drawing Tools - Desktop (in toolbar) */}
        {isDrawingMode && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-[#f2e9ff] via-[#e8dcff] to-[#e2d1ff] px-2.5 py-1 shadow-sm">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDrawingTool("pen")}
                  className={cn(
                    "h-8 w-8 rounded-full border border-border flex items-center justify-center transition-colors",
                    drawingTool === "pen"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Pen tool"
                >
                  <Pen className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawingTool("highlighter")}
                  className={cn(
                    "h-8 w-8 rounded-full border border-border flex items-center justify-center transition-colors",
                    drawingTool === "highlighter"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Highlighter tool"
                >
                  <Highlighter className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawingTool("eraser")}
                  className={cn(
                    "h-8 w-8 rounded-full border border-border flex items-center justify-center transition-colors",
                    drawingTool === "eraser"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Eraser tool"
                >
                  <Eraser className="h-4 w-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-border" />

              <div className="flex items-center gap-1">
                {drawingColorPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (drawingTool !== "eraser") {
                        setDrawingColor(preset)
                      }
                    }}
                    className={cn(
                      "h-7 w-7 rounded-full border border-border transition-transform",
                      drawingColor === preset && "ring-2 ring-primary/60",
                      drawingTool === "eraser" && "opacity-40 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: preset }}
                    aria-label={`Preset color ${preset}`}
                    disabled={drawingTool === "eraser"}
                  />
                ))}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (drawingTool !== "eraser") {
                        const input = document.getElementById("drawing-color-desktop") as HTMLInputElement | null
                        input?.click()
                      }
                    }}
                    className={cn(
                      "h-7 w-7 rounded-full border border-border shadow-inner transition-opacity",
                      drawingTool === "eraser" && "opacity-40 cursor-not-allowed"
                    )}
                    aria-label="Custom drawing color"
                    style={{ backgroundColor: drawingColor }}
                    disabled={drawingTool === "eraser"}
                  />
                  <input
                    id="drawing-color-desktop"
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="absolute left-0 top-0 h-7 w-7 cursor-pointer opacity-0"
                    disabled={drawingTool === "eraser"}
                  />
                </div>
              </div>

              <div className="w-px h-6 bg-border" />

              <div className="flex items-center gap-1">
                {[1, 2, 4, 8, 16].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setStrokeWidth(size)}
                    className={cn(
                      "h-8 w-8 rounded-full border border-border flex items-center justify-center transition-colors",
                      strokeWidth === size
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Stroke width ${size}`}
                  >
                    <span
                      className="block rounded-full bg-current"
                      style={{ width: size, height: size }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={clearDrawings}
              className="px-3 py-1.5 text-sm rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {!isDrawingMode && (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: template.accentColor }}
          />
        )}
      </div>

      {/* Drawing Tools - Mobile (floating right) */}
      {isDrawingMode && (
        <div className="sm:hidden fixed right-2 top-40 z-[10] rounded-2xl shadow-lg border border-border p-2 flex flex-col gap-2 bg-gradient-to-b from-[#f2e9ff] via-[#e8dcff] to-[#e2d1ff]">
          {/* <div className="w-px h-6 bg-border" /> */}
          <Pen className={cn(
            "w-10 h-10 cursor-pointer border border-border rounded-full p-2 transition-colors",
            drawingTool === "pen" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setDrawingTool("pen")}
          />
          <Highlighter className={cn(
            "w-10 h-10 cursor-pointer border border-border rounded-full p-2 transition-colors",
            drawingTool === "highlighter" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setDrawingTool("highlighter")}
          />

          <Eraser className={cn(
            "w-10 h-10 cursor-pointer border border-border rounded-full p-2 transition-colors",
            drawingTool === "eraser" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setDrawingTool("eraser")}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (drawingTool !== "eraser") {
                  const input = document.getElementById("drawing-color-mobile") as HTMLInputElement | null
                  input?.click()
                }
              }}
              className={cn(
                "w-10 h-10 rounded-full border border-border shadow-inner",
                drawingTool === "eraser" && "opacity-40 cursor-not-allowed"
              )}
              aria-label="Drawing color"
              style={{ backgroundColor: drawingColor }}
              disabled={drawingTool === "eraser"}
            />
            <input
              id="drawing-color-mobile"
              type="color"
              value={drawingColor}
              onChange={(e) => setDrawingColor(e.target.value)}
              className="absolute left-0 top-0 h-10 w-10 cursor-pointer opacity-0"
              disabled={drawingTool === "eraser"}
            />
          </div>

          {
            !expandLineWidth &&
            <Dot className={cn(
              "w-10 h-10 cursor-pointer border border-border text-muted-foreground hover:text-foreground rounded-full p-2 stroke-[5] bg-card",
            )}
            onClick={() => setExpandLineWidth(!expandLineWidth)}
            />}

            {
              expandLineWidth && (
                
                <div className="flex flex-col items-center mt-2 bg-card/90 p-2 rounded-2xl border border-border shadow-md">

                <button
                  type="button"
                  onClick={() => {
                    setStrokeWidth(1)
                    setExpandLineWidth(false)
                  }}
                  className="w-6 h-6 mb-1 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStrokeWidth(2)
                    setExpandLineWidth(false)
                  }}
                  className="w-6 h-6 mb-1 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStrokeWidth(4)
                    setExpandLineWidth(false)
                  }}
                  className="w-6 h-6 mb-1 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <div className="w-4 h-4 rounded-full bg-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStrokeWidth(8)
                    setExpandLineWidth(false)
                  }}
                  className="w-6 h-6 mb-1 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStrokeWidth(16)
                    setExpandLineWidth(false)
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-foreground" />
                </button>
                </div>
              ) 
            }
          
          <button
            type="button"
            onClick={clearDrawings}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>
      )}

      {/* Editor Area */}
      {template.isCustom ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
          <div className="flex flex-col gap-6">
            {pages.map((page, pageIndex) => (
              <PageSection
                key={pageIndex}
                page={page}
                pageIndex={pageIndex}
                template={template}
                fontStyle={fontStyle}
                textColor={textColor}
                isDrawingMode={isDrawingMode}
                drawingTool={drawingTool}
                drawingColor={drawingColor}
                strokeWidth={strokeWidth}
                onUpdatePage={updatePage}
                onSetActive={setCurrentPage}
                onRegisterFileInput={registerFileInput}
              />
            ))}
          </div>
          <div className="flex justify-center pt-6 pb-3">
            <button
              type="button"
              onClick={addNewPage}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add page</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={editorRef}
          className={cn(
            "flex-1 relative overflow-hidden transition-all duration-300",
            !template.isCustom && template.bgClass,
            !template.isCustom && getLineBackground(),
            isDragOver && "ring-2 ring-primary ring-inset"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Custom Template Background */}
          {template.isCustom && template.customImageUrl && (
            <img
              src={template.customImageUrl || "/placeholder.svg"}
              alt="Custom template background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Drop Zone Indicator */}
          {isDragOver && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-card/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-primary/20">
                <p className="text-primary font-medium">Drop image here</p>
              </div>
            </div>
          )}

          {/* Canvas Layer for Drawing */}
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 z-[2]",
              isDrawingMode ? "cursor-crosshair" : "pointer-events-none"
            )}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />

          {/* Note Content */}
          <div className={cn(
            "p-6 h-full flex flex-col relative z-[1]",
            template.isCustom && "pt-20 pb-24 px-12",
            isDrawingMode && "pointer-events-none"
          )}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={template.isCustom ? "" : "Untitled Note..."}
              className={cn(
                "w-full bg-transparent border-none outline-none mb-4",
                template.isCustom ? "placeholder:text-transparent" : "placeholder:text-muted-foreground/50",
                getFontClass(),
                fontStyle === "handwriting"
                  ? "text-3xl"
                  : "text-2xl font-semibold",
                template.isCustom && "text-foreground/80"
              )}
              style={{ color: textColor }}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={template.isCustom ? "" : "Start writing your thoughts..."}
              className={cn(
                "w-full flex-1 bg-transparent border-none outline-none resize-none",
                template.isCustom ? "placeholder:text-transparent" : "placeholder:text-muted-foreground/40",
                getFontClass(),
                template.isCustom && "text-foreground/80"
              )}
              style={{ color: textColor }}
            />
          </div>

          {/* Draggable Images */}
          {images && images.length > 0 && images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleImageDragStart(img.id)}
              onTouchStart={(e) => handleTouchStart(e, img.id)}
              onTouchMove={handleImageTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                left: img.position?.x || 50,
                top: img.position?.y || 50,
              }}
              className="absolute group cursor-move z-[2] touch-none"
            >
              <div className="relative">
                <img
                  src={img.url || "/placeholder.svg"}
                  alt="Note attachment"
                  className="w-36 h-auto rounded-xl shadow-lg border-4 border-white object-contain"
                />
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="p-1.5 bg-destructive text-white rounded-full shadow-md hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
                  <GripVertical className="w-8 h-8 text-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
