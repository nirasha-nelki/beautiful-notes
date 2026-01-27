import { DrawingStroke } from "./drawing"
import { ImageBlock } from "./image"

export interface PageContent {
  id?: string
  title: string
  content: string
  images: ImageBlock[]
  drawings?: DrawingStroke[]
}