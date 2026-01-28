"use client"

import dynamic from "next/dynamic"
import { Sparkles } from "lucide-react"

// Loading component shown during SSR and initial hydration
function LoadingState() {
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

const NotesAppContent = dynamic(() => import("./notes-app-content"), {
  ssr: false,
  loading: () => <LoadingState />,
})

export default function NotesApp() {
  return <NotesAppContent />
}

// "use client"


