import { PageContent } from "./page"

export interface Note {
  id: string
  title: string
  preview: string
  created_at: string
  templateId: number
  accentColor: string
  pages?: PageContent[]
}

export interface NotesListProps {
  notes: Note[]
  activeNoteId: string | null
  onSelectNote: (id: string) => void
  onNewNote: () => void
  onDeleteNote: (id: string) => void
}