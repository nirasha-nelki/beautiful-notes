"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Menu, Settings, ChevronLeft, Sparkles, Save } from "lucide-react"
import { NoteEditor } from "@/components/note-editor"
import {
  TemplatePicker,
  templates,
  type Template,
} from "@/components/template-picker"
import { FontPicker, type FontStyle } from "@/components/font-picker"
import { NotesList } from "@/components/notes-list"
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

interface Note {
  id: string
  title: string
  preview: string
  date: string
  templateId: string
  accentColor: string
  pages?: PageContent[]
}

export default function NotesApp() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(
    templates[0]
  )
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [selectedFont, setSelectedFont] = useState<FontStyle>("handwriting")
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const editorRef = useRef<{ getPages: () => PageContent[] }>(null)

  // Load notes from JSON file on mount
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()
      if (data.notes && data.notes.length > 0) {
        setNotes(data.notes)
        setActiveNoteId(data.notes[0].id)
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveNotes = async () => {
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  const handleSaveCurrentNote = async () => {
    if (!activeNoteId || !editorRef.current) return
    
    // Get current content from editor
    const currentPages = editorRef.current.getPages()
    
    // Update the active note with current content
    const updatedNotes = notes.map(note => {
      if (note.id === activeNoteId) {
        // Extract preview from first page
        const preview = currentPages[0]?.content.slice(0, 50) || "No content"
        const title = currentPages[0]?.title || "Untitled Note"
        
        return {
          ...note,
          title,
          preview,
          pages: currentPages,
        }
      }
      return note
    })
    
    setNotes(updatedNotes)
    
    // Save to file
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: updatedNotes }),
      })
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const handleNewNote = () => {
    const now = new Date()
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "",
      preview: "",
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      templateId: selectedTemplate.id,
      accentColor: selectedTemplate.accentColor,
    }
    setNotes([newNote, ...notes])
    setActiveNoteId(newNote.id)
    setShowSidebar(false)
  }

  const handleAddCustomTemplate = (template: Template) => {
    setCustomTemplates((prev) => [...prev, template])
  }

  const handleRemoveCustomTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
    // If the removed template was selected, switch to default
    if (selectedTemplate.id === id) {
      setSelectedTemplate(templates[0])
    }
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
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Beautiful Notes
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeNoteId && (
            <button
              type="button"
              onClick={handleSaveCurrentNote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-all duration-200 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-accent/50 transition-all duration-200"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5 text-foreground/70" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <NoteEditor 
          key={activeNoteId || 'empty'}
          ref={editorRef}
          template={selectedTemplate} 
          fontStyle={selectedFont}
          initialPages={activeNoteId ? notes.find(n => n.id === activeNoteId)?.pages : undefined}
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
              setActiveNoteId(id)
              setShowSidebar(false)
            }}
            onNewNote={handleNewNote}
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
                  <span>Custom templates support multiple pages</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
