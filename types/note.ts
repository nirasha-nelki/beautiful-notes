import { PageContent } from "./page"

export interface Note {
  id: string
  title: string
  preview: string
  date: string
  templateId: string
  accentColor: string
  pages?: PageContent[]
}

export interface NotesListProps {
  notes: Note[]
  activeNoteId: string | null
  onSelectNote: (id: string) => void
  onNewNote: () => void
}