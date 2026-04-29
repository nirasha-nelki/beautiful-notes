export type CustomTemplateData = {
  name?: string
  bgClass?: string
  lineStyle?: string
  accentColor?: string
  customImageUrl?: string
}

type CacheEntry = {
  data: CustomTemplateData
  expiresAt: number
}

const CACHE_TTL_MS = 2 * 60 * 1000
const cache = new Map<string, CacheEntry>()

function cleanupCache() {
  const now = Date.now()
  for (const [token, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(token)
    }
  }
}

function generateToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function setPrintTemplate(data: CustomTemplateData, ttlMs = CACHE_TTL_MS) {
  cleanupCache()
  const token = generateToken()
  cache.set(token, { data, expiresAt: Date.now() + ttlMs })
  return token
}

export function consumePrintTemplate(token?: string | null) {
  cleanupCache()
  if (!token) return null
  const entry = cache.get(token)
  if (!entry) return null
  cache.delete(token)
  return entry.data
}
