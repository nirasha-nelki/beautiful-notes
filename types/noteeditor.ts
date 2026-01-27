import { PageContent } from "./page"

export interface NoteEditorProps {
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

export interface UseNoteEditorProps {
  initialPages?: PageContent[]
}