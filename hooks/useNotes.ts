// import { templates } from "@/components/template-picker"
import { Note } from "@/types/note"
import { PageContent } from "@/types/page"
import { Template } from "@/types/template"
import { useCallback, useEffect, useRef, useState } from "react"
  
export const useNotes = (templates: Template[]) => {
    const [notes, setNotes] = useState<Note[]>([])
    const [activeNote, setActiveNote] = useState<Note | null>(null)
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const editorRef = useRef<{ getPages: () => PageContent[] }>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [showSidebar, setShowSidebar] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const lastSavedPagesRef = useRef<PageContent[] | null>(null)
    
    // Initialize selectedTemplate when templates are loaded
    useEffect(() => {
        if (templates.length > 0 && !selectedTemplate) {
            setSelectedTemplate(templates[0])
        }
    }, [templates])
    
    const loadNotes = async () => {
        try {
        const response = await fetch('/api/notes')
        const data = await response.json()
        if (data.notes && data.notes.length > 0) {
            console.log('Loaded notes:', data.notes)
            setNotes(data.notes)
            setActiveNoteId(data.notes[0].id)
            setActiveNote(data.notes[0])

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

        console.log('Saving note:', updatedNote, 'Is existing:', isExistingNote)
        
        // Save to database
        try {
        const response = await fetch('/api/notes', {
            method: isExistingNote ? 'PUT' : 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(isExistingNote ? { note: updatedNote } : { notes: [updatedNote] }),
        })
        if (!response.ok) {
            throw new Error('Save request failed')
        }
        lastSavedPagesRef.current = currentPages
        setHasUnsavedChanges(false)
        } catch (error) {
        console.error('Failed to save note:', error)
        }
    }

    const handleNewNote = () => {
        if (!selectedTemplate) return
        
        const now = new Date()
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title: "",
            preview: "",
            created_at: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
        // console.log('Updated note template to:', selectedTemplate)
    }, [])

    // Update activeNote when activeNoteId changes
    useEffect(() => {
        if (activeNoteId) {
            const note = notes.find(n => n.id === activeNoteId)
            if (note) {
                setActiveNote(note)
            }
        } else {
            setActiveNote(null)
        }
    }, [activeNoteId, notes])

    // Get baseline pages for change detection
    const getBaselinePages = useCallback((note: Note | null): PageContent[] => {
        if (note?.pages && note.pages.length > 0) {
            return note.pages
        }
        return [{ title: "", content: "", images: [], drawings: [] }]
    }, [])

    // Check for unsaved changes whenever editor content changes
    const handleEditorPagesChange = useCallback((pages: PageContent[]) => {
        const baseline = lastSavedPagesRef.current
        if (!baseline) {
            setHasUnsavedChanges(false)
            return
        }
        const isDirty = JSON.stringify(pages) !== JSON.stringify(baseline)
        setHasUnsavedChanges(isDirty)
    }, [])

    // Handle note selection from sidebar
    const handleSelectNote = useCallback((noteId: string) => {
        if (noteId === activeNoteId) return
        const note = notes.find(n => n.id === noteId) || null
        setActiveNoteId(noteId)
        setActiveNote(note)
        lastSavedPagesRef.current = getBaselinePages(note)
        setHasUnsavedChanges(false)
    }, [notes, getBaselinePages, activeNoteId])

    useEffect(() => {
        // Whenever selectedTemplate changes, update the active note's templateId and accentColor
        if (!activeNoteId || !selectedTemplate) return

        setNotes((prevNotes) =>
        prevNotes.map((note) =>
            note.id === activeNoteId
            ? {
                ...note,
                templateId: selectedTemplate.id,
                accentColor: selectedTemplate.accentColor,
            }
            : note
        )
        )

        console.log('Updated note template to:', selectedTemplate)

        // // save changes immediately
        // handleSaveCurrentNote()

    }, [selectedTemplate])

    // Whenever activeNoteId or notes change, update the baseline pages for change detection
    useEffect(() => {
        const currentNote = activeNoteId ? notes.find(n => n.id === activeNoteId) || null : null
        lastSavedPagesRef.current = getBaselinePages(currentNote)
        setHasUnsavedChanges(false)
    }, [activeNoteId, notes, getBaselinePages])

    return { notes, 
        setNotes, activeNoteId, setActiveNoteId, activeNote, setActiveNote, isLoading, handleSaveCurrentNote, editorRef, selectedTemplate, setSelectedTemplate, showSidebar, setShowSidebar, handleNewNote, handleDeleteNote, hasUnsavedChanges, handleEditorPagesChange, handleSelectNote }

}