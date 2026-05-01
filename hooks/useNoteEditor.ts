import { useState, useEffect, useCallback } from "react"
import { PageContent } from "@/types/page"
import { UseNoteEditorProps } from "@/types/noteeditor"

export function useNoteEditor({ initialPages, onChange }: UseNoteEditorProps = {}) {
  const [pages, setPages] = useState<PageContent[]>(
    initialPages && initialPages.length > 0 
      ? initialPages 
      : [{ title: "", content: "", images: [], drawings: [] }]
  )
  const [currentPage, setCurrentPage] = useState(0)

  // Sync with initialPages when they change (switching notes)
  useEffect(() => {
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages)
      setCurrentPage(0)

    } else if (initialPages !== undefined) {
      // Reset to blank page for new notes
      setPages([{ title: "", content: "", images: [], drawings: [] }])
      setCurrentPage(0)
    }
  }, [initialPages])

  useEffect(() => {
    if (onChange) {
      onChange(pages)
    }
  }, [pages, onChange])

  const updateCurrentPage = useCallback((updates: Partial<PageContent>) => {
    setPages((prev) =>
      prev.map((page, i) => (i === currentPage ? { ...page, ...updates } : page))
    )
  }, [currentPage])

  const setTitle = useCallback((newTitle: string) => {
    updateCurrentPage({ title: newTitle })
  }, [updateCurrentPage])

  const setContent = useCallback((newContent: string) => {
    updateCurrentPage({ content: newContent })
  }, [updateCurrentPage])

  const addNewPage = useCallback(() => {
    setPages((prev) => [...prev, { title: "", content: "", images: [], drawings: [] }])
    setCurrentPage(pages.length)
  }, [pages.length])

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex)
    }
  }, [pages.length])

  const getPages = useCallback(() => pages, [pages])

  return {
    pages,
    setPages,
    currentPage,
    setCurrentPage,
    currentPageData: pages[currentPage],
    updateCurrentPage,
    setTitle,
    setContent,
    addNewPage,
    goToPage,
    getPages,
  }
}
