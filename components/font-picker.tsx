"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type FontStyle = "handwriting" | "serif" | "sans"

interface FontOption {
  id: FontStyle
  name: string
  preview: string
  className: string
}

export const fontOptions: FontOption[] = [
  {
    id: "handwriting",
    name: "Handwritten",
    preview: "Beautiful thoughts",
    className: "font-[var(--font-handwriting)] text-xl",
  },
  {
    id: "serif",
    name: "Classic Serif",
    preview: "Elegant notes",
    className: "font-serif text-base",
  },
  {
    id: "sans",
    name: "Modern Sans",
    preview: "Clean & minimal",
    className: "font-sans text-sm",
  },
]

interface FontPickerProps {
  selectedFont: FontStyle
  onSelect: (font: FontStyle) => void
}

export function FontPicker({ selectedFont, onSelect }: FontPickerProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
        Writing Style
      </h3>
      <div className="flex flex-col gap-2">
        {fontOptions.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onSelect(font.id)}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
              selectedFont === font.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40 bg-card"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-foreground mb-1", font.className)}>
                  {font.preview}
                </p>
                <p className="text-xs text-muted-foreground font-sans">
                  {font.name}
                </p>
              </div>
              {selectedFont === font.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
