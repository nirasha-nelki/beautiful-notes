"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { FontOption, FontPickerProps } from "@/types/fonts"

// export type FontStyle = "caveat" | "playfair" | "inter" | "merriweather" | "jetbrains" | "poppins"




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

// export const fontOptions: FontOption[] = [
//   {
//     id: "caveat",
//     name: "Caveat",
//     preview: "Thoughts written by hand",
//     className: "font-[var(--font-caveat)] text-xl tracking-wide",
//   },
//   {
//     id: "playfair",
//     name: "Playfair Display",
//     preview: "Timeless elegance",
//     className: "font-[var(--font-playfair)] text-base leading-relaxed",
//   },
//   {
//     id: "inter",
//     name: "Inter",
//     preview: "Clear & focused",
//     className: "font-[var(--font-inter)] text-sm leading-relaxed",
//   },
//   {
//     id: "merriweather",
//     name: "Merriweather",
//     preview: "Made for reading",
//     className: "font-[var(--font-merriweather)] text-base leading-7",
//   },
//   {
//     id: "jetbrains",
//     name: "JetBrains Mono",
//     preview: "Code & technical notes",
//     className: "font-[var(--font-jetbrains)] text-sm",
//   },
// ]

// export const fontOptions: FontOption[] = [
//   {
//     id: "poppins",
//     name: "Poppins",
//     preview: "Clean and friendly",
//     className: "font-[var(--font-poppins)] text-sm leading-relaxed",
//   },
//   {
//     id: "playfair",
//     name: "Playfair Display",
//     preview: "Elegant and expressive",
//     className: "font-[var(--font-playfair)] text-base leading-relaxed",
//   },
//   {
//     id: "caveat",
//     name: "Caveat",
//     preview: "Personal handwritten feel",
//     className: "font-[var(--font-caveat)] text-xl tracking-wide",
//   },
// ]


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
