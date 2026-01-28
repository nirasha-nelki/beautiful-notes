import { PageContent } from "./page"

export interface NoteEditorProps {
  template: {
    id: number | string
    name: string
    bgClass: string
    lineStyle: string
    accentColor: string
    isCustom?: boolean
    customImageUrl?: string
  } | null
  fontStyle: string
  initialPages?: PageContent[]
}

export interface UseNoteEditorProps {
  initialPages?: PageContent[]
}