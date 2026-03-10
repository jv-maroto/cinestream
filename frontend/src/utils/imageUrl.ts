export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

export function getImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}
