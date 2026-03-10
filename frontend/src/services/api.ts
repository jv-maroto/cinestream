import axios from 'axios'
import { getMockResponse } from './mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// When backend is unavailable, fall back to mock data (dev only)
if (import.meta.env.DEV) {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        const method = (error.config?.method || 'get').toUpperCase()
        const url = error.config?.url || ''
        const params = error.config?.params

        const mockData = getMockResponse(method, url, params)
        if (mockData !== null) {
          console.log(`[Mock] ${method} ${url}`, mockData)
          return { data: mockData, status: 200, statusText: 'OK (Mock)', headers: {}, config: error.config }
        }
      }
      return Promise.reject(error)
    }
  )
}

export const mediaApi = {
  getAll: (params?: any) => api.get('/api/media', { params }),
  getById: (id: number) => api.get(`/api/media/${id}`),
  getStreamInfo: (id: number) => api.get(`/api/media/${id}/stream-info`),
  scan: () => api.post('/api/media/scan'),
  analyze: (id: number) => api.post(`/api/media/${id}/analyze`),
  reprocessBatch: (params?: any) => api.post('/api/media/reprocess-batch', null, { params }),
}

export const genresApi = {
  getAll: () => api.get('/api/genres'),
  getBySlug: (slug: string) => api.get(`/api/genres/${slug}`),
}

export const actorsApi = {
  getAll: (params?: any) => api.get('/api/actors', { params }),
  getById: (id: number) => api.get(`/api/actors/${id}`),
}

export const statsApi = {
  getGeneral: () => api.get('/api/stats/general'),
  getByGenres: () => api.get('/api/stats/by-genres'),
  getByActors: () => api.get('/api/stats/by-actors'),
  getByYear: () => api.get('/api/stats/by-year'),
  getRecent: (limit?: number) => api.get('/api/stats/recent', { params: { limit } }),
}

export const queueApi = {
  getStatus: () => api.get('/api/queue/status'),
  resetStuck: () => api.post('/api/queue/reset-stuck'),
}

export const seriesApi = {
  getAll: (params?: any) => api.get('/api/series', { params }),
  getByTitle: (title: string) => api.get(`/api/series/by-title/${encodeURIComponent(title)}`),
  getByTmdb: (tmdbId: number) => api.get(`/api/series/by-tmdb/${tmdbId}`),
}

export const animeApi = {
  getAll: (params?: any) => api.get('/api/anime', { params }),
  getByTitle: (title: string) => api.get(`/api/anime/by-title/${encodeURIComponent(title)}`),
  getByTmdb: (tmdbId: number) => api.get(`/api/anime/by-tmdb/${tmdbId}`),
}

export const documentariesApi = {
  getAll: (params?: any) => api.get('/api/documentaries', { params }),
  getByTmdb: (tmdbId: number) => api.get(`/api/documentaries/by-tmdb/${tmdbId}`),
}

export const watchHistoryApi = {
  getContinueWatching: (limit?: number) => api.get('/api/watch-history/continue-watching', { params: { limit } }),
  getRecentlyWatched: (limit?: number) => api.get('/api/watch-history/recently-watched', { params: { limit } }),
  recordWatch: (mediaId: number) => api.post(`/api/watch-history/${mediaId}`),
  updateProgress: (mediaId: number, position: number, duration: number) =>
    api.put(`/api/watch-history/${mediaId}/progress`, { position, duration }),
  getProgress: (mediaId: number) => api.get(`/api/watch-history/${mediaId}/progress`),
}

export { API_URL }
