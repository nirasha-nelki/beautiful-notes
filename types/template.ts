export interface Template {
  id: string
  name: string
  bgClass: string
  lineStyle: "plain" | "lined" | "dotted" | "grid"
  accentColor: string
  preview: string
  isCustom?: boolean
  customImageUrl?: string
}

export interface TemplatePickerProps {
  selectedTemplate: Template
  onSelect: (template: Template) => void
  customTemplates: Template[]
  onAddCustomTemplate: (template: Template) => void
  onRemoveCustomTemplate: (id: string) => void
}