"use client"

import type React from "react"
import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { X, GripVertical, ChevronLeft, ChevronRight, Plus, ImagePlus, Pen, Highlighter, Eraser, Slash, Dot } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageBlock } from "@/types/image"
import { PageContent } from "@/types/page"
import { NoteEditorProps } from "@/types/noteeditor"
import { useNoteEditor } from "@/hooks/useNoteEditor"
import { useImageManager } from "@/hooks/useImageManager"
import { useDrawing } from "@/hooks/useDrawing"
import { set } from "react-hook-form"


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
    currentPageData,
    setTitle,
    setContent,
    addNewPage,
    goToPage,
    getPages,
    updateCurrentPage,
  } = useNoteEditor({ initialPages, onChange: onPagesChange })

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
    switch (fontStyle) {
      case "handwriting":
        return "font-[var(--font-handwriting)] text-2xl leading-relaxed"
      case "serif":
        return "font-serif text-lg leading-relaxed"
      default:
        return "font-sans text-base leading-relaxed"
    }
  }

  const getLineBackground = () => {
    switch (template.lineStyle) {
      case "lined":
        return "bg-[linear-gradient(transparent_31px,#e8e0d5_31px)] bg-[length:100%_32px]"
      case "dotted":
        return "bg-[radial-gradient(circle,#d4c8b8_1px,transparent_1px)] bg-[length:20px_20px]"
      case "grid":
        return "bg-[linear-gradient(#e8e0d5_1px,transparent_1px),linear-gradient(90deg,#e8e0d5_1px,transparent_1px)] bg-[length:20px_20px]"
      default:
        return ""
    }
  }

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
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            <span className="text-sm hidden sm:inline"></span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="w-px h-6 bg-border" />
          
          {/* Drawing Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              isDrawingMode 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            {/* <span className="text-sm hidden sm:inline">Draw</span> */}
          </button>

          <div className="w-px h-6 bg-border" />

          <div className="relative">
            <button
              type="button"
              onClick={() => textColorInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
              aria-label="Change text color"
            >
              <span
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: textColor }}
              />
              <span className="text-sm hidden sm:inline">Text color</span>
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
            
            <select
              value={drawingTool}
              onChange={(e) => setDrawingTool(e.target.value as 'pen' | 'highlighter' | 'eraser')}
              className="px-2 py-1 text-sm rounded bg-secondary border border-border"
            >
              <option value="pen">Pen</option>
              <option value="highlighter">Highlighter</option>
              <option value="eraser">Eraser</option>
            </select>
            
            <input
              type="color"
              value={drawingColor}
              onChange={(e) => setDrawingColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
              disabled={drawingTool === 'eraser'}
            />
            
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="px-2 py-1 text-sm rounded bg-secondary border border-border"
            >
              <option value="1">Thin</option>
              <option value="2">Normal</option>
              <option value="4">Medium</option>
              <option value="8">Thick</option>
              <option value="16">Bold</option>
            </select>
            
            <button
              type="button"
              onClick={clearDrawings}
              className="px-3 py-1.5 text-sm rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
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
        <div className="sm:hidden fixed right-2 top-40 z-[10] bg-card/55 backdrop-blur-sm rounded-lg shadow-lg border border-border p-2 flex flex-col gap-2">
          {/* <div className="w-px h-6 bg-border" /> */}
              < Pen className={cn(
                "w-10 h-10 cursor-pointer border border-border rounded-md p-2",
                drawingTool === 'pen' ? 'bg-muted border backdrop-blur-sm' : 'text-muted-foreground hover:text-foreground'
              )} 
              onClick={() => setDrawingTool('pen')}
            />
            <Highlighter className={cn(
                "w-10 h-10 cursor-pointer border border-border rounded-md p-2",
                drawingTool === 'highlighter' ? 'bg-muted border backdrop-blur-sm' : 'text-muted-foreground hover:text-foreground'
              )} 
              onClick={() => setDrawingTool('highlighter')}
            />

            <Eraser className={cn(
                "w-10 h-10 cursor-pointer border border-border rounded-md p-2",
                drawingTool === 'eraser' ? 'bg-muted border backdrop-blur-sm' : 'text-muted-foreground hover:text-foreground'
              )} 
              onClick={() => setDrawingTool('eraser')}
            />

          
          <input
            type="color"
            value={drawingColor}
            onChange={(e) => setDrawingColor(e.target.value)}
            className="w-10 h-10 rounded-full cursor-pointer"
            disabled={drawingTool === 'eraser'}
          />

          {
            !expandLineWidth &&
            < Dot className={cn(
                "w-10 h-10 cursor-pointer border border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-2 stroke-[5]",
                // drawingTool === 'pen' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )} 
              onClick={() => setExpandLineWidth(!expandLineWidth)}
            />}

            {
              expandLineWidth && (
                
                <div className="flex flex-col items-center mt-2 bg-card/90 p-2 rounded-lg border border-border shadow-md">

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
            className="p-2 text-xs rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>
      )}

      {/* Editor Area */}
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
                className="w-36 h-auto rounded-xl shadow-lg border-4 border-white object-cover max-h-40"
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

        {/* Page Navigation for Custom Templates */}
        {template.isCustom && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border z-[3]">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-1.5 rounded-full hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {pages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentPage
                      ? "bg-primary scale-125"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pages.length - 1}
              className="p-1.5 rounded-full hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              onClick={addNewPage}
              className="p-1.5 rounded-full hover:bg-accent transition-colors text-primary"
              aria-label="Add new page"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground ml-1">
              {currentPage + 1}/{pages.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})
