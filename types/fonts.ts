export type FontStyle = "handwriting" | "serif" | "sans"

export interface FontOption {
  id: FontStyle
  name: string
  preview: string
  className: string
}

export interface FontPickerProps {
  selectedFont: FontStyle
  onSelect: (font: FontStyle) => void
}