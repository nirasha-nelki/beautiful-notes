"use client"

import { Plus, FileText, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotesListProps } from "@/types/note"


export function NotesList({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
}: NotesListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4">
        <button
          type="button"
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-muted-foreground/70" />
            </div>
            <p className="text-foreground/70 text-sm font-medium">No notes yet</p>
            <p className="text-muted-foreground text-xs mt-1.5">
              Create your first note to get started
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "w-full p-4 rounded-lg transition-all duration-200 group relative",
                activeNoteId === note.id
                  ? "bg-primary/8 border border-primary/20 shadow-sm"
                  : "bg-card/50 border border-transparent hover:bg-accent/50 hover:border-border/40"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectNote(note.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: note.accentColor }}
                  />
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="font-medium text-foreground text-sm truncate">
                      {note.title || "Untitled Note"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1 leading-relaxed">
                      {note.preview || "No content"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2.5">
                      {note.created_at}
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNote(note.id)
                }}
                className="absolute top-4 right-4 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                aria-label="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
