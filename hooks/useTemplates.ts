import { Template } from "@/types/template"
import { useEffect, useState } from "react"

export const useTemplates = () => {
    const [templates, setTemplates] = useState<Template[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadTemplates = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/templates')
            const data = await response.json()
            if (data.templates && data.templates.length > 0) {
                // console.log('Loaded templates:', data.templates)
                setTemplates(data.templates)
            }
        } catch (error) {
            console.error('Failed to load templates:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadTemplates()
    }, [])

    return {
        templates,
        loadTemplates,
        isLoading
    }
}