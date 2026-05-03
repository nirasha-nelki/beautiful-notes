"use client"

import { useState, useEffect } from "react"
import { Menu, Settings, ChevronLeft, Sparkles, Save, Printer, Loader2 } from "lucide-react"
import { NoteEditor } from "@/components/note-editor"
import { TemplatePicker } from "@/components/template-picker"
import { FontPicker } from "@/components/font-picker"
import { NotesList } from "@/components/notes-list"
import { cn } from "@/lib/utils"
import { useNotes } from "@/hooks/useNotes"
import { FontStyle } from "@/types/fonts"
import { Template } from "@/types/template"
import { useTemplates } from "@/hooks/useTemplates"

const CUSTOM_TEMPLATES_KEY = "customTemplates"

export default function NotesAppContent() {
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [selectedFont, setSelectedFont] = useState<FontStyle>("handwriting")
  const [showSettings, setShowSettings] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [isEditorOverflowing, setIsEditorOverflowing] = useState(false)

  // Load custom templates from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCustomTemplates(parsed)
      }
    } catch (error) {
      console.error("Failed to load custom templates from localStorage:", error)
    }
  }, [])

  // Save custom templates to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates))
    } catch (error) {
      console.error("Failed to save custom templates to localStorage:", error)
    }
  }, [customTemplates])

  const {
    templates: loadedTemplates,
    loadTemplates,
    isLoading: templatesLoading
  } = useTemplates()

  const {
    notes,
    setNotes,
    activeNoteId,
    handleSaveCurrentNote,
    editorRef,
    isLoading,
    selectedTemplate,
    setSelectedTemplate,
    showSidebar,
    setShowSidebar,
    handleNewNote,
    handleDeleteNote,
    activeNote,
    setActiveNote,
    hasUnsavedChanges,
    handleEditorPagesChange,
    handleSelectNote
  } = useNotes(loadedTemplates)

  // handle active note changes to update selected template if needed
  useEffect(() => {
    if (activeNote && loadedTemplates.length > 0) {
      console.log('Active note changed:', activeNote)
      const template = loadedTemplates.find(t => t.id === activeNote.templateId)
      if (template) {
        console.log('Setting template to:', template.name)
        setSelectedTemplate(template)
      }
    }
  }, [activeNote, loadedTemplates])

  // add a new custom template to the list and select it
  const handleAddCustomTemplate = (template: Template) => {
    setCustomTemplates((prev) => [...prev, template])
  }

  // removing a custom template from the list and localStorage
  const handleRemoveCustomTemplate = (id: number) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
    // If the removed template was selected, switch to default
    if (selectedTemplate && selectedTemplate.id === id && loadedTemplates.length > 0) {
      setSelectedTemplate(loadedTemplates[0])
    }
  }

  const handlePrint = async () => {
    if (!activeNoteId) return
    if (isEditorOverflowing) return

    const isCustomTemplate = Boolean(selectedTemplate?.isCustom)
    setPrintLoading(true)
    try {
      const response = await fetch("/api/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: activeNoteId,
          customTemplate: isCustomTemplate
            ? {
                name: selectedTemplate?.name,
                bgClass: selectedTemplate?.bgClass,
                lineStyle: selectedTemplate?.lineStyle,
                accentColor: selectedTemplate?.accentColor,
                customImageUrl: selectedTemplate?.customImageUrl,
              }
            : null,
        }),
      })

      if (!response.ok) {
        console.error("Failed to generate PDF")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `note-${activeNoteId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download PDF:", error)
    }
    finally {
      setPrintLoading(false)
    }
  }

  // Show loading state while templates are loading
  if (templatesLoading || loadedTemplates.length === 0) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-lg border-b border-border/40 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowSidebar(true)}
            className="p-2 rounded-lg hover:bg-accent/50 transition-all duration-200"
            aria-label="Open notes list"
          >
            <Menu className="w-5 h-5 text-foreground/70" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <img
                src="/Beautiful_Notes_logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              <span className="hidden sm:inline">
              Beautiful Notes 
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeNoteId && (
            <>
              <button
                type="button"
                onClick={handleSaveCurrentNote}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-all duration-200 shadow-sm"
              >
                <span className="relative flex items-center">
                  <Save className="w-4 h-4" />
                  {hasUnsavedChanges && (
                    <span
                      className="sm:hidden absolute -right-1.5 -top-2 h-2 w-2 rounded-full bg-red-500"
                      aria-label="Unsaved changes"
                    />
                  )}
                </span>
                <span className="hidden sm:inline">
                  {hasUnsavedChanges ? "Save changes" : "Saved"}
                </span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={printLoading || isEditorOverflowing}
                // title={
                //   isEditorOverflowing
                //     ? "Printing is disabled while the note is scrollable. Reduce content until it fits without scrolling."
                //     : "Print note"
                // }
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium transition-all duration-200",
                  "hover:bg-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary"
                )}
                aria-label="Print note"
              >
                {
                  printLoading ? (
                    <Loader2 className="w-4 h-4 text-secondary-foreground animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )
                }
                {/* <Printer className="w-4 h-4" /> */}
                <span className="hidden sm:inline">Print</span>
              </button>
              {/* {isEditorOverflowing && (
                <span className="hidden lg:inline text-xs text-muted-foreground max-w-[320px] text-red-500 bg-red-50 px-2 py-1 rounded-md">
                  To print, make sure the note fits without scrolling.
                </span>
              )} */}
            </>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-accent/50 transition-all duration-200"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5 text-foreground/70" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden print-area">
        <NoteEditor
          key={activeNoteId || 'empty'}
          ref={editorRef}
          template={selectedTemplate}
          fontStyle={selectedFont}
          initialPages={activeNoteId ? notes.find(n => n.id === activeNoteId)?.pages : undefined}
          onPagesChange={handleEditorPagesChange}
          onOverflowChange={setIsEditorOverflowing}

        />
      </main>

      {/* Sidebar Overlay - Notes List */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          showSidebar
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowSidebar(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-background/95 backdrop-blur-xl border-r border-border/40 shadow-2xl transition-transform duration-300 ease-out",
            showSidebar ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">My Notes</h2>
            <button
              type="button"
              onClick={() => setShowSidebar(false)}
              className="p-1.5 rounded-lg hover:bg-accent/50 transition-all duration-200"
              aria-label="Close notes list"
            >
              <ChevronLeft className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
          <NotesList
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={(id) => {
              handleSelectNote(id)
              setShowSidebar(false)
            }}
            onNewNote={handleNewNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </div>

      {/* Settings Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          showSettings
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowSettings(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-[90%] max-w-md bg-background/95 backdrop-blur-xl border-l border-border/40 shadow-2xl transition-transform duration-300 ease-out overflow-y-auto",
            showSettings ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="sticky top-0 flex items-center justify-between px-6 py-5 border-b border-border/40 bg-background/95 backdrop-blur-xl z-10">
            <h2 className="text-base font-semibold text-foreground">Customize</h2>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="p-1.5 rounded-lg hover:bg-accent/50 transition-all duration-200"
              aria-label="Close settings"
            >
              <ChevronLeft className="w-5 h-5 text-foreground/70 rotate-180" />
            </button>
          </div>
          <div className="p-6 space-y-8">
            <TemplatePicker
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              customTemplates={customTemplates}
              templates={loadedTemplates}
              onAddCustomTemplate={handleAddCustomTemplate}
              onRemoveCustomTemplate={handleRemoveCustomTemplate}
            />
            <FontPicker selectedFont={selectedFont} onSelect={setSelectedFont} />

            {/* Tips Section */}
            <div className="p-5 rounded-xl bg-accent/30 border border-border/40">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                Quick Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-primary/60 mt-2" />
                  <span>Drag & drop images directly onto your note</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-primary/60 mt-2" />
                  <span>Move images around by dragging them</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-primary/60 mt-2" />
                  <span>Upload custom templates for unique backgrounds</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-primary/60 mt-2" />
                  <span>Printing is enabled only when your note fits without scrolling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
