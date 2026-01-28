import { useState, useCallback, useRef } from "react"
import { ImageBlock } from "@/types/image"

interface UseImageManagerProps {
  onImagesChange: (updater: ImageBlock[] | ((prev: ImageBlock[]) => ImageBlock[])) => void
  images: ImageBlock[]
}

export function useImageManager({ onImagesChange, images }: UseImageManagerProps) {
  const [draggedImage, setDraggedImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent, editorRect: DOMRect | undefined) => {
      e.preventDefault()
      setIsDragOver(false)

      if (draggedImage) {
        // Moving existing image
        if (editorRect) {
          const x = e.clientX - editorRect.left - 75
          const y = e.clientY - editorRect.top - 50
          onImagesChange((prev) =>
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
        files.forEach((file, index) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const newImage: ImageBlock = {
              id: `img-${Date.now()}-${index}`,
              url: event.target?.result as string,
              position: {
                x: editorRect ? e.clientX - editorRect.left - 75 + index * 20 : 50,
                y: editorRect ? e.clientY - editorRect.top - 50 + index * 20 : 50,
              },
            }
            onImagesChange((prev) => [...prev, newImage])
          }
          reader.readAsDataURL(file)
        })
      }
    },
    [draggedImage, onImagesChange]
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
    onImagesChange((prev) => prev.filter((img) => img.id !== id))
  }, [onImagesChange])

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
          onImagesChange((prev) => [...prev, newImage])
        }
        reader.readAsDataURL(file)
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [onImagesChange]
  )

  // Touch event handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, imageId: string) => {
      const touch = e.touches[0]
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      
      setDraggedImage(imageId)
      setTouchOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
    },
    []
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent, editorRect: DOMRect | undefined) => {
      if (!draggedImage || !editorRect) return
      
      e.preventDefault()
      const touch = e.touches[0]
      const x = touch.clientX - editorRect.left - touchOffset.x
      const y = touch.clientY - editorRect.top - touchOffset.y
      
      onImagesChange((prev) =>
        prev.map((img) =>
          img.id === draggedImage ? { ...img, position: { x, y } } : img
        )
      )
    },
    [draggedImage, touchOffset, onImagesChange]
  )

  const handleTouchEnd = useCallback(() => {
    setDraggedImage(null)
  }, [])

  return {
    draggedImage,
    isDragOver,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleImageDragStart,
    removeImage,
    handleFileSelect,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
