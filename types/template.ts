export interface Template {
  id: number
  name: string
  bgClass: string
  lineStyle: "plain" | "lined" | "dotted" | "grid"
  accentColor: string
  preview: string
  isCustom?: boolean
  customImageUrl?: string
}
// export interface Template {
//   id: string
//   name: string
//   bgClass: string
//   lineStyle: "plain" | "lined" | "dotted" | "grid"
//   accentColor: string
//   preview: string
//   isCustom?: boolean
//   customImageUrl?: string
// }

export interface TemplatePickerProps {
  selectedTemplate: Template | null
  onSelect: (template: Template) => void
  customTemplates: Template[]
  templates: Template[]
  onAddCustomTemplate: (template: Template) => void
  onRemoveCustomTemplate: (id: number) => void
}