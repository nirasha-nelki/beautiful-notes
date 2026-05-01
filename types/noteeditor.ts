import type { FontStyle } from "./fonts"
import type { LineStyle } from "./template"
import { PageContent } from "./page"

export interface NoteEditorProps {
  template: {
    id: number | string
    name: string
    bgClass: string
    lineStyle: LineStyle
    accentColor: string
    isCustom?: boolean
    customImageUrl?: string
  } | null
  fontStyle: FontStyle
  initialPages?: PageContent[]
  onPagesChange?: (pages: PageContent[]) => void
}

export interface UseNoteEditorProps {
  initialPages?: PageContent[]
  onChange?: (pages: PageContent[]) => void
}