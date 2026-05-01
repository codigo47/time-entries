import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

const etagCache = new Map<string, { etag: string; data: unknown }>()

export const api: AxiosInstance = axios.create({ baseURL })

api.interceptors.request.use((cfg) => {
  if ((cfg.method ?? 'get').toLowerCase() === 'get' && cfg.url) {
    const cached = etagCache.get(cfg.url)
    if (cached) {
      cfg.headers.set('If-None-Match', cached.etag)
    }
  }
  return cfg
})

api.interceptors.response.use(
  (res) => {
    if ((res.config.method ?? 'get').toLowerCase() === 'get' && res.config.url) {
      const etag = res.headers['etag'] as string | undefined
      if (etag) etagCache.set(res.config.url, { etag, data: res.data })
    }
    return res
  },
  (err) => {
    if (err.response?.status === 304 && err.config?.url) {
      const cached = etagCache.get(err.config.url)
      if (cached) {
        return Promise.resolve({ ...err.response, status: 200, data: cached.data })
      }
    }
    return Promise.reject(err)
  },
)

export interface ApiErrorBody {
  message: string
  errors?: Record<string, string[]>
}

export function fieldErrors(err: unknown): Record<string, string[]> {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as ApiErrorBody | undefined)?.errors ?? {}
  }
  return {}
}

export type RequestConfig = AxiosRequestConfig
