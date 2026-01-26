"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react"
import { ImageIcon, X, GripVertical, ChevronLeft, ChevronRight, Plus, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageBlock {
  id: string
  url: string
  position: { x: number; y: number }
}

interface PageContent {
  id?: string
  title: string
  content: string
  images: ImageBlock[]
}

interface NoteEditorProps {
  template: {
    id: string
    name: string
    bgClass: string
    lineStyle: string
    accentColor: string
    isCustom?: boolean
    customImageUrl?: string
  }
  fontStyle: string
  initialPages?: PageContent[]
}

export const NoteEditor = forwardRef<{ getPages: () => PageContent[] }, NoteEditorProps>(
  function NoteEditor({ template, fontStyle, initialPages }, ref) {
  const [pages, setPages] = useState<PageContent[]>(
    initialPages && initialPages.length > 0 
      ? initialPages 
      : [{ title: "", content: "", images: [] }]
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [draggedImage, setDraggedImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with initialPages when they change (switching notes)
  useEffect(() => {
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages)
      setCurrentPage(0)
    } else if (initialPages !== undefined) {
      // Reset to blank page for new notes
      setPages([{ title: "", content: "", images: [] }])
      setCurrentPage(0)
    }
  }, [initialPages])

  // Expose getPages method via ref
  useImperativeHandle(ref, () => ({
    getPages: () => pages
  }))

  // Get current page data
  const { title, content, images } = pages[currentPage]

  const updateCurrentPage = (updates: Partial<PageContent>) => {
    setPages((prev) =>
      prev.map((page, i) => (i === currentPage ? { ...page, ...updates } : page))
    )
  }

  const setTitle = (newTitle: string) => updateCurrentPage({ title: newTitle })
  const setContent = (newContent: string) => updateCurrentPage({ content: newContent })
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

  const addNewPage = () => {
    setPages((prev) => [...prev, { title: "", content: "", images: [] }])
    setCurrentPage(pages.length)
  }

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (draggedImage) {
        // Moving existing image
        const rect = editorRef.current?.getBoundingClientRect()
        if (rect) {
          const x = e.clientX - rect.left - 75
          const y = e.clientY - rect.top - 50
          setImages((prev) =>
            prev.map((img) =>
              img.id === draggedImage ? { ...img, position: { x, y } } : img
            )
          )
        }
        setDraggedImage(null)
        return
      }

      // Dropping new files
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      )

      if (files.length > 0) {
        const rect = editorRef.current?.getBoundingClientRect()
        files.forEach((file, index) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const newImage: ImageBlock = {
              id: `img-${Date.now()}-${index}`,
              url: event.target?.result as string,
              position: {
                x: rect ? e.clientX - rect.left - 75 + index * 20 : 50,
                y: rect ? e.clientY - rect.top - 50 + index * 20 : 50,
              },
            }
            setImages((prev) => [...prev, newImage])
          }
          reader.readAsDataURL(file)
        })
      }
    },
    [draggedImage]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleImageDragStart = useCallback((id: string) => {
    setDraggedImage(id)
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      files.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const newImage: ImageBlock = {
            id: `img-${Date.now()}-${index}`,
            url: event.target?.result as string,
            position: { x: 50 + index * 20, y: 100 + index * 20 },
          }
          setImages((prev) => [...prev, newImage])
        }
        reader.readAsDataURL(file)
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    []
  )

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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          <span className="text-sm">Add Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: template.accentColor }}
        />
      </div>

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

        {/* Note Content */}
        <div className={cn(
          "p-6 h-full flex flex-col relative z-[1]",
          template.isCustom && "pt-20 pb-24 px-12"
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
          />
        </div>

        {/* Draggable Images */}
        {images.map((img) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => handleImageDragStart(img.id)}
            style={{
              left: img.position.x,
              top: img.position.y,
            }}
            className="absolute group cursor-move z-[2]"
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
