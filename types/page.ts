import { DrawingStroke } from "./drawing"
import { ImageBlock } from "./image"
import { NoteEditorProps } from "./noteeditor"

export interface PageContent {
  id?: string
  title: string
  content: string
  images: ImageBlock[]
  drawings?: DrawingStroke[]
}

export type EditorTemplate = NonNullable<NoteEditorProps["template"]>


export interface PageSectionProps {
  page: PageContent
  pageIndex: number
  template: EditorTemplate
  fontStyle: NoteEditorProps["fontStyle"]
  textColor: string
  isDrawingMode: boolean
  drawingTool: "pen" | "highlighter" | "eraser"
  drawingColor: string
  strokeWidth: number
  onUpdatePage: (pageIndex: number, updates: Partial<PageContent>) => void
  onSetActive: (pageIndex: number) => void
  onRegisterFileInput: (pageIndex: number, element: HTMLInputElement | null) => void
}