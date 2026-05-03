import type { FontStyle } from "@/types/fonts"
import type { LineStyle } from "@/types/template"

export const FONT_CLASS_BY_STYLE: Record<FontStyle, string> = {
  handwriting: "font-[var(--font-handwriting)] text-2xl leading-relaxed",
  serif: "font-serif text-lg leading-relaxed",
  sans: "font-sans text-base leading-relaxed",
}

export const LINE_BACKGROUND_BY_STYLE: Record<LineStyle, string> = {
  plain: "",
  lined: "bg-[linear-gradient(transparent_31px,#e8e0d5_31px)] bg-[length:100%_32px]",
  dotted: "bg-[radial-gradient(circle,#d4c8b8_1px,transparent_1px)] bg-[length:20px_20px]",
  grid: "bg-[linear-gradient(#e8e0d5_1px,transparent_1px),linear-gradient(90deg,#e8e0d5_1px,transparent_1px)] bg-[length:20px_20px]",
}