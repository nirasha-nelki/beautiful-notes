import { Template, templates } from "@/components/template-picker"
import { Note } from "@/types/note"
import { PageContent } from "@/types/page"
import { useEffect, useRef, useState } from "react"
  
export const useNotes = () => {
    const [notes, setNotes] = useState<Note[]>([])
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const editorRef = useRef<{ getPages: () => PageContent[] }>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<Template>(
        templates[0]
      )
    const [showSidebar, setShowSidebar] = useState(false)
    
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

    const handleSaveCurrentNote = async () => {
        if (!activeNoteId || !editorRef.current) return
        
        // Get current content from editor
        const currentPages = editorRef.current.getPages()
        
        // Find the current note
        const currentNote = notes.find(n => n.id === activeNoteId)
        if (!currentNote) return
        
        // Extract preview from first page
        const preview = currentPages[0]?.content.slice(0, 50) || "No content"
        const title = currentPages[0]?.title || "Untitled Note"
        
        const updatedNote = {
        ...currentNote,
        title,
        preview,
        pages: currentPages,
        }
        
        // Update local state
        const updatedNotes = notes.map(note => 
        note.id === activeNoteId ? updatedNote : note
        )
        setNotes(updatedNotes)
        
        // Check if this is a new note (has pages property or not)
        const isExistingNote = currentNote.pages !== undefined
        
        // Save to database
        try {
        await fetch('/api/notes', {
            method: isExistingNote ? 'PUT' : 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(isExistingNote ? { note: updatedNote } : { notes: [updatedNote] }),
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

    const handleDeleteNote = async (noteId: string) => {
        try {
        await fetch(`/api/notes?id=${noteId}`, {
            method: 'DELETE',
        })
        
        // Remove from local state
        const updatedNotes = notes.filter(note => note.id !== noteId)
        setNotes(updatedNotes)
        
        // If deleted note was active, select the first remaining note or null
        if (activeNoteId === noteId) {
            setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null)
        }
        } catch (error) {
        console.error('Failed to delete note:', error)
        }
    }

    useEffect(() => {
        loadNotes()
    }, [])

    return { notes, 
        setNotes, activeNoteId, setActiveNoteId, isLoading, handleSaveCurrentNote, editorRef, selectedTemplate, setSelectedTemplate, showSidebar, setShowSidebar, handleNewNote, handleDeleteNote }

}