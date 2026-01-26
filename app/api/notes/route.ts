import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

function base64ToBuffer(base64: string) {
  const [, data] = base64.split(',')
  return Buffer.from(data, 'base64')
}

export async function GET() {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        *,
        pages (
          id,
          title,
          content,
          note_images (
            id,
            storage_path,
            x,
            y
          )
        )
      `)

    if (error) throw error

    // Re-shape to match old frontend format
    const formatted = notes.map(note => ({
      id: note.id,
      title: note.title,
      preview: note.preview,
      date: new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      templateId: note.template_id,
      accentColor: note.accent_color,
      pages: note.pages.map((page: any) => ({
        id: page.id,
        title: page.title,
        content: page.content,
        images: page.note_images.map((img: any) => ({
          id: img.id,
          url: supabase
            .storage
            .from('note-images')
            .getPublicUrl(img.storage_path).data.publicUrl,
          position: { x: img.x, y: img.y }
        }))
      }))
    }))

    return NextResponse.json({ notes: formatted })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to load notes' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json()

    for (const note of notes) {
      // 1. Save note
      await supabase.from('notes').upsert({
        id: note.id,
        title: note.title,
        preview: note.preview,
        template_id: note.templateId,
        accent_color: note.accentColor
      })

      // 2. Delete existing pages for this note (cascade deletes note_images)
      await supabase.from('pages').delete().eq('note_id', note.id)

      // 3. Pages
      for (const page of note.pages ?? []) {
        const { data: pageRow } = await supabase
          .from('pages')
          .insert({
            note_id: note.id,
            title: page.title,
            content: page.content
          })
          .select()
          .single()

        // 4. Images
        for (const img of page.images ?? []) {
          let storagePath = img.url

          if (img.url.startsWith('data:image')) {
            const buffer = base64ToBuffer(img.url)
            storagePath = `${note.id}/${img.id}.jpg`

            await supabase.storage
              .from('note-images')
              .upload(storagePath, buffer, {
                upsert: true,
                contentType: 'image/jpeg'
              })
          } else if (img.url.includes('supabase')) {
            // Extract storage path from public URL
            const urlObj = new URL(img.url)
            const pathParts = urlObj.pathname.split('/note-images/')
            storagePath = pathParts[1] || img.url
          }

          await supabase.from('note_images').insert({
            id: img.id,
            page_id: pageRow.id,
            storage_path: storagePath,
            x: img.position.x,
            y: img.position.y
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to save notes' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { note } = await req.json()

    // 1. Update note metadata
    await supabase.from('notes').update({
      title: note.title,
      preview: note.preview,
      date: note.date,
      template_id: note.templateId,
      accent_color: note.accentColor
    }).eq('id', note.id)

    // 2. Fetch existing pages
    const { data: pages } = await supabase
      .from('pages')
      .select('id')
      .eq('note_id', note.id)

    // 3. Delete images from storage
    for (const page of pages ?? []) {
      const { data: images } = await supabase
        .from('note_images')
        .select('storage_path')
        .eq('page_id', page.id)

      if (images?.length) {
        await supabase.storage
          .from('note-images')
          .remove(images.map(i => i.storage_path))
      }
    }

    // 4. Delete DB records
    await supabase.from('note_images').delete()
      .in('page_id', pages?.map(p => p.id) ?? [])

    await supabase.from('pages').delete()
      .eq('note_id', note.id)

    // 5. Re-insert pages + images (same logic as POST)
    for (const page of note.pages ?? []) {
      const { data: pageRow } = await supabase
        .from('pages')
        .insert({
          note_id: note.id,
          title: page.title,
          content: page.content
        })
        .select()
        .single()

      for (const img of page.images ?? []) {
        let storagePath = img.url

        if (img.url.startsWith('data:image')) {
          const buffer = base64ToBuffer(img.url)
          storagePath = `${note.id}/${img.id}.jpg`

          await supabase.storage
            .from('note-images')
            .upload(storagePath, buffer, {
              upsert: true,
              contentType: 'image/jpeg'
            })
        } else if (img.url.includes('supabase')) {
          // Extract storage path from public URL
          const urlObj = new URL(img.url)
          const pathParts = urlObj.pathname.split('/note-images/')
          storagePath = pathParts[1] || img.url
        }

        await supabase.from('note_images').insert({
          id: img.id,
          page_id: pageRow.id,
          storage_path: storagePath,
          x: img.position.x,
          y: img.position.y
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    )
  }
}


