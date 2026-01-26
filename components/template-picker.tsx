"use client"

import React from "react"

import { useRef } from "react"
import { Check, Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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

export const templates: Template[] = [
  {
    id: "cream",
    name: "Vintage Cream",
    bgClass: "bg-[#faf8f3]",
    lineStyle: "lined",
    accentColor: "#8b7355",
    preview: "Warm cream paper with subtle lines",
  },
  {
    id: "blush",
    name: "Soft Blush",
    bgClass: "bg-[#fdf2f4]",
    lineStyle: "dotted",
    accentColor: "#c08b8b",
    preview: "Delicate pink with dot pattern",
  },
  {
    id: "sage",
    name: "Garden Sage",
    bgClass: "bg-[#f2f5f0]",
    lineStyle: "plain",
    accentColor: "#6b8e6b",
    preview: "Fresh green, clean canvas",
  },
  {
    id: "lavender",
    name: "Misty Lavender",
    bgClass: "bg-[#f5f3f7]",
    lineStyle: "grid",
    accentColor: "#9b8bb4",
    preview: "Soft purple with grid layout",
  },
  {
    id: "sky",
    name: "Morning Sky",
    bgClass: "bg-[#f0f5f9]",
    lineStyle: "lined",
    accentColor: "#7a9eb8",
    preview: "Serene blue with lines",
  },
  {
    id: "peach",
    name: "Warm Peach",
    bgClass: "bg-[#fef5ed]",
    lineStyle: "dotted",
    accentColor: "#d4a574",
    preview: "Cozy peach with dots",
  },
]

interface TemplatePickerProps {
  selectedTemplate: Template
  onSelect: (template: Template) => void
  customTemplates: Template[]
  onAddCustomTemplate: (template: Template) => void
  onRemoveCustomTemplate: (id: string) => void
}

export function TemplatePicker({
  selectedTemplate,
  onSelect,
  customTemplates,
  onAddCustomTemplate,
  onRemoveCustomTemplate,
}: TemplatePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const customTemplate: Template = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, "").slice(0, 20),
        bgClass: "",
        lineStyle: "plain",
        accentColor: "#d4a574",
        preview: "Custom template",
        isCustom: true,
        customImageUrl: event.target?.result as string,
      }
      onAddCustomTemplate(customTemplate)
      onSelect(customTemplate)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const allTemplates = [...templates, ...customTemplates]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
        Paper Style
      </h3>

      {/* Upload Custom Template Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
      >
        <Upload className="w-5 h-5" />
        <span className="text-sm font-medium">Upload Custom Template</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-3">
        {allTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={cn(
              "relative p-3 rounded-2xl border-2 transition-all duration-200 text-left group",
              selectedTemplate.id === template.id
                ? "border-primary shadow-md scale-[1.02]"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            )}
          >
            <div
              className={cn(
                "h-16 rounded-xl mb-2 relative overflow-hidden",
                !template.isCustom && template.bgClass
              )}
            >
              {/* Custom template image preview */}
              {template.isCustom && template.customImageUrl && (
                <>
                  <img
                    src={template.customImageUrl || "/placeholder.svg"}
                    alt={template.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Remove button for custom templates */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveCustomTemplate(template.id)
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Custom badge */}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-foreground/70 text-background text-[10px] rounded font-medium">
                    Custom
                  </div>
                </>
              )}
              {/* Line pattern preview for non-custom */}
              {!template.isCustom && template.lineStyle === "lined" && (
                <div className="absolute inset-2 flex flex-col justify-center gap-2">
                  <div className="h-px bg-current opacity-20" />
                  <div className="h-px bg-current opacity-20" />
                  <div className="h-px bg-current opacity-20" />
                </div>
              )}
              {!template.isCustom && template.lineStyle === "dotted" && (
                <div className="absolute inset-2 flex flex-wrap gap-2 items-center justify-center opacity-20">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full bg-current"
                    />
                  ))}
                </div>
              )}
              {!template.isCustom && template.lineStyle === "grid" && (
                <div className="absolute inset-2 grid grid-cols-4 grid-rows-3 gap-1 opacity-20">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="border border-current rounded-sm" />
                  ))}
                </div>
              )}
              {/* Accent dot for non-custom */}
              {!template.isCustom && (
                <div
                  className="absolute bottom-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: template.accentColor }}
                />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              {template.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {template.preview}
            </p>
            {selectedTemplate.id === template.id && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: template.accentColor }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
