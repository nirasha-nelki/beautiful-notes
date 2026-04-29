import { supabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

function getLineBackground(lineStyle: string) {
  switch (lineStyle) {
    case "lined":
      return {
        backgroundImage: "linear-gradient(transparent 31px, #e8e0d5 31px)",
        backgroundSize: "100% 32px",
        backgroundRepeat: "repeat",
      }
    case "dotted":
      return {
        backgroundImage: "radial-gradient(circle, #d4c8b8 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundRepeat: "repeat",
      }
    case "grid":
      return {
        backgroundImage:
          "linear-gradient(#e8e0d5 1px, transparent 1px), linear-gradient(90deg, #e8e0d5 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundRepeat: "repeat",
      }
    default:
      return {
        backgroundImage: "none",
      }
  }
}

function getBackgroundColor(bgClass?: string) {
  if (!bgClass) return undefined
  const match = bgClass.match(/#([0-9a-fA-F]{3,8})/)
  return match ? `#${match[1]}` : undefined
}

async function getCachedCustomTemplate(token?: string | null) {
  if (!token) return null

  const { data, error } = await supabase
    .from("print_template_cache")
    .select("data, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (error) {
    console.error("[print-page] failed to load custom template", error)
    return null
  }

  if (!data) return null

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0
  if (expiresAt && expiresAt <= Date.now()) {
    await supabase.from("print_template_cache").delete().eq("token", token)
    return null
  }

  await supabase.from("print_template_cache").delete().eq("token", token)
  return data.data ?? null
}

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ orientation?: string; customTemplateToken?: string }>
}) {
  const { id: noteId } = await params
  const { orientation, customTemplateToken } = (searchParams ? await searchParams : {}) as {
    orientation?: string
    customTemplateToken?: string
  }
  const isLandscape = orientation === "landscape"

  

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(
      `
      id,
      title,
      preview,
      template_id,
      accent_color,
      pages (
        id,
        title,
        content,
        drawings,
        note_images (
          id,
          storage_path,
          x,
          y
        )
      )
    `
    )
    .eq("id", noteId)
    .limit(1)

  if (notesError || !notes || notes.length === 0) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Failed to load note for printing.
      </div>
    )
  }

  const note = notes[0]

  const { data: templates } = await supabase
    .from("template")
    .select("id,name,bg_class,line_style,accent_color")
    .eq("id", note.template_id)
    .limit(1)

  let template = templates?.[0]
  if (!template) {
    const { data: fallbackTemplates } = await supabase
      .from("template")
      .select("id,name,bg_class,line_style,accent_color")
      .order("id", { ascending: true })
      .limit(1)

    template = fallbackTemplates?.[0]
  }
  const customTemplateData = await getCachedCustomTemplate(customTemplateToken)

  console.info("[print-page] template inputs", {
    noteId,
    orientation,
    customTemplateToken,
    hasCustomTemplateData: Boolean(customTemplateData),
    hasCustomImageUrl: Boolean(customTemplateData?.customImageUrl),
    templateId: template?.id,
  })
  const backgroundColor =
    getBackgroundColor(customTemplateData?.bgClass) ??
    getBackgroundColor(template?.bg_class) ??
    "#ffffff"
  const lineStyle = getLineBackground(
    customTemplateData?.lineStyle ?? template?.line_style ?? "plain"
  )
  const customImageUrl = customTemplateData?.customImageUrl
  const pageWidth = isLandscape ? 1123 : 794
  const pageHeight = isLandscape ? 794 : 1123

  const combinedBackgroundImage = [
  customImageUrl ? `url(${customImageUrl})` : null,
  lineStyle.backgroundImage
]
  .filter(Boolean)
  .join(", ")

  console.info("[print-page] background config", {
    backgroundColor,
    customImageUrlPresent: Boolean(customImageUrl),
    combinedBackgroundImage,
  })

  console.log({ customTemplateData, template })

  const pages = (note.pages ?? []).map((page: any) => ({
    id: page.id,
    title: page.title,
    content: page.content,
    drawings: page.drawings || [],
    images: (page.note_images ?? []).map((img: any) => ({
      id: img.id,
      url: supabase.storage.from("note-images").getPublicUrl(img.storage_path).data
        .publicUrl,
      position: { x: img.x, y: img.y },
    })),
  }))

  return (
    <div className="min-h-screen bg-white text-foreground">
      <style>{`
  @page { margin: 0; size: A4 ${isLandscape ? "landscape" : "portrait"}; }

  html, body {
    margin: 0;
    padding: 0;
  }

  .print-page {
    page-break-after: always;
    page-break-inside: avoid;

    /* ✅ CRITICAL: force background rendering */
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .print-page:last-child {
    page-break-after: auto;
  }
`}</style>
      <div className="mx-auto" style={{ width: `${pageWidth}px` }}>
        {pages.length === 0 && (
          <div
            className="print-page relative p-8 border border-border"
            style={{
  minHeight: `${pageHeight}px`,
  height: `${pageHeight}px`,
  backgroundColor,

  /* ✅ FIXED */
  backgroundImage: combinedBackgroundImage || undefined,
  backgroundSize: customImageUrl
    ? "cover"
    : lineStyle.backgroundSize,
  backgroundRepeat: customImageUrl
    ? "no-repeat"
    : lineStyle.backgroundRepeat,
  backgroundPosition: "0 0",

  border: "1px solid #e5e5e5"
}}
          >
            <div className="text-sm text-muted-foreground">Empty note</div>
          </div>
        )}
        {pages.map((page, index) => (
          <div
            key={page.id}
            className="print-page relative p-10 border border-border"
            style={{
  minHeight: `${pageHeight}px`,
  height: `${pageHeight}px`,
  backgroundColor,

  /* ✅ FIXED */
  backgroundImage: combinedBackgroundImage || undefined,
  backgroundSize: customImageUrl
    ? "cover"
    : lineStyle.backgroundSize,
  backgroundRepeat: customImageUrl
    ? "no-repeat"
    : lineStyle.backgroundRepeat,
  backgroundPosition: "0 0",

  border: "1px solid #e5e5e5"
}}
          >
            {page.drawings.length > 0 && (
              <svg
                className="absolute inset-0"
  style={{ pointerEvents: "none", background: "transparent" }}
                width={pageWidth}
                height={pageHeight}
                viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                preserveAspectRatio="none"
              >
                {page.drawings.map((stroke: any) => {
                  const points = stroke.points || []
                  if (points.length < 2) return null

                  const d = points
                    .map((point: any, i: number) =>
                      `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`
                    )
                    .join(" ")

                  const strokeColor =
                    stroke.tool === "eraser" ? backgroundColor : stroke.color
                  const strokeOpacity = stroke.tool === "highlighter" ? 0.3 : 1

                  return (
                    <path
                      key={stroke.id}
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeOpacity={strokeOpacity}
                      strokeWidth={stroke.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )
                })}
              </svg>
            )}
            <div className="text-2xl font-semibold mb-4" style={{ color: note.accent_color }}>
              {page.title || note.title || `Page ${index + 1}`}
            </div>
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {page.content || ""}
            </div>
            {page.images.map((img: any) => (
              <img
                key={img.id}
                src={img.url}
                alt="Note attachment"
                className="absolute rounded-xl shadow-lg border-4 border-white object-cover max-h-40"
                style={{ left: img.position.x || 50, top: img.position.y || 50, width: "144px" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
